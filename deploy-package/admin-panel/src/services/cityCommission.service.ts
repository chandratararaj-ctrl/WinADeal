import api from './api';

export interface CityCommission {
    id: string;
    city: string;
    vendorCommissionRate: number;
    deliveryCommissionRate: number;
    minOrderAmount?: number | null;
    baseDeliveryFee?: number | null;
    perKmDeliveryFee?: number | null;
    baseDistance?: number | null;
    maxDeliveryRadius?: number | null;
    taxRate?: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const cityCommissionService = {
    // Get all city commissions
    getAll: async () => {
        const response = await api.get('/city-commissions');
        return response.data.data;
    },

    // Get commission for specific city
    getByCity: async (city: string) => {
        const response = await api.get(`/city-commissions/${city}`);
        return response.data.data;
    },

    // Create or update city commission
    upsert: async (city: string, data: Partial<CityCommission>) => {
        const response = await api.put(`/city-commissions/${city}`, data);
        return response.data.data;
    },

    // Delete city commission
    delete: async (city: string) => {
        const response = await api.delete(`/city-commissions/${city}`);
        return response.data;
    },

    // Bulk upsert
    bulkUpsert: async (commissions: Partial<CityCommission>[]) => {
        const response = await api.post('/city-commissions/bulk', { commissions });
        return response.data.data;
    },

    // Get commission rates (public)
    getRates: async (city: string) => {
        const response = await api.get(`/city-commissions/rates?city=${city}`);
        return response.data.data;
    }
};
