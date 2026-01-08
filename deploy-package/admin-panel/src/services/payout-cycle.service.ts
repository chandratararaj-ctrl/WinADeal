import api from './api';

export interface PayoutCycle {
    id: string;
    name: string;
    cycleType: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'CLOSED' | 'PROCESSING' | 'COMPLETED';
    totalPayouts: number;
    totalAmount: number;
    processedAt?: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        payouts: number;
    };
}

export interface PendingPayoutSummary {
    cycle: PayoutCycle;
    vendors: {
        payouts: Array<{
            shopId: string;
            shopName: string;
            grossAmount: number;
            commissionRate: number;
            netAmount: number;
            orderCount: number;
        }>;
        totalAmount: number;
        count: number;
    };
    deliveryPartners: {
        payouts: Array<{
            partnerId: string;
            partnerName: string;
            grossAmount: number;
            commissionRate: number;
            netAmount: number;
            deliveryCount: number;
        }>;
        totalAmount: number;
        count: number;
    };
    summary: {
        totalPayouts: number;
        totalAmount: number;
    };
}

export const payoutCycleService = {
    createPayoutCycle: async (data: { cycleType: string; startDate?: string; endDate?: string }) => {
        const response = await api.post('/payout-cycles', data);
        return response.data.data;
    },

    getPayoutCycles: async (filters?: { status?: string; cycleType?: string; page?: number; limit?: number }) => {
        const response = await api.get('/payout-cycles', { params: filters });
        return response.data.data;
    },

    getActiveCycle: async (): Promise<PayoutCycle> => {
        const response = await api.get('/payout-cycles/active');
        return response.data.data;
    },

    getPayoutCycleById: async (id: string) => {
        const response = await api.get(`/payout-cycles/${id}`);
        return response.data.data;
    },

    calculatePendingPayouts: async (id: string): Promise<PendingPayoutSummary> => {
        const response = await api.get(`/payout-cycles/${id}/pending`);
        return response.data.data;
    },

    closePayoutCycle: async (id: string) => {
        const response = await api.post(`/payout-cycles/${id}/close`);
        return response.data.data;
    }
};
