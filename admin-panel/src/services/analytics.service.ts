import api from './api';

export interface AdminAnalytics {
    overview: {
        totalUsers: number;
        totalVendors: number;
        totalCustomers: number;
        totalDeliveryPartners: number;
        totalOrders: number;
        totalRevenue: number;
        totalDeliveryCharges: number;
    };
    ordersByStatus: Array<{
        status: string;
        count: number;
    }>;
    dailyRevenue: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
    topVendors: Array<{
        vendorId: string;
        vendorName: string;
        revenue: number;
        orders: number;
    }>;
    topProducts: Array<{
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
    }>;
    userGrowth: Array<{
        month: string;
        users: number;
    }>;
}

export const analyticsService = {
    async getAdminAnalytics(startDate?: string, endDate?: string): Promise<AdminAnalytics> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await api.get(`/analytics/admin?${params.toString()}`);
        return response.data;
    }
};
