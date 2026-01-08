import { Request, Response } from 'express';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';
import { handleDeliveryResponse } from '../services/autoAssignment.service';
import prisma from '../config/database';

/**
 * Get pending delivery requests for a delivery partner
 */
export const getPendingRequests = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    // Get delivery partner record
    const partner = await prisma.deliveryPartner.findUnique({
        where: { userId: user.userId }
    });

    if (!partner) {
        return errorResponse(res, 'Delivery partner profile not found', 404);
    }

    // Get pending requests
    const requests = await prisma.deliveryRequest.findMany({
        where: {
            deliveryPartnerId: partner.id,
            status: 'PENDING',
            expiresAt: { gt: new Date() }
        },
        include: {
            order: {
                include: {
                    shop: {
                        select: {
                            name: true,
                            address: true,
                            latitude: true,
                            longitude: true
                        }
                    },
                    deliveryAddress: {
                        select: {
                            addressLine1: true,
                            addressLine2: true,
                            city: true,
                            latitude: true,
                            longitude: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    successResponse(res, requests, 'Pending requests retrieved successfully');
});

/**
 * Accept a delivery request
 */
export const acceptRequest = asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const user = (req as any).user;

    // Get delivery partner record
    const partner = await prisma.deliveryPartner.findUnique({
        where: { userId: user.userId }
    });

    if (!partner) {
        return errorResponse(res, 'Delivery partner profile not found', 404);
    }

    const result = await handleDeliveryResponse(requestId, partner.id, 'accept');

    if (!result.success) {
        return errorResponse(res, result.message, 400);
    }

    successResponse(res, null, result.message);
});

/**
 * Reject a delivery request
 */
export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const user = (req as any).user;

    // Get delivery partner record
    const partner = await prisma.deliveryPartner.findUnique({
        where: { userId: user.userId }
    });

    if (!partner) {
        return errorResponse(res, 'Delivery partner profile not found', 404);
    }

    const result = await handleDeliveryResponse(requestId, partner.id, 'reject');

    if (!result.success) {
        return errorResponse(res, result.message, 400);
    }

    successResponse(res, null, result.message);
});

/**
 * Get delivery request history
 */
export const getRequestHistory = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { page = 1, limit = 20 } = req.query;

    // Get delivery partner record
    const partner = await prisma.deliveryPartner.findUnique({
        where: { userId: user.userId }
    });

    if (!partner) {
        return errorResponse(res, 'Delivery partner profile not found', 404);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
        prisma.deliveryRequest.findMany({
            where: { deliveryPartnerId: partner.id },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        total: true,
                        deliveryFee: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit)
        }),
        prisma.deliveryRequest.count({
            where: { deliveryPartnerId: partner.id }
        })
    ]);

    successResponse(res, {
        requests,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    }, 'Request history retrieved successfully');
});

/**
 * Get penalty summary
 */
export const getPenaltySummary = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    // Get delivery partner record
    const partner = await prisma.deliveryPartner.findUnique({
        where: { userId: user.userId },
        select: {
            rejectionCount: true,
            penaltyAmount: true
        }
    });

    if (!partner) {
        return errorResponse(res, 'Delivery partner profile not found', 404);
    }

    // Get recent rejections
    const recentRejections = await prisma.deliveryRequest.findMany({
        where: {
            deliveryPartnerId: (await prisma.deliveryPartner.findUnique({
                where: { userId: user.userId }
            }))!.id,
            status: 'REJECTED'
        },
        include: {
            order: {
                select: {
                    orderNumber: true,
                    createdAt: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    successResponse(res, {
        totalRejections: partner.rejectionCount,
        totalPenalty: partner.penaltyAmount,
        recentRejections
    }, 'Penalty summary retrieved successfully');
});

/**
 * Update delivery partner location
 */
export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return errorResponse(res, 'Latitude and longitude are required', 400);
    }

    // Get delivery partner record
    const partner = await prisma.deliveryPartner.findUnique({
        where: { userId: user.userId }
    });

    if (!partner) {
        return errorResponse(res, 'Delivery partner profile not found', 404);
    }

    // Update location
    await prisma.deliveryPartner.update({
        where: { id: partner.id },
        data: {
            currentLatitude: latitude,
            currentLongitude: longitude,
            lastLocationUpdate: new Date()
        }
    });

    successResponse(res, null, 'Location updated successfully');
});
