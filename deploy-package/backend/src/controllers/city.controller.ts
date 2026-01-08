import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';

/**
 * Get all cities (for admin panel - includes inactive)
 */
export const getAllCities = asyncHandler(async (req: Request, res: Response) => {
    const cities = await prisma.city.findMany({
        orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' }
        ]
    });

    successResponse(res, cities, 'Cities fetched successfully');
});

/**
 * Get active cities only (for dropdowns in vendor/delivery registration)
 */
export const getActiveCities = asyncHandler(async (req: Request, res: Response) => {
    const cities = await prisma.city.findMany({
        where: {
            isActive: true
        },
        orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' }
        ],
        select: {
            id: true,
            name: true,
            state: true
        }
    });

    successResponse(res, cities, 'Active cities fetched successfully');
});

/**
 * Get available cities (cities with active shops)
 */
export const getAvailableCities = asyncHandler(async (req: Request, res: Response) => {
    // Get cities that have at least one verified shop
    const cities = await prisma.city.findMany({
        where: {
            isActive: true
        },
        orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' }
        ],
        select: {
            id: true,
            name: true,
            state: true
        }
    });

    // Return just the city names for backward compatibility
    const cityNames = cities.map(city => city.name);

    successResponse(res, cityNames, 'Available cities fetched successfully');
});

/**
 * Get shops by city
 */
export const getShopsByCity = asyncHandler(async (req: Request, res: Response) => {
    const { city } = req.query;

    if (!city) {
        const allShops = await prisma.shop.findMany({
            where: {
                isVerified: true,
                isOpen: true
            },
            include: {
                category: true,
                user: {
                    select: {
                        name: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                rating: 'desc'
            }
        });

        return successResponse(res, allShops, 'All shops fetched successfully');
    }

    // Find shops in the specified city
    const shops = await prisma.shop.findMany({
        where: {
            isVerified: true,
            isOpen: true,
            city: city as string
        },
        include: {
            category: true,
            user: {
                select: {
                    name: true,
                    phone: true
                }
            }
        },
        orderBy: {
            rating: 'desc'
        }
    });

    successResponse(res, shops, `Shops in ${city} fetched successfully`);
});

/**
 * Create a new city (Admin only)
 */
export const createCity = asyncHandler(async (req: Request, res: Response) => {
    const { name, state, displayOrder } = req.body;

    if (!name) {
        return errorResponse(res, 'City name is required', 400);
    }

    // Check if city already exists
    const existingCity = await prisma.city.findUnique({
        where: { name }
    });

    if (existingCity) {
        return errorResponse(res, 'City already exists', 400);
    }

    const city = await prisma.city.create({
        data: {
            name,
            state: state || 'West Bengal',
            displayOrder: displayOrder || 0
        }
    });

    successResponse(res, city, 'City created successfully', 201);
});

/**
 * Update a city (Admin only)
 */
export const updateCity = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, state, isActive, displayOrder } = req.body;

    const city = await prisma.city.findUnique({
        where: { id }
    });

    if (!city) {
        return errorResponse(res, 'City not found', 404);
    }

    const updatedCity = await prisma.city.update({
        where: { id },
        data: {
            ...(name && { name }),
            ...(state && { state }),
            ...(typeof isActive === 'boolean' && { isActive }),
            ...(typeof displayOrder === 'number' && { displayOrder })
        }
    });

    successResponse(res, updatedCity, 'City updated successfully');
});

/**
 * Delete a city (Admin only)
 */
export const deleteCity = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
        where: { id }
    });

    if (!city) {
        return errorResponse(res, 'City not found', 404);
    }

    // Check if any shops are using this city
    const shopsCount = await prisma.shop.count({
        where: { city: city.name }
    });

    if (shopsCount > 0) {
        return errorResponse(
            res,
            `Cannot delete city. ${shopsCount} shop(s) are registered in this city.`,
            400
        );
    }

    await prisma.city.delete({
        where: { id }
    });

    successResponse(res, null, 'City deleted successfully');
});

/**
 * Get city statistics (Admin only)
 */
export const getCityStats = asyncHandler(async (req: Request, res: Response) => {
    const cities = await prisma.city.findMany({
        where: { isActive: true }
    });

    const stats = await Promise.all(
        cities.map(async (city) => {
            const shopsCount = await prisma.shop.count({
                where: {
                    city: city.name,
                    isVerified: true
                }
            });

            const activeShopsCount = await prisma.shop.count({
                where: {
                    city: city.name,
                    isVerified: true,
                    isOpen: true
                }
            });

            const deliveryPartnersCount = await prisma.deliveryPartner.count({
                where: {
                    city: city.name,
                    isVerified: true
                }
            });

            return {
                id: city.id,
                name: city.name,
                state: city.state,
                shopsCount,
                activeShopsCount,
                deliveryPartnersCount
            };
        })
    );

    successResponse(res, stats, 'City statistics fetched successfully');
});
