import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';

/**
 * Get all city commissions
 */
export const getAllCityCommissions = asyncHandler(async (req: Request, res: Response) => {
    const commissions = await prisma.cityCommission.findMany({
        orderBy: {
            city: 'asc'
        }
    });

    successResponse(res, commissions, 'City commissions fetched successfully');
});

/**
 * Get commission for a specific city
 */
export const getCityCommission = asyncHandler(async (req: Request, res: Response) => {
    const { city } = req.params;

    const commission = await prisma.cityCommission.findUnique({
        where: { city }
    });

    if (!commission) {
        return errorResponse(res, 'Commission not found for this city', 404);
    }

    successResponse(res, commission, 'City commission fetched successfully');
});

/**
 * Create or update city commission
 */
export const upsertCityCommission = asyncHandler(async (req: Request, res: Response) => {
    const { city } = req.params;
    const {
        vendorCommissionRate,
        deliveryCommissionRate,
        minOrderAmount,
        baseDeliveryFee,
        perKmDeliveryFee,
        isActive
    } = req.body;

    // Validation
    if (vendorCommissionRate !== undefined && (vendorCommissionRate < 0 || vendorCommissionRate > 100)) {
        return errorResponse(res, 'Vendor commission rate must be between 0 and 100', 400);
    }

    if (deliveryCommissionRate !== undefined && (deliveryCommissionRate < 0 || deliveryCommissionRate > 100)) {
        return errorResponse(res, 'Delivery commission rate must be between 0 and 100', 400);
    }

    const commission = await prisma.cityCommission.upsert({
        where: { city },
        update: {
            vendorCommissionRate: vendorCommissionRate !== undefined ? vendorCommissionRate : undefined,
            deliveryCommissionRate: deliveryCommissionRate !== undefined ? deliveryCommissionRate : undefined,
            minOrderAmount: minOrderAmount !== undefined ? minOrderAmount : undefined,
            baseDeliveryFee: baseDeliveryFee !== undefined ? baseDeliveryFee : undefined,
            perKmDeliveryFee: perKmDeliveryFee !== undefined ? perKmDeliveryFee : undefined,
            isActive: isActive !== undefined ? isActive : undefined
        },
        create: {
            city,
            vendorCommissionRate: vendorCommissionRate || 10.0,
            deliveryCommissionRate: deliveryCommissionRate || 15.0,
            minOrderAmount,
            baseDeliveryFee,
            perKmDeliveryFee,
            isActive: isActive !== undefined ? isActive : true
        }
    });

    successResponse(res, commission, 'City commission updated successfully');
});

/**
 * Delete city commission
 */
export const deleteCityCommission = asyncHandler(async (req: Request, res: Response) => {
    const { city } = req.params;

    await prisma.cityCommission.delete({
        where: { city }
    });

    successResponse(res, null, 'City commission deleted successfully');
});

/**
 * Get commission rates for a city (with fallback to default)
 */
export const getCommissionRates = asyncHandler(async (req: Request, res: Response) => {
    const { city } = req.query;

    if (!city) {
        return errorResponse(res, 'City parameter is required', 400);
    }

    // Try to find city-specific commission
    let commission = await prisma.cityCommission.findFirst({
        where: {
            city: {
                equals: city as string,
                mode: 'insensitive'
            },
            isActive: true
        }
    });

    // If not found, return default rates
    if (!commission) {
        commission = {
            id: 'default',
            city: city as string,
            vendorCommissionRate: 10.0,
            deliveryCommissionRate: 15.0,
            minOrderAmount: null,
            baseDeliveryFee: null,
            perKmDeliveryFee: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    successResponse(res, commission, 'Commission rates fetched successfully');
});

/**
 * Bulk create/update city commissions
 */
export const bulkUpsertCityCommissions = asyncHandler(async (req: Request, res: Response) => {
    const { commissions } = req.body;

    if (!Array.isArray(commissions) || commissions.length === 0) {
        return errorResponse(res, 'Commissions array is required', 400);
    }

    const results = await Promise.all(
        commissions.map(async (comm: any) => {
            return prisma.cityCommission.upsert({
                where: { city: comm.city },
                update: {
                    vendorCommissionRate: comm.vendorCommissionRate,
                    deliveryCommissionRate: comm.deliveryCommissionRate,
                    minOrderAmount: comm.minOrderAmount,
                    baseDeliveryFee: comm.baseDeliveryFee,
                    perKmDeliveryFee: comm.perKmDeliveryFee,
                    isActive: comm.isActive !== undefined ? comm.isActive : true
                },
                create: {
                    city: comm.city,
                    vendorCommissionRate: comm.vendorCommissionRate || 10.0,
                    deliveryCommissionRate: comm.deliveryCommissionRate || 15.0,
                    minOrderAmount: comm.minOrderAmount,
                    baseDeliveryFee: comm.baseDeliveryFee,
                    perKmDeliveryFee: comm.perKmDeliveryFee,
                    isActive: comm.isActive !== undefined ? comm.isActive : true
                }
            });
        })
    );

    successResponse(res, results, `${results.length} city commissions updated successfully`);
});
