import api from './api';

export const deliveryService = {
    getMyDeliveries: async (status: 'active' | 'history' = 'active') => {
        const response = await api.get(`/delivery/my-orders?status=${status}`);
        return response.data.data;
    },

    toggleOnline: async (isOnline: boolean) => {
        const response = await api.post('/delivery/status', { isOnline });
        return response.data.data;
    },

    updateStatus: async (orderId: string, status: string, verificationCode?: string) => {
        const payload: any = { status };
        if (verificationCode) payload.verificationCode = verificationCode;

        const response = await api.put(`/delivery/orders/${orderId}/status`, payload);
        return response.data.data;
    },

    // Future: verifyOTP
};
