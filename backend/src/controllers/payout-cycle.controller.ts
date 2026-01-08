import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';
import { generatePayoutCycleName, getNextCycleDates } from '../utils/commission.utils';
import { PayoutCycleType } from '@prisma/client';

/**
 * Create a new payout cycle
 * Admin only
 */
export const createPayoutCycle = asyncHandler(async (req: Request, res: Response) => {
    const { cycleType, startDate, endDate } = req.body;

    // Validate cycle type
    if (!['WEEKLY', 'BIWEEKLY', 'MONTHLY'].includes(cycleType)) {
        return errorResponse(res, 'Invalid cycle type. Must be WEEKLY, BIWEEKLY, or MONTHLY', 400);
    }

    // Check for active cycle
    const activeCycle = await prisma.payoutCycle.findFirst({
        where: { status: 'ACTIVE' }
    });

    if (activeCycle) {
        return errorResponse(res, 'An active payout cycle already exists. Please close it before creating a new one.', 400);
    }

    // Calculate dates if not provided
    let cycleStartDate: Date;
    let cycleEndDate: Date;

    if (startDate && endDate) {
        cycleStartDate = new Date(startDate);
        cycleEndDate = new Date(endDate);
    } else {
        const dates = getNextCycleDates(cycleType as PayoutCycleType);
        cycleStartDate = dates.startDate;
        cycleEndDate = dates.endDate;
    }

    // Generate cycle name
    const name = generatePayoutCycleName(cycleType as PayoutCycleType, cycleStartDate);

    const cycle = await prisma.payoutCycle.create({
        data: {
            name,
            cycleType: cycleType as PayoutCycleType,
            startDate: cycleStartDate,
            endDate: cycleEndDate,
            status: 'ACTIVE'
        }
    });

    successResponse(res, cycle, 'Payout cycle created successfully', 201);
});

/**
 * Get all payout cycles with filters
 */
export const getPayoutCycles = asyncHandler(async (req: Request, res: Response) => {
    const { status, cycleType, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (cycleType) where.cycleType = cycleType as string;

    const cycles = await prisma.payoutCycle.findMany({
        where,
        include: {
            _count: {
                select: { payouts: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
    });

    const total = await prisma.payoutCycle.count({ where });

    successResponse(res, {
        cycles,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
});

/**
 * Get active payout cycle
 */
export const getActiveCycle = asyncHandler(async (req: Request, res: Response) => {
    const activeCycle = await prisma.payoutCycle.findFirst({
        where: { status: 'ACTIVE' },
        include: {
            _count: {
                select: { payouts: true }
            }
        }
    });

    if (!activeCycle) {
        return errorResponse(res, 'No active payout cycle found', 404);
    }

    successResponse(res, activeCycle);
});

/**
 * Get payout cycle by ID
 */
export const getPayoutCycleById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const cycle = await prisma.payoutCycle.findUnique({
        where: { id },
        include: {
            payouts: {
                include: {
                    shop: { select: { name: true } },
                    deliveryPartner: { include: { user: { select: { name: true } } } }
                }
            }
        }
    });

    if (!cycle) {
        return errorResponse(res, 'Payout cycle not found', 404);
    }

    successResponse(res, cycle);
});

/**
 * Calculate pending payouts for a cycle
 * Shows what payouts would be generated if cycle is closed now
 */
export const calculatePendingPayouts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const cycle = await prisma.payoutCycle.findUnique({ where: { id } });
    if (!cycle) {
        return errorResponse(res, 'Payout cycle not found', 404);
    }

    // Get all delivered orders in this cycle period
    const deliveredOrders = await prisma.order.findMany({
        where: {
            status: 'DELIVERED',
            updatedAt: {
                gte: cycle.startDate,
                lte: cycle.endDate
            }
        },
        include: {
            shop: {
                select: { id: true, name: true, commissionRate: true }
            }
        }
    });

    // Calculate vendor payouts
    const vendorPayouts = new Map<string, { shopId: string; shopName: string; grossAmount: number; commissionRate: number; netAmount: number; orderCount: number }>();

    for (const order of deliveredOrders) {
        const shopId = order.shopId;
        const existing = vendorPayouts.get(shopId);

        if (existing) {
            existing.grossAmount += order.vendorEarnings;
            existing.orderCount += 1;
        } else {
            vendorPayouts.set(shopId, {
                shopId,
                shopName: order.shop.name,
                grossAmount: order.vendorEarnings,
                commissionRate: 0, // Already deducted in order
                netAmount: order.vendorEarnings,
                orderCount: 1
            });
        }
    }

    // Get all completed deliveries in this cycle
    const completedDeliveries = await prisma.delivery.findMany({
        where: {
            order: {
                status: 'DELIVERED',
                updatedAt: {
                    gte: cycle.startDate,
                    lte: cycle.endDate
                }
            }
        },
        include: {
            deliveryPartner: {
                select: { id: true, commissionRate: true },
                include: { user: { select: { name: true } } }
            }
        }
    });

    // Calculate delivery partner payouts
    const partnerPayouts = new Map<string, { partnerId: string; partnerName: string; grossAmount: number; commissionRate: number; netAmount: number; deliveryCount: number }>();

    for (const delivery of completedDeliveries) {
        const partnerId = delivery.deliveryPartnerId;
        const existing = partnerPayouts.get(partnerId);

        if (existing) {
            existing.grossAmount += delivery.partnerEarnings;
            existing.deliveryCount += 1;
        } else {
            partnerPayouts.set(partnerId, {
                partnerId,
                partnerName: delivery.deliveryPartner.user.name,
                grossAmount: delivery.partnerEarnings,
                commissionRate: 0, // Already deducted
                netAmount: delivery.partnerEarnings,
                deliveryCount: 1
            });
        }
    }

    const vendorPayoutsList = Array.from(vendorPayouts.values());
    const partnerPayoutsList = Array.from(partnerPayouts.values());

    const totalVendorAmount = vendorPayoutsList.reduce((sum, p) => sum + p.netAmount, 0);
    const totalPartnerAmount = partnerPayoutsList.reduce((sum, p) => sum + p.netAmount, 0);

    successResponse(res, {
        cycle,
        vendors: {
            payouts: vendorPayoutsList,
            totalAmount: totalVendorAmount,
            count: vendorPayoutsList.length
        },
        deliveryPartners: {
            payouts: partnerPayoutsList,
            totalAmount: totalPartnerAmount,
            count: partnerPayoutsList.length
        },
        summary: {
            totalPayouts: vendorPayoutsList.length + partnerPayoutsList.length,
            totalAmount: totalVendorAmount + totalPartnerAmount
        }
    });
});

/**
 * Close payout cycle and generate payouts
 * Admin only
 */
export const closePayoutCycle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const cycle = await prisma.payoutCycle.findUnique({ where: { id } });
    if (!cycle) {
        return errorResponse(res, 'Payout cycle not found', 404);
    }

    if (cycle.status !== 'ACTIVE') {
        return errorResponse(res, 'Only active cycles can be closed', 400);
    }

    // Update cycle status to PROCESSING
    await prisma.payoutCycle.update({
        where: { id },
        data: { status: 'PROCESSING' }
    });

    try {
        // Get all delivered orders in this cycle
        const deliveredOrders = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                updatedAt: {
                    gte: cycle.startDate,
                    lte: cycle.endDate
                }
            },
            include: {
                shop: { select: { id: true, commissionRate: true } }
            }
        });

        // Aggregate vendor earnings
        const vendorEarnings = new Map<string, { grossAmount: number; commissionRate: number }>();

        for (const order of deliveredOrders) {
            const shopId = order.shopId;
            const existing = vendorEarnings.get(shopId);

            if (existing) {
                existing.grossAmount += order.vendorEarnings;
            } else {
                vendorEarnings.set(shopId, {
                    grossAmount: order.vendorEarnings,
                    commissionRate: 0 // Already deducted
                });
            }
        }

        // Create vendor payouts
        const vendorPayouts = [];
        for (const [shopId, earnings] of vendorEarnings.entries()) {
            vendorPayouts.push({
                shopId,
                payoutCycleId: id,
                grossAmount: earnings.grossAmount,
                commissionRate: earnings.commissionRate,
                amount: earnings.grossAmount,
                currency: 'INR',
                status: 'PENDING' as const,
                method: 'BANK_TRANSFER' as const
            });
        }

        // Get all completed deliveries
        const completedDeliveries = await prisma.delivery.findMany({
            where: {
                order: {
                    status: 'DELIVERED',
                    updatedAt: {
                        gte: cycle.startDate,
                        lte: cycle.endDate
                    }
                }
            },
            include: {
                deliveryPartner: { select: { id: true, commissionRate: true } }
            }
        });

        // Aggregate delivery partner earnings
        const partnerEarnings = new Map<string, { grossAmount: number; commissionRate: number }>();

        for (const delivery of completedDeliveries) {
            const partnerId = delivery.deliveryPartnerId;
            const existing = partnerEarnings.get(partnerId);

            if (existing) {
                existing.grossAmount += delivery.partnerEarnings;
            } else {
                partnerEarnings.set(partnerId, {
                    grossAmount: delivery.partnerEarnings,
                    commissionRate: 0 // Already deducted
                });
            }
        }

        // Create delivery partner payouts
        const partnerPayouts = [];
        for (const [partnerId, earnings] of partnerEarnings.entries()) {
            partnerPayouts.push({
                deliveryPartnerId: partnerId,
                payoutCycleId: id,
                grossAmount: earnings.grossAmount,
                commissionRate: earnings.commissionRate,
                amount: earnings.grossAmount,
                currency: 'INR',
                status: 'PENDING' as const,
                method: 'BANK_TRANSFER' as const
            });
        }

        // Bulk create payouts
        const allPayouts = [...vendorPayouts, ...partnerPayouts];
        await prisma.payout.createMany({
            data: allPayouts
        });

        const totalAmount = allPayouts.reduce((sum, p) => sum + p.amount, 0);

        // Update cycle to CLOSED
        const closedCycle = await prisma.payoutCycle.update({
            where: { id },
            data: {
                status: 'CLOSED',
                totalPayouts: allPayouts.length,
                totalAmount,
                processedAt: new Date()
            }
        });

        successResponse(res, {
            cycle: closedCycle,
            payoutsGenerated: allPayouts.length,
            totalAmount
        }, 'Payout cycle closed and payouts generated successfully');

    } catch (error) {
        // Rollback to ACTIVE if error occurs
        await prisma.payoutCycle.update({
            where: { id },
            data: { status: 'ACTIVE' }
        });
        throw error;
    }
});
