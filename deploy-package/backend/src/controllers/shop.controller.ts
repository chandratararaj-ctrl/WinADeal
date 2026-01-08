import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, successResponse, errorResponse } from '../utils/helpers';

// Get all shops
export const getShops = asyncHandler(async (req: Request, res: Response) => {
    const { search, categoryId, isOpen, latitude, longitude, page = 1, limit = 20, isVerified } = req.query;

    const where: any = {};

    if (isVerified === 'all') {
        // No filter
    } else if (isVerified !== undefined) {
        where.isVerified = isVerified === 'true';
    } else {
        where.isVerified = true;
    }

    if (search) {
        where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
        ];
    }

    if (categoryId) {
        where.categoryId = categoryId as string;
    }

    if (isOpen !== undefined) {
        where.isOpen = isOpen === 'true';
    }

    const userRole = req.user?.selectedRole;

    const include: any = {
        category: {
            select: {
                id: true,
                name: true,
                type: true,
                icon: true,
            },
        },
        user: {
            select: {
                name: true,
                phone: true,
                documents: userRole === 'ADMIN' ? true : false,
            },
        },
    };

    const shops = await prisma.shop.findMany({
        where,
        include,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
            rating: 'desc',
        },
    });

    const total = await prisma.shop.count({ where });

    successResponse(res, {
        shops,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

// Get shop by ID
export const getShopById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const shop = await prisma.shop.findUnique({
        where: { id },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    icon: true,
                },
            },
            user: {
                select: {
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            products: {
                where: {
                    isAvailable: true,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });

    if (!shop) {
        return errorResponse(res, 'Shop not found', 404);
    }

    successResponse(res, shop);
});

// Get shop products
export const getShopProducts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { search, categoryId, isVeg, page = 1, limit = 50 } = req.query;

    const where: any = {
        shopId: id,
    };

    if (req.query.includeInactive !== 'true') {
        where.isAvailable = true;
    }

    if (search) {
        where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
        ];
    }

    if (categoryId) {
        where.categoryId = categoryId as string;
    }

    if (isVeg !== undefined) {
        where.isVeg = isVeg === 'true';
    }

    const products = await prisma.product.findMany({
        where,
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            variants: true,
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
            name: 'asc',
        },
    });

    const total = await prisma.product.count({ where });

    successResponse(res, {
        products,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
        },
    });
});

// Create a new shop
export const createShop = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
    }

    // Check if user already has a shop
    const existingShop = await prisma.shop.findUnique({
        where: { userId },
    });

    if (existingShop) {
        return errorResponse(res, 'User already has a shop', 400);
    }

    const {
        name,
        description,
        address,
        categoryId,
        gstin,
        fssaiNumber,
        deliveryRadius,
        latitude,
        longitude,
        city,
    } = req.body;

    const shop = await prisma.shop.create({
        data: {
            name,
            description,
            address,
            city: city || "", // Ensure city is saved
            userId,
            categoryId,
            gstin,
            fssaiNumber,
            deliveryRadiusKm: deliveryRadius ? Number(deliveryRadius) : 5,
            latitude: latitude ? Number(latitude) : 0.0,
            longitude: longitude ? Number(longitude) : 0.0,
            isVerified: false, // Default to unverified (admin must approve)
            isOpen: true, // Default to open (vendor can close if needed)
            rating: 0,
        },
    });

    successResponse(res, shop, 'Shop created successfully', 201);
});

// Update shop details
export const updateShop = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.selectedRole;

    const shop = await prisma.shop.findUnique({
        where: { id },
    });

    if (!shop) {
        return errorResponse(res, 'Shop not found', 404);
    }

    // Check permission (Owner or Admin)
    if (shop.userId !== userId && userRole !== 'ADMIN') {
        return errorResponse(res, 'Forbidden', 403);
    }

    const data = { ...req.body };

    // Prevent vendors from updating verification status
    if (userRole !== 'ADMIN') {
        delete data.isVerified;
        delete data.userId;
        delete data.rejectionReason;
    }

    const updatedShop = await prisma.shop.update({
        where: { id },
        data,
    });

    successResponse(res, updatedShop, 'Shop updated successfully');
});

// Get shop statistics
export const getShopStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.selectedRole;

    const shop = await prisma.shop.findUnique({
        where: { id },
    });

    if (!shop) {
        return errorResponse(res, 'Shop not found', 404);
    }

    // Check permission (Owner or Admin)
    if (shop.userId !== userId && userRole !== 'ADMIN') {
        return errorResponse(res, 'Forbidden', 403);
    }

    // Calculate stats
    const totalOrders = await prisma.order.count({
        where: { shopId: id },
    });

    const activeOrders = await prisma.order.count({
        where: {
            shopId: id,
            status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
        },
    });

    const deliveredOrders = await prisma.order.count({
        where: {
            shopId: id,
            status: 'DELIVERED',
        },
    });

    // Calculate revenue (sum of order totals for delivered orders)
    const revenueAggregate = await prisma.order.aggregate({
        where: {
            shopId: id,
            status: 'DELIVERED',
        },
        _sum: {
            total: true,
        },
    });

    // Calculate pending inventory (e.g. low stock products)
    const lowStockProducts = await prisma.product.count({
        where: {
            shopId: id,
            stockQuantity: {
                lte: 5, // Threshold
            },
        },
    });

    // Calculate chart data (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await prisma.order.findMany({
        where: {
            shopId: id,
            createdAt: {
                gte: sevenDaysAgo,
            },
        },
        select: {
            createdAt: true,
            total: true,
            status: true,
        },
    });

    const chartData: any[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const dayStr = days[d.getDay()];

        // Find orders for this day
        const dayOrders = recentOrders.filter(o => {
            const date = new Date(o.createdAt);
            return date.getDate() === d.getDate() && date.getMonth() === d.getMonth();
        });

        const dayRevenue = dayOrders
            .filter(o => o.status === 'DELIVERED') // Revenue usually only for delivered?
            .reduce((sum, o) => sum + o.total, 0);

        chartData.push({
            name: dayStr,
            orders: dayOrders.length,
            revenue: dayRevenue,
        });
    }

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.order.count({
        where: {
            shopId: id,
            createdAt: {
                gte: today,
            },
        },
    });

    const todayRevenueAggregate = await prisma.order.aggregate({
        where: {
            shopId: id,
            status: 'DELIVERED',
            createdAt: {
                gte: today,
            },
        },
        _sum: {
            total: true,
        },
    });

    // Calculate peak hours (group by hour)
    const peakHoursData: { hour: string; orders: number }[] = [];
    const hourlyOrders = await prisma.order.findMany({
        where: {
            shopId: id,
            createdAt: {
                gte: sevenDaysAgo,
            },
        },
        select: {
            createdAt: true,
        },
    });

    // Group by hour
    const hourCounts: { [key: string]: number } = {};
    hourlyOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        const hourKey = `${hour}:00`;
        hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
    });

    // Get top 5 peak hours
    const sortedHours = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    sortedHours.forEach(([hour, count]) => {
        const hourNum = parseInt(hour);
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
        peakHoursData.push({
            hour: `${displayHour} ${period}`,
            orders: count,
        });
    });

    const stats = {
        totalOrders,
        activeOrders,
        deliveredOrders,
        totalRevenue: revenueAggregate._sum.total || 0,
        todayOrders,
        todayRevenue: todayRevenueAggregate._sum.total || 0,
        lowStockProducts,
        charts: chartData,
        peakHours: peakHoursData,
    };

    successResponse(res, stats);
});
