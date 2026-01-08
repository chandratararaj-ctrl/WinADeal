import api from './api';

export interface Coupon {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FLAT';
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number;
    validFrom: string;
    validTo: string;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
}

export const couponService = {
    getAll: async () => {
        const response = await api.get('/coupons');
        return response.data.data.coupons; // Assuming pagination structure
    },
    create: async (data: Partial<Coupon>) => {
        const response = await api.post('/coupons', data);
        return response.data.data;
    },
    update: async (id: string, data: Partial<Coupon>) => {
        const response = await api.patch(`/coupons/${id}`, data);
        return response.data.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/coupons/${id}`);
        return response.data;
    }
};
