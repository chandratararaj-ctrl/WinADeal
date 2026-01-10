import api from './api';

export const couponService = {
    // Verify coupon
    verifyCoupon: async (data: { code: string; orderTotal: number }) => {
        const response = await api.post('/coupons/verify', data);
        return response.data;
    }
};
