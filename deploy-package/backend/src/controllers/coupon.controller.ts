import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';

// Create a new coupon
export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
    const {
        code,
        discountType,
        discountValue,
        minOrderValue,
        maxDiscount,
        validFrom,
        validTo,
        usageLimit,
        isActive,
        categoryId
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
        where: { code }
    });

    if (existingCoupon) {
        return errorResponse(res, 'Coupon code already exists', 400);
    }

    const coupon = await prisma.coupon.create({
        data: {
            code: code.toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : null,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            usageLimit: usageLimit ? Number(usageLimit) : null,
            isActive: isActive !== undefined ? isActive : true,
            categoryId
        }
    });

    successResponse(res, coupon, 'Coupon created successfully', 201);
});

// Get all coupons (Admin/Vendor)
export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
    const { isActive, page = 1, limit = 20 } = req.query;

    const where: any = {};

    if (isActive !== undefined) {
        where.isActive = isActive === 'true';
    }

    const coupons = await prisma.coupon.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.coupon.count({ where });

    successResponse(res, {
        coupons,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
        }
    });
});

// Update a coupon
export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    const coupon = await prisma.coupon.update({
        where: { id },
        data: {
            ...data,
            code: data.code ? data.code.toUpperCase() : undefined,
            validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
            validTo: data.validTo ? new Date(data.validTo) : undefined
        }
    });

    successResponse(res, coupon, 'Coupon updated successfully');
});

// Delete a coupon
export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.coupon.delete({
        where: { id }
    });

    successResponse(res, null, 'Coupon deleted successfully');
});

// Verify/Apply Coupon logic
export const verifyCoupon = asyncHandler(async (req: Request, res: Response) => {
    const { code, orderTotal } = req.body;

    if (!code) {
        return errorResponse(res, 'Coupon code is required', 400);
    }

    const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() }
    });

    if (!coupon) {
        return errorResponse(res, 'Invalid coupon code', 404);
    }

    if (!coupon.isActive) {
        return errorResponse(res, 'Coupon is inactive', 400);
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTo) {
        return errorResponse(res, 'Coupon exists but is expired', 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return errorResponse(res, 'Coupon usage limit reached', 400);
    }

    if (orderTotal < coupon.minOrderValue) {
        return errorResponse(res, `Minimum order value of ₹${coupon.minOrderValue} required`, 400);
    }

    // Calculate discount
    let discountAmount = 0;

    if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (orderTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
    } else {
        discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed total
    discountAmount = Math.min(discountAmount, orderTotal);

    successResponse(res, {
        couponCode: coupon.code,
        discountAmount,
        finalTotal: orderTotal - discountAmount,
        message: 'Coupon applied successfully'
    });
});
