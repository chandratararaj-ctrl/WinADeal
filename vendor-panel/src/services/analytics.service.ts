import api from './api';

export interface VendorAnalytics {
    overview: {
        totalOrders: number;
        totalRevenue: number;
        totalProducts: number;
        activeProducts: number;
        lowStockProducts: number;
        avgOrderValue: number;
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
    topProducts: Array<{
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
    }>;
    peakHours: Array<{
        hour: number;
        orders: number;
    }>;
}

export const analyticsService = {
    async getVendorAnalytics(startDate?: string, endDate?: string): Promise<VendorAnalytics> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await api.get(`/analytics/vendor?${params.toString()}`);
        return response.data;
    }
};
