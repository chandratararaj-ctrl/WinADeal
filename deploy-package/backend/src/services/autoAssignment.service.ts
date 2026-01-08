import prisma from '../config/database';
import { calculateDistance, extractCityFromAddress } from '../utils/distance';

interface AssignmentConfig {
    EXCLUSIVE_TIMEOUT_SECONDS: number;
    MAX_EXCLUSIVE_ATTEMPTS: number;
    BROADCAST_TIMEOUT_SECONDS: number;
    REJECTION_PENALTY_AMOUNT: number;
    MAX_SEARCH_RADIUS_KM: number;
}

const CONFIG: AssignmentConfig = {
    EXCLUSIVE_TIMEOUT_SECONDS: 15,
    MAX_EXCLUSIVE_ATTEMPTS: 3,
    BROADCAST_TIMEOUT_SECONDS: 300, // 5 minutes
    REJECTION_PENALTY_AMOUNT: 10, // ₹10 penalty per rejection
    MAX_SEARCH_RADIUS_KM: 10
};

/**
 * Main auto-assignment function
 * Called when order status changes to ACCEPTED/READY (by vendor)
 */
export async function autoAssignDeliveryPartner(orderId: string): Promise<void> {
    try {
        console.log(`[AUTO-ASSIGN] Starting assignment for order ${orderId}`);

        // Check if delivery already exists
        const existingDelivery = await prisma.delivery.findUnique({
            where: { orderId: orderId }
        });

        if (existingDelivery) {
            console.log(`[AUTO-ASSIGN] Delivery already assigned to partner ${existingDelivery.deliveryPartnerId}, skipping`);
            return;
        }

        // Get order details with shop location
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                shop: {
                    select: {
                        latitude: true,
                        longitude: true,
                        address: true
                    }
                },
                deliveryAddress: {
                    select: {
                        latitude: true,
                        longitude: true
                    }
                }
            }
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        if (!order.shop.latitude || !order.shop.longitude) {
            throw new Error(`Shop location not available for order ${orderId}`);
        }

        // Start exclusive assignment (round-robin)
        await startExclusiveAssignment(order);

    } catch (error) {
        console.error(`[AUTO-ASSIGN] Error assigning delivery partner:`, error);
        throw error;
    }
}

/**
 * Exclusive Assignment - Try partners one by one
 */
async function startExclusiveAssignment(order: any): Promise<void> {
    const shopLocation = {
        latitude: order.shop.latitude,
        longitude: order.shop.longitude
    };

    // Extract city from shop address
    const shopCity = extractCityFromAddress(order.shop.address || '');
    console.log(`[AUTO-ASSIGN] Shop city extracted: ${shopCity} from address: ${order.shop.address}`);

    // Find eligible delivery partners sorted by priority
    const eligiblePartners = await findEligiblePartners(
        shopLocation,
        shopCity,
        CONFIG.MAX_SEARCH_RADIUS_KM
    );

    if (eligiblePartners.length === 0) {
        console.log(`[AUTO-ASSIGN] No eligible partners found, switching to broadcast mode`);
        await startBroadcastMode(order);
        return;
    }

    console.log(`[AUTO-ASSIGN] Found ${eligiblePartners.length} eligible partners`);

    // Try partners one by one
    for (let i = 0; i < Math.min(eligiblePartners.length, CONFIG.MAX_EXCLUSIVE_ATTEMPTS); i++) {
        const partner = eligiblePartners[i];
        const attemptNumber = i + 1;

        console.log(`[AUTO-ASSIGN] Attempt ${attemptNumber}: Sending request to partner ${partner.id}`);

        const expiresAt = new Date(Date.now() + CONFIG.EXCLUSIVE_TIMEOUT_SECONDS * 1000);

        // Create delivery request
        const request = await prisma.deliveryRequest.create({
            data: {
                orderId: order.id,
                deliveryPartnerId: partner.id,
                isExclusive: true,
                attemptNumber,
                expiresAt
            }
        });

        // Emit WebSocket event to notify delivery partner
        // This will be handled by your WebSocket service
        global.io?.to(`delivery-${partner.userId}`).emit('delivery-request', {
            requestId: request.id,
            orderId: order.id,
            orderNumber: order.orderNumber,
            pickupLocation: {
                latitude: order.shop.latitude,
                longitude: order.shop.longitude
            },
            deliveryLocation: {
                latitude: order.deliveryAddress.latitude,
                longitude: order.deliveryAddress.longitude
            },
            deliveryFee: order.deliveryFee,
            expiresAt: request.expiresAt,
            isExclusive: true
        });

        // Wait for response or timeout
        const accepted = await waitForResponse(request.id, CONFIG.EXCLUSIVE_TIMEOUT_SECONDS);

        if (accepted) {
            console.log(`[AUTO-ASSIGN] Partner ${partner.id} accepted the request`);
            await createDeliveryAssignment(order.id, partner.id);
            return;
        }

        console.log(`[AUTO-ASSIGN] Partner ${partner.id} did not accept, trying next...`);
    }

    // If all exclusive attempts failed, switch to broadcast
    console.log(`[AUTO-ASSIGN] All exclusive attempts failed, switching to broadcast mode`);
    await startBroadcastMode(order);
}

/**
 * Broadcast Mode - Show to all nearby partners
 */
async function startBroadcastMode(order: any): Promise<void> {
    console.log(`[AUTO-ASSIGN] Starting broadcast mode for order ${order.id}`);

    const shopLocation = {
        latitude: order.shop.latitude,
        longitude: order.shop.longitude
    };

    // Extract city from shop address
    const shopCity = extractCityFromAddress(order.shop.address || '');
    console.log(`[AUTO-ASSIGN] Broadcast mode - Shop city: ${shopCity}`);

    const eligiblePartners = await findEligiblePartners(
        shopLocation,
        shopCity,
        CONFIG.MAX_SEARCH_RADIUS_KM
    );

    if (eligiblePartners.length === 0) {
        console.log(`[AUTO-ASSIGN] No partners available for broadcast`);
        // TODO: Notify admin/vendor
        return;
    }

    const expiresAt = new Date(Date.now() + CONFIG.BROADCAST_TIMEOUT_SECONDS * 1000);

    // Create broadcast requests for all eligible partners
    const requests = await Promise.all(
        eligiblePartners.map(partner =>
            prisma.deliveryRequest.create({
                data: {
                    orderId: order.id,
                    deliveryPartnerId: partner.id,
                    isExclusive: false,
                    attemptNumber: 1,
                    expiresAt
                }
            })
        )
    );

    // Broadcast to all partners
    eligiblePartners.forEach((partner, index) => {
        global.io?.to(`delivery-${partner.userId}`).emit('delivery-request', {
            requestId: requests[index].id,
            orderId: order.id,
            orderNumber: order.orderNumber,
            pickupLocation: {
                latitude: order.shop.latitude,
                longitude: order.shop.longitude
            },
            deliveryLocation: {
                latitude: order.deliveryAddress.latitude,
                longitude: order.deliveryAddress.longitude
            },
            deliveryFee: order.deliveryFee,
            expiresAt: requests[index].expiresAt,
            isExclusive: false
        });
    });

    console.log(`[AUTO-ASSIGN] Broadcast sent to ${eligiblePartners.length} partners`);
}

/**
 * Find eligible delivery partners based on location and availability
 */
async function findEligiblePartners(
    location: { latitude: number; longitude: number },
    city: string,
    maxRadiusKm: number
): Promise<any[]> {
    console.log(`[AUTO-ASSIGN] Searching for partners in city: ${city}`);

    // Get all online, verified partners
    // First try exact city match (case-insensitive)
    let partners = await prisma.deliveryPartner.findMany({
        where: {
            isOnline: true,
            isVerified: true,
            city: {
                equals: city,
                mode: 'insensitive'
            },
            currentLatitude: { not: null },
            currentLongitude: { not: null }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    // If no exact match, try partial match or nearby partners
    if (partners.length === 0 && city !== 'Unknown') {
        console.log(`[AUTO-ASSIGN] No exact city match, trying partial match for: ${city}`);

        partners = await prisma.deliveryPartner.findMany({
            where: {
                isOnline: true,
                isVerified: true,
                OR: [
                    {
                        city: {
                            contains: city,
                            mode: 'insensitive'
                        }
                    },
                    {
                        city: {
                            in: [city, city.toLowerCase(), city.toUpperCase()]
                        }
                    }
                ],
                currentLatitude: { not: null },
                currentLongitude: { not: null }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }

    // If still no partners, get all partners and filter by distance only
    if (partners.length === 0) {
        console.log(`[AUTO-ASSIGN] No city match, searching by distance only`);

        partners = await prisma.deliveryPartner.findMany({
            where: {
                isOnline: true,
                isVerified: true,
                currentLatitude: { not: null },
                currentLongitude: { not: null }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }

    console.log(`[AUTO-ASSIGN] Found ${partners.length} potential partners`);

    // Filter by distance and calculate priority score
    const partnersWithDistance = partners
        .map(partner => {
            const distance = calculateDistance(
                location.latitude,
                location.longitude,
                partner.currentLatitude!,
                partner.currentLongitude!
            );

            // Priority score: lower is better
            // Factors: distance (70%), rating (20%), total deliveries (10%)
            const distanceScore = distance / maxRadiusKm;
            const ratingScore = (5 - partner.rating) / 5;
            const deliveryScore = Math.min(partner.totalDeliveries, 100) / 100;

            const priorityScore = (distanceScore * 0.7) + (ratingScore * 0.2) + (deliveryScore * 0.1);

            return {
                ...partner,
                distance,
                priorityScore
            };
        })
        .filter(p => p.distance <= maxRadiusKm)
        .sort((a, b) => a.priorityScore - b.priorityScore);

    console.log(`[AUTO-ASSIGN] ${partnersWithDistance.length} partners within ${maxRadiusKm}km radius`);

    return partnersWithDistance;
}

/**
 * Wait for delivery partner response
 */
async function waitForResponse(requestId: string, timeoutSeconds: number): Promise<boolean> {
    const startTime = Date.now();
    const endTime = startTime + (timeoutSeconds * 1000);

    while (Date.now() < endTime) {
        const request = await prisma.deliveryRequest.findUnique({
            where: { id: requestId }
        });

        if (request?.status === 'ACCEPTED') {
            return true;
        }

        if (request?.status === 'REJECTED') {
            return false;
        }

        // Wait 500ms before checking again
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Timeout - mark request as timed out
    await prisma.deliveryRequest.update({
        where: { id: requestId },
        data: { status: 'TIMED_OUT' }
    });

    return false;
}

/**
 * Create actual delivery assignment
 */
async function createDeliveryAssignment(orderId: string, deliveryPartnerId: string): Promise<void> {
    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        throw new Error(`Order ${orderId} not found`);
    }

    const partner = await prisma.deliveryPartner.findUnique({
        where: { id: deliveryPartnerId }
    });

    if (!partner) {
        throw new Error(`Delivery partner ${deliveryPartnerId} not found`);
    }

    // Calculate earnings
    const platformCommission = (order.deliveryFee * partner.commissionRate) / 100;
    const partnerEarnings = order.deliveryFee - platformCommission;

    // Create delivery record
    await prisma.delivery.create({
        data: {
            orderId: order.id,
            deliveryPartnerId: partner.id,
            deliveryFee: order.deliveryFee,
            commissionAmount: platformCommission,
            partnerEarnings: partnerEarnings
        }
    });

    // Update order status
    await prisma.order.update({
        where: { id: orderId },
        data: { status: 'ASSIGNED' }
    });

    // Mark all other requests for this order as expired
    await prisma.deliveryRequest.updateMany({
        where: {
            orderId: orderId,
            status: 'PENDING'
        },
        data: { status: 'EXPIRED' }
    });

    console.log(`[AUTO-ASSIGN] Delivery assigned to partner ${deliveryPartnerId}`);
}

/**
 * Handle delivery partner response (accept/reject)
 */
export async function handleDeliveryResponse(
    requestId: string,
    partnerId: string,
    action: 'accept' | 'reject'
): Promise<{ success: boolean; message: string }> {
    const request = await prisma.deliveryRequest.findUnique({
        where: { id: requestId },
        include: {
            order: true
        }
    });

    if (!request) {
        return { success: false, message: 'Request not found' };
    }

    if (request.deliveryPartnerId !== partnerId) {
        return { success: false, message: 'Unauthorized' };
    }

    if (request.status !== 'PENDING') {
        return { success: false, message: 'Request already processed' };
    }

    // Check if request has expired
    if (new Date() > request.expiresAt) {
        await prisma.deliveryRequest.update({
            where: { id: requestId },
            data: { status: 'EXPIRED' }
        });
        return { success: false, message: 'Request expired' };
    }

    if (action === 'accept') {
        // Check if order is still available
        const existingDelivery = await prisma.delivery.findUnique({
            where: { orderId: request.orderId }
        });

        if (existingDelivery) {
            return { success: false, message: 'Order already assigned to another partner' };
        }

        // Accept the request
        await prisma.deliveryRequest.update({
            where: { id: requestId },
            data: {
                status: 'ACCEPTED',
                respondedAt: new Date()
            }
        });

        // Create delivery assignment
        await createDeliveryAssignment(request.orderId, partnerId);

        return { success: true, message: 'Request accepted successfully' };
    } else {
        // Reject the request
        await prisma.deliveryRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                respondedAt: new Date()
            }
        });

        // Apply penalty
        await applyRejectionPenalty(partnerId);

        return { success: true, message: 'Request rejected' };
    }
}

/**
 * Apply penalty for rejection
 */
async function applyRejectionPenalty(partnerId: string): Promise<void> {
    await prisma.deliveryPartner.update({
        where: { id: partnerId },
        data: {
            rejectionCount: { increment: 1 },
            penaltyAmount: { increment: CONFIG.REJECTION_PENALTY_AMOUNT }
        }
    });

    // Also record in the request
    await prisma.deliveryRequest.updateMany({
        where: {
            deliveryPartnerId: partnerId,
            status: 'REJECTED',
            penaltyApplied: false
        },
        data: {
            penaltyApplied: true,
            penaltyAmount: CONFIG.REJECTION_PENALTY_AMOUNT
        }
    });

    console.log(`[PENALTY] Applied ₹${CONFIG.REJECTION_PENALTY_AMOUNT} penalty to partner ${partnerId}`);
}

/**
 * Cleanup expired requests (run periodically)
 */
export async function cleanupExpiredRequests(): Promise<void> {
    const now = new Date();

    await prisma.deliveryRequest.updateMany({
        where: {
            status: 'PENDING',
            expiresAt: { lt: now }
        },
        data: { status: 'EXPIRED' }
    });
}
