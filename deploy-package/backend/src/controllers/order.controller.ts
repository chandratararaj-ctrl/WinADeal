import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';
import { OrderStatus } from '@prisma/client';
import { socketService } from '../services/socket.service';
import { calculateDistance } from '../utils/geo.utils';

// Get orders
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
    console.log(`[DEBUG] getOrders hit. User: ${req.user?.userId}, Selected Role: ${req.user?.selectedRole}`);
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.selectedRole; // Use selectedRole instead of role

    const where: any = {};

    // Filter based on selected role
    if (userRole === 'VENDOR') {
        const shop = await prisma.shop.findUnique({
            where: { userId },
        });

        if (!shop) {
            return errorResponse(res, 'Shop not found for this vendor', 404);
        }
        where.shopId = shop.id;
    } else if (userRole === 'CUSTOMER') {
        where.customerId = userId;
    }
    // Admin sees all

    // Filter by status
    if (status && status !== 'all') {
        where.status = status as OrderStatus;
    }

    const orders = await prisma.order.findMany({
        where,
        include: {
            customer: {
                select: {
                    name: true,
                    phone: true,
                },
            },
            shop: {
                select: {
                    name: true,
                    address: true,
                }
            },
            orderItems: {
                include: {
                    product: true,
                },
            },
            deliveryAddress: true,
            delivery: {
                include: {
                    deliveryPartner: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    phone: true,
                                }
                            }
                        }
                    }
                }
            },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
            createdAt: 'desc',
        },
    });

    const total = await prisma.order.count({ where });

    successResponse(res, {
        orders,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

// Get order by ID
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.selectedRole; // Use selectedRole

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            customer: {
                select: {
                    name: true,
                    phone: true,
                },
            },
            shop: {
                select: {
                    name: true,
                    address: true,
                    userId: true, // Needed for permission check
                }
            },
            orderItems: {
                include: {
                    product: true,
                },
            },
            deliveryAddress: true,
            delivery: {
                include: {
                    deliveryPartner: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    phone: true,
                                }
                            }
                        }
                    }
                }
            },
        },
    });

    if (!order) {
        return errorResponse(res, 'Order not found', 404);
    }

    // Permission check
    if (userRole === 'VENDOR') {
        if (order.shop.userId !== userId) {
            return errorResponse(res, 'Unauthorized', 403);
        }
    } else if (userRole === 'CUSTOMER') {
        if (order.customerId !== userId) {
            return errorResponse(res, 'Unauthorized', 403);
        }
    }

    successResponse(res, order);
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.selectedRole;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            shop: true,
        },
    });

    if (!order) {
        return errorResponse(res, 'Order not found', 404);
    }

    // Permission check
    if (userRole === 'VENDOR') {
        if (order.shop.userId !== userId) {
            return errorResponse(res, 'Unauthorized', 403);
        }
    }

    // Validate status transition (simplified)
    // TODO: Add stricter state machine logic if needed

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
            status: status as OrderStatus,
        },
    });

    // Notify Customer
    socketService.emitToUser(updatedOrder.customerId, 'order_update', {
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        message: `Order status updated to ${updatedOrder.status}`
    });

    // Notify Vendor (User ID of the shop owner)
    if (order.shop?.userId) {
        socketService.emitToUser(order.shop.userId, 'order_update', {
            orderId: updatedOrder.id,
            status: updatedOrder.status,
            message: `Order #${updatedOrder.orderNumber} updated to ${updatedOrder.status}`
        });
    }

    // Trigger auto-assignment when vendor accepts/prepares the order
    if (status === 'ACCEPTED' || status === 'READY') {
        console.log(`[AUTO-ASSIGN] Order ${id} status changed to ${status}, triggering auto-assignment`);

        // Import and call auto-assignment service
        import('../services/autoAssignment.service').then(({ autoAssignDeliveryPartner }) => {
            autoAssignDeliveryPartner(id).catch(error => {
                console.error(`[AUTO-ASSIGN] Failed to auto-assign delivery partner:`, error);
            });
        });
    }

    successResponse(res, updatedOrder, 'Order status updated successfully');
});

// Create order
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { shopId, items, deliveryAddressId, paymentMethod, couponCode, specialInstructions } = req.body;

    // Fetch Shop details first for commission calculation
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
        return errorResponse(res, 'Shop not found', 404);
    }

    // Calculate totals based on items
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const price = product.discountedPrice || product.price;
        subtotal += price * item.quantity;
        orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            price: price,
        });
    }



    // Fetch Delivery Settings
    // Fetch Delivery Settings
    const settingsList = await prisma.appConfig.findMany({
        where: { key: { in: ['DELIVERY_BASE_FEE', 'DELIVERY_PER_KM_FEE', 'DELIVERY_BASE_DISTANCE'] } }
    });
    const settingsMap: any = {
        DELIVERY_BASE_FEE: '20',
        DELIVERY_PER_KM_FEE: '10',
        DELIVERY_BASE_DISTANCE: '2'
    };
    settingsList.forEach(s => settingsMap[s.key] = s.value);

    const baseFee = parseFloat(settingsMap.DELIVERY_BASE_FEE);
    const perKmFee = parseFloat(settingsMap.DELIVERY_PER_KM_FEE);
    const baseDistance = parseFloat(settingsMap.DELIVERY_BASE_DISTANCE);

    // Fetch Delivery Address for coordinates
    const address = await prisma.address.findUnique({ where: { id: deliveryAddressId } });
    if (!address) {
        return errorResponse(res, 'Delivery address not found', 404);
    }

    // Calculate Delivery Fee
    let deliveryFee = baseFee;
    if (address.latitude && address.longitude && shop.latitude && shop.longitude) {
        const distance = calculateDistance(shop.latitude, shop.longitude, address.latitude, address.longitude);

        // Fee = Base + (max(0, Distance - BaseDistance) * PerKm)
        // Round to 2 decimal places
        const extraDistance = Math.max(0, distance - baseDistance);
        deliveryFee = Math.round((baseFee + (extraDistance * perKmFee)) * 100) / 100;

        console.log(`[ORDER] Calculated Delivery Fee: ${deliveryFee} (Dist: ${distance}km, BaseDist: ${baseDistance}km, Base: ${baseFee}, PerKm: ${perKmFee})`);
    } else {
        console.warn(`[ORDER] Missing coordinates for fee calculation. Using base fee.`);
    }

    // const deliveryFee = 50; // Removed hardcoded fee
    const tax = subtotal * 0.05; // 5% tax
    let total = subtotal + deliveryFee + tax;
    let discount = 0;

    // Coupon Logic
    if (couponCode) {
        const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode.toUpperCase() }
        });

        if (coupon) {
            const now = new Date();
            // Validation checks
            if (
                coupon.isActive &&
                now >= coupon.validFrom &&
                now <= coupon.validTo &&
                (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
                subtotal >= coupon.minOrderValue
            ) {
                // Calculate discount
                if (coupon.discountType === 'PERCENTAGE') {
                    discount = (subtotal * coupon.discountValue) / 100;
                    if (coupon.maxDiscount) {
                        discount = Math.min(discount, coupon.maxDiscount);
                    }
                } else {
                    discount = coupon.discountValue;
                }

                // Ensure discount doesn't exceed permissible amount
                discount = Math.min(discount, subtotal);

                // Apply discount
                total -= discount;

                // Increment usage
                await prisma.coupon.update({
                    where: { id: coupon.id },
                    data: { usedCount: { increment: 1 } }
                });
            }
        }
    }

    // Ensure total is non-negative
    total = Math.max(0, total);

    // Commission Calculation
    const commissionRate = shop.commissionRate || 0;
    const commissionAmount = (subtotal * commissionRate) / 100;
    // Vendor Earnings: Subtotal + Tax - Commission. (Discount usually borne by Vendor or Platform? Assuming Vendor for now unless platform coupon)
    // For simplicity: Vendor gets (Subtotal - Discount) + Tax - Commission
    // If discount > commission, vendor might lose money? 
    // Let's keep it simple: Vendor Earnings = (Subtotal + Tax) - Commission - Discount (if vendor bears it)
    // Let's assume Platform bears global coupons, Vendor bears specific coupons?
    // We'll calculate: Vendor Earnings = (Subtotal + Tax) - Commission. 
    // Discount is subtracted from Total user pays. If platform bears discount, platform pays vendor full.
    // Let's assume standard: Vendor Earnings = (Subtotal + Tax) - Commission.
    const vendorEarnings = (subtotal + tax) - commissionAmount;

    const order = await prisma.order.create({
        data: {
            orderNumber: `ORD-${Date.now()}`,
            customerId: userId!,
            shopId,
            status: 'PLACED',
            deliveryAddressId,
            subtotal,
            deliveryFee,
            tax,
            discount,
            total,
            commissionAmount,
            vendorEarnings,
            paymentMethod,
            couponCode: couponCode ? couponCode.toUpperCase() : null,
            specialInstructions,
            orderItems: {
                create: orderItemsData
            }
        }
    });

    // Notify Shop Owner (Vendor)
    if (shop.userId) {
        socketService.emitToUser(shop.userId, 'new_order', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            message: `New Order #${order.orderNumber} Received!`,
            order: order
        });
    }

    successResponse(res, order, 'Order created successfully', 201);
});

// Cancel Order
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.selectedRole;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            shop: {
                select: { userId: true, name: true }
            },
            customer: {
                select: { name: true, phone: true }
            }
        }
    });

    if (!order) {
        return errorResponse(res, 'Order not found', 404);
    }

    // Permission Check
    if (userRole === 'CUSTOMER' && order.customerId !== userId) {
        return errorResponse(res, 'Unauthorized to cancel this order', 403);
    }
    if (userRole === 'VENDOR' && order.shop.userId !== userId) {
        return errorResponse(res, 'Unauthorized to cancel this order', 403);
    }

    // Status Check
    const cancellableStatuses = ['PLACED', 'PENDING'];
    if (!cancellableStatuses.includes(order.status)) {
        return errorResponse(res, `Cannot cancel order in ${order.status} state`, 400);
    }

    // Refund Logic (Mock for now)
    let paymentStatus = order.paymentStatus;
    // let paymentTransactionId = order.paymentTransactionId;
    if (order.paymentStatus === 'SUCCESS') {
        // Here you would call Razorpay refund API
        // await razorpay.payments.refund(order.paymentTransactionId)
        console.log(`[REFUND] Initiating refund for Order ${order.orderNumber}, Amount: ${order.total}`);

        // Assume success
        paymentStatus = 'REFUNDED';
    }

    const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
            status: 'CANCELLED',
            paymentStatus: paymentStatus,
        }
    });

    // Notify Parties
    // Notify Vendor if Customer cancelled
    if (userRole === 'CUSTOMER' && order.shop?.userId) {
        socketService.emitToUser(order.shop.userId, 'order_update', {
            orderId: order.id,
            status: 'CANCELLED',
            message: `Customer cancelled Order #${order.orderNumber}`
        });
    }

    // Notify Customer if Vendor cancelled (or confirmation)
    socketService.emitToUser(order.customerId, 'order_update', {
        orderId: order.id,
        status: 'CANCELLED',
        message: userRole === 'VENDOR' ? `Shop cancelled your order. Reason: ${reason}` : `Your order #${order.orderNumber} has been cancelled.`
    });

    successResponse(res, updatedOrder, 'Order cancelled successfully');
});
