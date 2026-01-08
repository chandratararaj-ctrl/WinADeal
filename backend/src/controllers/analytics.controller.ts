import { Request, Response } from 'express';
import prisma from '../config/database';

export const analyticsController = {
    // Admin Analytics
    async getAdminAnalytics(req: Request, res: Response): Promise<any> {
        try {
            const { startDate, endDate } = req.query;

            // Date range setup
            const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate as string) : new Date();

            // Platform Overview
            const totalUsers = await prisma.user.count();
            const totalVendors = await prisma.user.count({ where: { roles: { has: 'VENDOR' } } });
            const totalCustomers = await prisma.user.count({ where: { roles: { has: 'CUSTOMER' } } });
            const totalDeliveryPartners = await prisma.user.count({ where: { roles: { has: 'DELIVERY' } } });

            // Order Statistics
            const totalOrders = await prisma.order.count({
                where: {
                    createdAt: { gte: start, lte: end }
                }
            });

            const ordersByStatus = await prisma.order.groupBy({
                by: ['status'],
                where: {
                    createdAt: { gte: start, lte: end }
                },
                _count: true
            });

            // Revenue Statistics
            const revenueData = await prisma.order.aggregate({
                where: {
                    createdAt: { gte: start, lte: end },
                    status: 'DELIVERED'
                },
                _sum: {
                    total: true,
                    deliveryFee: true
                }
            });

            // Daily Revenue Trend (last 30 days)
            const dailyRevenue = await prisma.$queryRaw<Array<{ date: Date; revenue: number; orders: number }>>`
        SELECT 
          CAST("createdAt" AS DATE) as date,
          SUM(total) as revenue,
          COUNT(*) as orders
        FROM \"Order\"
        WHERE "createdAt" >= ${start}
          AND "createdAt" <= ${end}
          AND status = 'DELIVERED'
        GROUP BY CAST("createdAt" AS DATE)
        ORDER BY date ASC
      `;

            // Top Vendors by Revenue
            const topVendors = await prisma.$queryRaw<Array<{
                vendorId: string;
                vendorName: string;
                revenue: number;
                orders: number
            }>>`
        SELECT 
          s."userId" as "vendorId",
          u.name as "vendorName",
          SUM(o.total) as revenue,
          COUNT(o.id) as orders
        FROM "Order" o
        JOIN "Shop" s ON o."shopId" = s.id
        JOIN "User" u ON s."userId" = u.id
        WHERE o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
          AND o.status = 'DELIVERED'
        GROUP BY s.userId, u.name
        ORDER BY revenue DESC
        LIMIT 10
      `;

            // Top Products
            const topProducts = await prisma.$queryRaw<Array<{
                "productId": string;
                productName: string;
                quantity: number;
                revenue: number;
            }>>`
        SELECT 
          oi."productId" as "productId",
          p.name as "productName",
          SUM(oi.quantity) as quantity,
          SUM(oi.price * oi.quantity) as revenue
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
          AND o.status = 'DELIVERED'
        GROUP BY oi."productId", p.name
        ORDER BY quantity DESC
        LIMIT 10
      `;

            // User Growth (last 12 months)
            const userGrowth = await prisma.$queryRaw<Array<{ month: string; users: number }>>`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as month,
          COUNT(*) as users
        FROM "User"
        WHERE "createdAt" >= ${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month ASC
      `;

            res.json({
                overview: {
                    totalUsers,
                    totalVendors,
                    totalCustomers,
                    totalDeliveryPartners,
                    totalOrders,
                    totalRevenue: revenueData._sum?.total || 0,
                    totalDeliveryCharges: revenueData._sum?.deliveryFee || 0
                },
                ordersByStatus: ordersByStatus.map(item => ({
                    status: item.status,
                    count: item._count
                })),
                dailyRevenue: dailyRevenue.map(item => ({
                    date: item.date,
                    revenue: Number(item.revenue),
                    orders: Number(item.orders)
                })),
                topVendors: topVendors.map(vendor => ({
                    vendorId: vendor.vendorId,
                    vendorName: vendor.vendorName,
                    revenue: Number(vendor.revenue),
                    orders: Number(vendor.orders)
                })),
                topProducts: topProducts.map(product => ({
                    productId: product.productId,
                    productName: product.productName,
                    quantity: Number(product.quantity),
                    revenue: Number(product.revenue)
                })),
                userGrowth: userGrowth.map(item => ({
                    month: item.month,
                    users: Number(item.users)
                }))
            });
        } catch (error) {
            console.error('Error fetching admin analytics:', error);
            res.status(500).json({ message: 'Failed to fetch analytics' });
        }
    },

    // Vendor Analytics
    async getVendorAnalytics(req: Request, res: Response): Promise<any> {
        try {
            const vendorId = req.user?.userId;
            const { startDate, endDate } = req.query;

            if (!vendorId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Get vendor's shop
            const shop = await prisma.shop.findFirst({
                where: { userId: vendorId }
            });

            if (!shop) {
                return res.status(404).json({ message: 'Shop not found' });
            }

            // Date range setup
            const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate as string) : new Date();

            // Order Statistics
            const totalOrders = await prisma.order.count({
                where: {
                    shopId: shop.id,
                    createdAt: { gte: start, lte: end }
                }
            });

            const ordersByStatus = await prisma.order.groupBy({
                by: ['status'],
                where: {
                    shopId: shop.id,
                    createdAt: { gte: start, lte: end }
                },
                _count: true
            });

            // Revenue Statistics
            const revenueData = await prisma.order.aggregate({
                where: {
                    shopId: shop.id,
                    createdAt: { gte: start, lte: end },
                    status: 'DELIVERED'
                },
                _sum: {
                    total: true,
                    deliveryFee: true
                }
            });

            // Daily Revenue (last 30 days)
            const dailyRevenue = await prisma.$queryRaw<Array<{ date: Date; revenue: number; orders: number }>>`
        SELECT 
          CAST("createdAt" AS DATE) as date,
          SUM(total) as revenue,
          COUNT(*) as orders
        FROM "Order"
        WHERE "shopId" = ${shop.id}
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
          AND status = 'DELIVERED'
        GROUP BY CAST("createdAt" AS DATE)
        ORDER BY date ASC
      `;

            // Top Products
            const topProducts = await prisma.$queryRaw<Array<{
                "productId": string;
                productName: string;
                quantity: number;
                revenue: number;
            }>>`
        SELECT 
          oi."productId" as "productId",
          p.name as "productName",
          SUM(oi.quantity) as quantity,
          SUM(oi.price * oi.quantity) as revenue
        FROM "OrderItem" oi
        JOIN "Product" p ON oi."productId" = p.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."shopId" = ${shop.id}
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
          AND o.status = 'DELIVERED'
        GROUP BY oi."productId", p.name
        ORDER BY quantity DESC
        LIMIT 10
      `;

            // Product Statistics
            const totalProducts = await prisma.product.count({
                where: { shopId: shop.id }
            });

            const activeProducts = await prisma.product.count({
                where: { shopId: shop.id, isAvailable: true }
            });

            const lowStockProducts = await prisma.product.count({
                where: {
                    shopId: shop.id,
                    stockQuantity: { lte: 10 }
                }
            });

            // Peak Hours Analysis
            const peakHours = await prisma.$queryRaw<Array<{ hour: number; orders: number }>>`
        SELECT 
          EXTRACT(HOUR FROM "createdAt") as hour,
          COUNT(*) as orders
        FROM "Order"
        WHERE "shopId" = ${shop.id}
          AND "createdAt" >= ${start}
          AND "createdAt" <= ${end}
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY orders DESC
        LIMIT 5
      `;

            // Average Order Value
            const avgOrderValue = await prisma.order.aggregate({
                where: {
                    shopId: shop.id,
                    createdAt: { gte: start, lte: end },
                    status: 'DELIVERED'
                },
                _avg: {
                    total: true
                }
            });

            res.json({
                overview: {
                    totalOrders,
                    totalRevenue: revenueData._sum?.total || 0,
                    totalProducts,
                    activeProducts,
                    lowStockProducts,
                    avgOrderValue: avgOrderValue._avg?.total || 0
                },
                ordersByStatus: ordersByStatus.map(item => ({
                    status: item.status,
                    count: item._count
                })),
                dailyRevenue: dailyRevenue.map(item => ({
                    date: item.date,
                    revenue: Number(item.revenue),
                    orders: Number(item.orders)
                })),
                topProducts: topProducts.map(product => ({
                    productId: product.productId,
                    productName: product.productName,
                    quantity: Number(product.quantity),
                    revenue: Number(product.revenue)
                })),
                peakHours: peakHours.map(item => ({
                    hour: Number(item.hour),
                    orders: Number(item.orders)
                }))
            });
        } catch (error) {
            console.error('Error fetching vendor analytics:', error);
            res.status(500).json({ message: 'Failed to fetch analytics' });
        }
    },

    // Delivery Partner Analytics
    async getDeliveryAnalytics(req: Request, res: Response): Promise<any> {
        try {
            const userId = req.user?.userId;
            const { startDate, endDate } = req.query;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Get Delivery Partner Profile
            const partner = await prisma.deliveryPartner.findUnique({
                where: { userId }
            });

            if (!partner) {
                return res.status(404).json({ message: 'Delivery Partner profile not found' });
            }

            const deliveryPartnerId = partner.id;

            // Date range setup
            const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate as string) : new Date();

            // Delivery Statistics via Delivery table
            const totalDeliveries = await prisma.delivery.count({
                where: {
                    deliveryPartnerId,
                    createdAt: { gte: start, lte: end }
                }
            });

            const completedDeliveries = await prisma.delivery.count({
                where: {
                    deliveryPartnerId,
                    order: {
                        status: 'DELIVERED'
                    },
                    createdAt: { gte: start, lte: end }
                }
            });

            // Earnings
            const earningsData = await prisma.delivery.aggregate({
                where: {
                    deliveryPartnerId,
                    order: {
                        status: 'DELIVERED'
                    },
                    createdAt: { gte: start, lte: end }
                },
                _sum: {
                    deliveryFee: true
                }
            });

            // Daily Earnings
            // Need to join delivery -> order? Or just use delivery."createdAt" and "deliveryFee"?
            // Delivery model allows direct querying if we assume completed deliveries get the fee.
            const dailyEarnings = await prisma.$queryRaw<Array<{ date: Date; earnings: number; deliveries: number }>>`
        SELECT 
          CAST(d."createdAt" AS DATE) as date,
          SUM(d."deliveryFee") as earnings,
          COUNT(*) as deliveries
        FROM "Delivery" d
        JOIN "Order" o ON d."orderId" = o.id
        WHERE d."deliveryPartnerId" = ${deliveryPartnerId}
          AND d."createdAt" >= ${start}
          AND d."createdAt" <= ${end}
          AND o.status = 'DELIVERED'
        GROUP BY CAST(d."createdAt" AS DATE)
        ORDER BY date ASC
      `;

            // Performance Metrics
            const onTimeDeliveries = await prisma.delivery.count({
                where: {
                    deliveryPartnerId,
                    order: {
                        status: 'DELIVERED'
                    },
                    createdAt: { gte: start, lte: end }
                    // TODO: Add logic to check if delivered on time
                }
            });

            const onTimePercentage = completedDeliveries > 0
                ? (onTimeDeliveries / completedDeliveries) * 100
                : 0;

            const avgDeliveryTime = 25; // Placeholder

            res.json({
                overview: {
                    totalDeliveries,
                    completedDeliveries,
                    totalEarnings: earningsData._sum?.deliveryFee || 0,
                    onTimePercentage: Math.round(onTimePercentage),
                    avgDeliveryTime
                },
                dailyEarnings: dailyEarnings.map(item => ({
                    date: item.date,
                    earnings: Number(item.earnings),
                    deliveries: Number(item.deliveries)
                }))
            });
        } catch (error) {
            console.error('Error fetching delivery analytics:', error);
            res.status(500).json({ message: 'Failed to fetch analytics' });
        }
    }
};
