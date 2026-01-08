import api from './api';

export interface DeliveryAnalytics {
    overview: {
        totalDeliveries: number;
        completedDeliveries: number;
        totalEarnings: number;
        onTimePercentage: number;
        avgDeliveryTime: number;
    };
    dailyEarnings: Array<{
        date: string;
        earnings: number;
        deliveries: number;
    }>;
}

export const analyticsService = {
    async getDeliveryAnalytics(startDate?: string, endDate?: string): Promise<DeliveryAnalytics> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await api.get(`/analytics/delivery?${params.toString()}`);
        return response.data;
    }
};
