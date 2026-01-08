import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';

// Create a payout request or record a payout
export const createPayout = asyncHandler(async (req: Request, res: Response) => {
    const {
        amount,
        grossAmount,
        commissionRate,
        method,
        notes,
        shopId,
        deliveryPartnerId,
        status,
        transactionRef,
        payoutCycleId
    } = req.body;

    const userRole = req.user?.selectedRole;
    const userId = req.user?.userId;

    // Validation
    if (!amount || amount <= 0) {
        return errorResponse(res, 'Invalid amount', 400);
    }

    if (!shopId && !deliveryPartnerId) {
        return errorResponse(res, 'Recipient (shopId or deliveryPartnerId) is required', 400);
    }

    // Role checks
    if (userRole === 'VENDOR') {
        // Vendors can only request payouts for themselves
        const shop = await prisma.shop.findUnique({ where: { userId } });
        if (!shop) return errorResponse(res, 'Shop not found', 404);
        if (shopId && shopId !== shop.id) return errorResponse(res, 'Unauthorized shop payout request', 403);

        // Force status to PENDING for vendor requests
        // If they try to set it to PROCESSED, ignore it
    } else if (userRole === 'DELIVERY') {
        const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
        if (!partner) return errorResponse(res, 'Delivery partner not found', 404);
        if (deliveryPartnerId && deliveryPartnerId !== partner.id) return errorResponse(res, 'Unauthorized payout request', 403);
    }

    const payoutStatus = userRole === 'ADMIN' ? (status || 'PENDING') : 'PENDING';

    const payout = await prisma.payout.create({
        data: {
            amount: Number(amount),
            grossAmount: Number(grossAmount || amount),
            commissionRate: Number(commissionRate || 0),
            method: method || 'BANK_TRANSFER',
            notes,
            shopId,
            deliveryPartnerId,
            payoutCycleId,
            status: payoutStatus,
            transactionRef: payoutStatus === 'PROCESSED' ? transactionRef : undefined,
            processedAt: payoutStatus === 'PROCESSED' ? new Date() : undefined
        }
    });

    successResponse(res, payout, 'Payout record created', 201);
});

// Get payouts with filtering
export const getPayouts = asyncHandler(async (req: Request, res: Response) => {
    const {
        status,
        type, // 'VENDOR' or 'DELIVERY'
        shopId,
        deliveryPartnerId,
        startDate,
        endDate,
        page = 1,
        limit = 20
    } = req.query;

    const userRole = req.user?.selectedRole;
    const userId = req.user?.userId;

    const where: any = {};

    // Role-based filtering
    if (userRole === 'VENDOR') {
        const shop = await prisma.shop.findUnique({ where: { userId } });
        if (!shop) return errorResponse(res, 'Shop not found', 404);
        where.shopId = shop.id;
    } else if (userRole === 'DELIVERY') {
        const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
        if (!partner) return errorResponse(res, 'Delivery partner info not found', 404);
        where.deliveryPartnerId = partner.id;
    } else if (userRole === 'ADMIN') {
        // Admin filters
        if (shopId) where.shopId = shopId as string;
        if (deliveryPartnerId) where.deliveryPartnerId = deliveryPartnerId as string;
        if (type === 'VENDOR') where.shopId = { not: null };
        if (type === 'DELIVERY') where.deliveryPartnerId = { not: null };
    }

    if (status) where.status = status as string;

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const payouts = await prisma.payout.findMany({
        where,
        include: {
            shop: { select: { id: true, name: true, user: { select: { name: true, phone: true } } } },
            deliveryPartner: { select: { id: true, user: { select: { name: true, phone: true } } } },
            payoutCycle: { select: { id: true, name: true, cycleType: true, startDate: true, endDate: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
    });

    const total = await prisma.payout.count({ where });

    successResponse(res, {
        payouts,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
});

// Update payout status
export const updatePayoutStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, transactionRef, notes } = req.body;

    const payout = await prisma.payout.findUnique({ where: { id } });
    if (!payout) return errorResponse(res, 'Payout not found', 404);

    const updateData: any = { status };
    if (transactionRef) updateData.transactionRef = transactionRef;
    if (notes) updateData.notes = notes;
    if (status === 'PROCESSED' && !payout.processedAt) {
        updateData.processedAt = new Date();
    }

    const updatedPayout = await prisma.payout.update({
        where: { id },
        data: updateData
    });

    successResponse(res, updatedPayout, 'Payout status updated');
});

// Get stats
export const getPayoutStats = asyncHandler(async (req: Request, res: Response) => {
    // Admin only or filtered by role
    const userRole = req.user?.selectedRole;
    const userId = req.user?.userId;

    let whereShop: any = {};
    let whereDelivery: any = {};

    if (userRole === 'VENDOR') {
        const shop = await prisma.shop.findUnique({ where: { userId } });
        if (!shop) return errorResponse(res, 'Shop not found', 404);
        whereShop = { shopId: shop.id };
        whereDelivery = { id: 'impossible' }; // No delivery stats for vendor
    } else if (userRole === 'DELIVERY') {
        const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
        if (!partner) return errorResponse(res, 'Partner not found', 404);
        whereDelivery = { deliveryPartnerId: partner.id };
        whereShop = { id: 'impossible' };
    }

    // Pending Payouts
    const pendingPayouts = await prisma.payout.aggregate({
        where: { ...whereShop, ...whereDelivery, status: 'PENDING' },
        _sum: { amount: true },
        _count: true
    });

    // Processed Payouts
    const processedPayouts = await prisma.payout.aggregate({
        where: { ...whereShop, ...whereDelivery, status: 'PROCESSED' },
        _sum: { amount: true },
        _count: true
    });

    // Total Commission
    let totalCommission = 0;
    if (userRole === 'ADMIN') {
        const commissionAgg = await prisma.order.aggregate({
            where: { status: 'DELIVERED', ...whereShop }, // filtering shop orders if somehow admin selected a shop filter (not implemented in this func params but safe)
            _sum: { commissionAmount: true }
        });
        totalCommission = commissionAgg._sum.commissionAmount || 0;
    }

    successResponse(res, {
        pending: {
            count: pendingPayouts._count,
            amount: pendingPayouts._sum.amount || 0
        },
        processed: {
            count: processedPayouts._count,
            amount: processedPayouts._sum.amount || 0
        },
        commission: {
            amount: totalCommission
        }
    });
});

// Get Vendor Balances (Earnings vs Payouts)
export const getVendorBalances = asyncHandler(async (req: Request, res: Response) => {
    // 1. Get all shops with their users
    const shops = await prisma.shop.findMany({
        select: {
            id: true,
            name: true,
            user: {
                select: { name: true, phone: true }
            },
            bankAccountNumber: true,
            bankIfscCode: true
        }
    });

    const balances = await Promise.all(shops.map(async (shop) => {
        // Calculate Total Earnings from Orders
        const earningsAgg = await prisma.order.aggregate({
            where: {
                shopId: shop.id,
                status: 'DELIVERED', // Only delivered orders count
                // Optionally check payment status if online? 
                // For now assuming all DELIVERED orders are creditable
            },
            _sum: {
                vendorEarnings: true
            }
        });
        const totalEarnings = earningsAgg._sum.vendorEarnings || 0;

        // Calculate Total Payouts
        const payoutsAgg = await prisma.payout.aggregate({
            where: {
                shopId: shop.id,
                status: { notIn: ['REJECTED', 'FAILED'] } // Count PENDING and PROCESSED
            },
            _sum: {
                amount: true
            }
        });
        const totalPaid = payoutsAgg._sum.amount || 0;

        return {
            shopId: shop.id,
            shopName: shop.name,
            ownerName: shop.user.name,
            phone: shop.user.phone,
            bankDetails: {
                account: shop.bankAccountNumber,
                ifsc: shop.bankIfscCode
            },
            totalEarnings,
            totalPaid,
            pendingBalance: totalEarnings - totalPaid
        };
    }));

    // Sort by pending balance descending (highest debt first)
    balances.sort((a, b) => b.pendingBalance - a.pendingBalance);

    successResponse(res, balances, 'Vendor balances retrieved');
});

// Get Delivery Partner Balances
export const getDeliveryPartnerBalances = asyncHandler(async (req: Request, res: Response) => {
    // 1. Get all partners
    const partners = await prisma.deliveryPartner.findMany({
        select: {
            id: true,
            user: {
                select: { name: true, phone: true }
            },
            bankAccountNumber: true,
            bankIfscCode: true
        }
    });

    const balances = await Promise.all(partners.map(async (partner) => {
        // Calculate Earnings from Deliveries
        const earningsAgg = await prisma.delivery.aggregate({
            where: {
                deliveryPartnerId: partner.id,
                order: { status: 'DELIVERED' }
            },
            _sum: {
                partnerEarnings: true
            }
        });
        const totalEarnings = earningsAgg._sum.partnerEarnings || 0;

        // Calculate Payouts
        const payoutsAgg = await prisma.payout.aggregate({
            where: {
                deliveryPartnerId: partner.id,
                status: { notIn: ['REJECTED', 'FAILED'] }
            },
            _sum: {
                amount: true
            }
        });
        const totalPaid = payoutsAgg._sum.amount || 0;

        return {
            partnerId: partner.id,
            name: partner.user.name,
            phone: partner.user.phone,
            bankDetails: {
                account: partner.bankAccountNumber,
                ifsc: partner.bankIfscCode
            },
            totalEarnings,
            totalPaid,
            pendingBalance: totalEarnings - totalPaid
        };
    }));

    // Sort by pending balance descending
    balances.sort((a, b) => b.pendingBalance - a.pendingBalance);

    successResponse(res, balances, 'Delivery partner balances retrieved');
});
