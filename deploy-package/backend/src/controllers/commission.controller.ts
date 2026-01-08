import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';
import { isValidCommissionRate } from '../utils/commission.utils';

/**
 * Update vendor commission rate
 * Admin only
 */
export const updateVendorCommission = asyncHandler(async (req: Request, res: Response) => {
    const { shopId } = req.params;
    const { rate, reason } = req.body;
    const userId = req.user?.userId;

    // Validate rate
    if (!rate || !isValidCommissionRate(rate)) {
        return errorResponse(res, 'Invalid commission rate. Must be between 0 and 100', 400);
    }

    // Get current shop
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
        return errorResponse(res, 'Shop not found', 404);
    }

    const oldRate = shop.commissionRate;

    // Update shop commission rate
    const updatedShop = await prisma.shop.update({
        where: { id: shopId },
        data: { commissionRate: rate }
    });

    // Record history
    await prisma.commissionHistory.create({
        data: {
            entityType: 'VENDOR',
            entityId: shopId,
            oldRate,
            newRate: rate,
            changedBy: userId!,
            reason
        }
    });

    successResponse(res, updatedShop, 'Vendor commission rate updated successfully');
});

/**
 * Update delivery partner commission rate
 * Admin only
 */
export const updateDeliveryPartnerCommission = asyncHandler(async (req: Request, res: Response) => {
    const { partnerId } = req.params;
    const { rate, reason } = req.body;
    const userId = req.user?.userId;

    // Validate rate
    if (!rate || !isValidCommissionRate(rate)) {
        return errorResponse(res, 'Invalid commission rate. Must be between 0 and 100', 400);
    }

    // Get current partner
    const partner = await prisma.deliveryPartner.findUnique({ where: { id: partnerId } });
    if (!partner) {
        return errorResponse(res, 'Delivery partner not found', 404);
    }

    const oldRate = partner.commissionRate;

    // Update partner commission rate
    const updatedPartner = await prisma.deliveryPartner.update({
        where: { id: partnerId },
        data: { commissionRate: rate }
    });

    // Record history
    await prisma.commissionHistory.create({
        data: {
            entityType: 'DELIVERY_PARTNER',
            entityId: partnerId,
            oldRate,
            newRate: rate,
            changedBy: userId!,
            reason
        }
    });

    successResponse(res, updatedPartner, 'Delivery partner commission rate updated successfully');
});

/**
 * Get commission change history
 * Admin only - can filter by entity type and ID
 */
export const getCommissionHistory = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (entityType) where.entityType = entityType as string;
    if (entityId) where.entityId = entityId as string;

    const history = await prisma.commissionHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
    });

    const total = await prisma.commissionHistory.count({ where });

    // Enrich with entity names
    const enrichedHistory = await Promise.all(
        history.map(async (record) => {
            let entityName = 'Unknown';

            if (record.entityType === 'VENDOR') {
                const shop = await prisma.shop.findUnique({
                    where: { id: record.entityId },
                    select: { name: true }
                });
                entityName = shop?.name || 'Unknown Shop';
            } else if (record.entityType === 'DELIVERY_PARTNER') {
                const partner = await prisma.deliveryPartner.findUnique({
                    where: { id: record.entityId },
                    include: { user: { select: { name: true } } }
                });
                entityName = partner?.user?.name || 'Unknown Partner';
            }

            return {
                ...record,
                entityName
            };
        })
    );

    successResponse(res, {
        history: enrichedHistory,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
});

/**
 * Get default commission rates
 * Returns platform default rates
 */
export const getDefaultRates = asyncHandler(async (req: Request, res: Response) => {
    // Get average rates from existing entities
    const vendorStats = await prisma.shop.aggregate({
        _avg: { commissionRate: true }
    });

    const deliveryStats = await prisma.deliveryPartner.aggregate({
        _avg: { commissionRate: true }
    });

    successResponse(res, {
        vendor: {
            default: 20.0,
            average: vendorStats._avg.commissionRate || 20.0
        },
        deliveryPartner: {
            default: 15.0,
            average: deliveryStats._avg.commissionRate || 15.0
        }
    });
});
