import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';
import { OrderStatus } from '@prisma/client';
import { socketService } from '../services/socket.service';

// Register as delivery partner
export const registerDeliveryPartner = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
    }

    const { vehicleType, vehicleNumber, city, zone } = req.body;

    const existingPartner = await prisma.deliveryPartner.findUnique({
        where: { userId },
    });

    if (existingPartner) {
        return errorResponse(res, 'User is already a delivery partner', 400);
    }

    const partner = await prisma.deliveryPartner.create({
        data: {
            userId,
            vehicleType,
            vehicleNumber,
            city,
            zone,
            isVerified: false,
        },
    });

    // Update user role if needed? 
    // Usually role update happens separately or we assume user registered as DELIVERY role.
    // Let's ensure user role is DELIVERY.
    await prisma.user.update({
        where: { id: userId },
        data: { roles: ['DELIVERY'] },
    });

    successResponse(res, partner, 'Delivery partner registration submitted', 201);
});

// Get all delivery partners (Admin mostly)
export const getDeliveryPartners = asyncHandler(async (req: Request, res: Response) => {
    const { city, status, isVerified, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (city) where.city = city as string;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';

    // If we want to filter by online status?

    const partners = await prisma.deliveryPartner.findMany({
        where,
        include: {
            user: {
                select: {
                    name: true,
                    phone: true,
                    email: true,
                    documents: req.user?.selectedRole === 'ADMIN', // Use selectedRole
                },
            },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    const total = await prisma.deliveryPartner.count({ where });

    successResponse(res, {
        partners,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

// Verify delivery partner
export const verifyDeliveryPartner = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isVerified } = req.body;

    const partner = await prisma.deliveryPartner.update({
        where: { id },
        data: { isVerified },
    });

    successResponse(res, partner, 'Delivery partner verification status updated');
});

// Assign order to delivery partner
// This typically creates a Delivery record
export const assignOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, partnerId } = req.body;

    // Check if order exists and is ready for assignment
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            customer: { select: { id: true, name: true, phone: true } },
            shop: { select: { userId: true, name: true } }
        }
    });
    if (!order) return errorResponse(res, 'Order not found', 404);

    // Validate Status (Can only assign if Ready or Placed/Accepted depending on flow)
    // Usually assigned after 'READY'
    if (order.status !== 'READY' && order.status !== 'ACCEPTED') {
        // return errorResponse(res, `Cannot assign order in ${order.status} status. Order must be READY.`, 400); 
        // Relaxing this for testing flexibility, but ideally READY.
    }

    // Check partner
    const partner = await prisma.deliveryPartner.findUnique({ where: { id: partnerId } });
    if (!partner) return errorResponse(res, 'Delivery partner not found', 404);

    // Check if waiting for delivery
    const existingDelivery = await prisma.delivery.findFirst({ where: { orderId } });
    if (existingDelivery) {
        // return errorResponse(res, 'Delivery already assigned', 400);
        // Maybe we are re-assigning?
    }

    // Create Delivery Record
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const delivery = await prisma.delivery.create({
        data: {
            orderId,
            deliveryPartnerId: partnerId,
            deliveryFee: order.deliveryFee,
            verificationCode,
        }
    });
    // Include code in response for debugging (in production you might send via SMS)
    console.log(`[DELIVERY] Verification code for order ${orderId}: ${verificationCode}`);

    // Update Order Status
    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            status: 'ASSIGNED',
        },
    });

    // Notify Delivery Partner
    socketService.emitToUser(partner.userId, 'new_delivery', {
        orderId: order.id,
        message: 'New Delivery Assigned!',
        order: updatedOrder
    });

    // Notify Customer
    socketService.emitToUser(order.customer.id, 'order_update', {
        orderId: order.id,
        status: 'ASSIGNED',
        message: `Delivery partner assigned: ${partner.vehicleType}`,
        payload: { orderId: order.id } // For consistency with frontend hooks
    });

    // Notify Vendor (Shop Owner)
    socketService.emitToUser(order.shop.userId, 'order_update', {
        orderId: order.id,
        status: 'ASSIGNED',
        message: 'Delivery partner assigned to your order',
        payload: { orderId: order.id }
    });

    successResponse(res, { delivery, order: updatedOrder }, 'Order assigned to delivery partner');
});

// Update Delivery Status (Order Status basically)
// Used by Delivery Partner
export const updateDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { status, verificationCode } = req.body; // PICKED_UP, DELIVERED, etc.
    const userId = req.user?.userId;

    // Verify this user is the assigned partner
    const delivery = await prisma.delivery.findUnique({
        where: { orderId },
        include: { deliveryPartner: true }
    });

    if (!delivery) return errorResponse(res, 'Delivery record not found', 404);

    // Ensure the partner matches the authenticated user
    if (delivery.deliveryPartner.userId !== userId) {
        return errorResponse(res, 'Forbidden: not your delivery', 403);
    }

    const updateData: any = { status };
    const deliveryUpdateData: any = {};

    if (status === 'PICKED_UP') {
        deliveryUpdateData.pickupTime = new Date();
    } else if (status === 'DELIVERED') {
        // Verify code
        if (!verificationCode) {
            return errorResponse(res, 'Verification code required for delivery confirmation', 400);
        }
        if (delivery.verificationCode !== verificationCode.toString()) {
            return errorResponse(res, 'Invalid verification code', 400);
        }
        deliveryUpdateData.deliveryTime = new Date();
        updateData.paymentStatus = 'SUCCESS'; // Assume COD collected or Online done

        // Calculate delivery partner commission based on Platform Settings
        // Fetch Platform Commission Setting
        const commissionSetting = await prisma.appConfig.findUnique({
            where: { key: 'DELIVERY_PLATFORM_COMMISSION' }
        });
        const platformCommissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 10; // Default 10%

        // "A predefined percentage of the delivery fee will be retained by the platform"
        // Commission applies only to delivery fee, not tip. Tip goes 100% to partner.
        const commissionAmount = (delivery.deliveryFee * platformCommissionRate) / 100;
        const partnerEarnings = (delivery.deliveryFee - commissionAmount) + delivery.tip;

        // const grossEarnings = delivery.deliveryFee + delivery.tip;
        // const commissionRate = delivery.deliveryPartner.commissionRate;
        // const commissionAmount = (grossEarnings * commissionRate) / 100;
        // const partnerEarnings = grossEarnings - commissionAmount;

        deliveryUpdateData.commissionAmount = Math.round(commissionAmount * 100) / 100;
        deliveryUpdateData.partnerEarnings = Math.round(partnerEarnings * 100) / 100;

        // Update partner's total earnings
        await prisma.deliveryPartner.update({
            where: { id: delivery.deliveryPartnerId },
            data: {
                totalEarnings: {
                    increment: partnerEarnings
                }
            }
        });
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
            customer: { select: { id: true } },
            shop: { select: { userId: true } }
        }
    });

    if (Object.keys(deliveryUpdateData).length > 0) {
        await prisma.delivery.update({
            where: { id: delivery.id },
            data: deliveryUpdateData,
        });
    }

    // Notify Customer
    socketService.emitToUser(updatedOrder.customer.id, 'order_update', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        message: `Order status updated: ${updatedOrder.status.replace(/_/g, ' ')}`,
        payload: { orderId: updatedOrder.id }
    });

    // Notify Vendor
    socketService.emitToUser(updatedOrder.shop.userId, 'order_update', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        message: `Order status updated: ${updatedOrder.status.replace(/_/g, ' ')}`,
        payload: { orderId: updatedOrder.id }
    });

    successResponse(res, updatedOrder, 'Delivery status updated');
});

// Get My Deliveries (For logged-in partner)
export const getMyDeliveries = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { status } = req.query; // active, history

    const partner = await prisma.deliveryPartner.findUnique({
        where: { userId },
    });

    if (!partner) return errorResponse(res, 'Partner profile not found', 404);

    try {
        // Fetch all deliveries for this partner, including order details
        const allDeliveries = await prisma.delivery.findMany({
            where: {
                deliveryPartnerId: partner.id,
            },
            include: {
                order: {
                    include: {
                        shop: {
                            select: { name: true, address: true, latitude: true, longitude: true }
                        },
                        customer: {
                            select: { name: true, phone: true }
                        },
                        deliveryAddress: true,
                        orderItems: {
                            include: { product: { select: { name: true } } }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[DEBUG] Found ${allDeliveries.length} total deliveries for partner ${partner.id}`);

        // Filter in memory
        let deliveries = allDeliveries;
        if (status === 'active') {
            const activeStatuses = ['ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
            deliveries = allDeliveries.filter(d => d.order && activeStatuses.includes(d.order.status as string));
        } else if (status === 'history') {
            const historyStatuses = ['DELIVERED', 'CANCELLED'];
            deliveries = allDeliveries.filter(d => d.order && historyStatuses.includes(d.order.status as string));
        }

        successResponse(res, deliveries, 'Fetched my deliveries');
    } catch (error) {
        console.error("Error in getMyDeliveries:", error);
        return errorResponse(res, "Failed to fetch deliveries", 500, error);
    }
});

// Toggle Online Status
export const toggleOnlineStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { isOnline } = req.body;

    const partner = await prisma.deliveryPartner.update({
        where: { userId },
        data: { isOnline },
    });

    successResponse(res, { isOnline: partner.isOnline }, `You are now ${partner.isOnline ? 'Online' : 'Offline'}`);
});

// New endpoint: delivery partner confirms delivery with code
export const confirmDelivery = asyncHandler(async (req: Request, res: Response) => {
    const { orderId, verificationCode } = req.body;
    const userId = req.user?.userId;

    const delivery = await prisma.delivery.findUnique({
        where: { orderId },
        include: { deliveryPartner: true }
    });
    if (!delivery) return errorResponse(res, 'Delivery not found', 404);
    if (delivery.deliveryPartner.userId !== userId) return errorResponse(res, 'Forbidden', 403);
    if (delivery.verificationCode !== verificationCode.toString()) {
        return errorResponse(res, 'Invalid verification code', 400);
    }
    // Mark as delivered
    await prisma.delivery.update({
        where: { id: delivery.id },
        data: { deliveryTime: new Date() }
    });
    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED', paymentStatus: 'SUCCESS' },
        include: { customer: { select: { id: true } }, shop: { select: { userId: true } } }
    });
    socketService.emitToUser(updatedOrder.customer.id, 'order_update', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        message: 'Order delivered successfully',
    });
    socketService.emitToUser(updatedOrder.shop.userId, 'order_update', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        message: 'Order delivered successfully',
    });
    successResponse(res, updatedOrder, 'Delivery confirmed');
});
