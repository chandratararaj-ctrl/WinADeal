import api from './api';

export interface CommissionHistoryRecord {
    id: string;
    entityType: 'VENDOR' | 'DELIVERY_PARTNER';
    entityId: string;
    entityName: string;
    oldRate: number;
    newRate: number;
    changedBy: string;
    reason?: string;
    createdAt: string;
}

export interface DefaultRates {
    vendor: {
        default: number;
        average: number;
    };
    deliveryPartner: {
        default: number;
        average: number;
    };
}

export const commissionService = {
    updateVendorCommission: async (shopId: string, rate: number, reason?: string) => {
        const response = await api.patch(`/commissions/vendor/${shopId}`, { rate, reason });
        return response.data.data;
    },

    updateDeliveryPartnerCommission: async (partnerId: string, rate: number, reason?: string) => {
        const response = await api.patch(`/commissions/delivery/${partnerId}`, { rate, reason });
        return response.data.data;
    },

    getCommissionHistory: async (filters?: { entityType?: string; entityId?: string; page?: number; limit?: number }) => {
        const response = await api.get('/commissions/history', { params: filters });
        return response.data.data;
    },

    getDefaultRates: async (): Promise<DefaultRates> => {
        const response = await api.get('/commissions/defaults');
        return response.data.data;
    }
};
