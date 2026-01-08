
import api from './api';

export const orderService = {
    getOrders: async (params?: any) => {
        const response = await api.get('/orders', { params });
        return response.data.data;
    },

    getOrderById: async (id: string) => {
        const response = await api.get(`/orders/${id}`);
        return response.data.data;
    },

    updateStatus: async (id: string, status: string) => {
        const response = await api.patch(`/orders/${id}/status`, { status });
        return response.data.data;
    },
};
