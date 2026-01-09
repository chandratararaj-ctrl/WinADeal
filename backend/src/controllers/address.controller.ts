import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';

// Create new address
export const createAddress = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { label, addressLine1, addressLine2, city, state, pincode, latitude, longitude, isDefault } = req.body;

    // If isDefault is true, unset other default addresses for this user
    if (isDefault) {
        await prisma.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
        });
    }

    // Check if this is the first address, make it default automatically if not specified
    if (isDefault === undefined) {
        const count = await prisma.address.count({ where: { userId } });
        if (count === 0) {
            // isDefault = true; // Const assignment error if we just assign
            // We'll handle it in the create call
        }
    }

    const address = await prisma.address.create({
        data: {
            userId: userId!,
            label,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            latitude,
            longitude,
            isDefault: isDefault || (await prisma.address.count({ where: { userId } })) === 0,
        },
    });

    return successResponse(res, address, 'Address created successfully', 201);
});

// Get all addresses for user
export const getMyAddresses = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' }, // Default address first
    });

    return successResponse(res, addresses);
});

// Update address
export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { label, addressLine1, addressLine2, city, state, pincode, latitude, longitude, isDefault } = req.body;

    const address = await prisma.address.findFirst({
        where: { id, userId },
    });

    if (!address) {
        return errorResponse(res, 'Address not found', 404);
    }

    // If setting as default, unset others
    if (isDefault) {
        await prisma.address.updateMany({
            where: { userId, isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const updatedAddress = await prisma.address.update({
        where: { id },
        data: {
            label,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            latitude,
            longitude,
            isDefault,
        },
    });

    return successResponse(res, updatedAddress, 'Address updated successfully');
});

// Delete address
export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const address = await prisma.address.findFirst({
        where: { id, userId },
    });

    if (!address) {
        return errorResponse(res, 'Address not found', 404);
    }

    await prisma.address.delete({
        where: { id },
    });

    return successResponse(res, null, 'Address deleted successfully');
});
