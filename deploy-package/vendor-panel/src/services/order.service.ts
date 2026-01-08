import api from './api';

export interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
        name: string;
        images: string[];
    };
}

export interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
    items: number; // Frontend mapped
    customer: {
        name: string;
        phone: string;
    };
    deliveryAddress: {
        addressLine1: string;
        city: string;
        pincode: string;
    };
    orderItems: OrderItem[];
}

export interface OrderFilters {
    status?: string;
    page?: number;
    limit?: number;
}

export const orderService = {
    // Get all orders for the vendor
    getOrders: async (filters: OrderFilters = {}) => {
        const params = new URLSearchParams();
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));

        const response = await api.get(`/orders?${params.toString()}`);
        return response.data.data;
    },

    // Get single order details
    getOrder: async (id: string) => {
        const response = await api.get(`/orders/${id}`);
        return response.data.data;
    },

    // Update order status
    updateStatus: async (id: string, status: string) => {
        const response = await api.put(`/orders/${id}/status`, { status });
        return response.data.data;
    },

    // Assign driver/partner to order
    assignDriver: async (orderId: string, partnerId: string) => {
        const response = await api.post('/delivery/assign', { orderId, partnerId });
        return response.data.data;
    },

    // Get available drivers
    getDrivers: async () => {
        // Fetch verified partners. 
        // In real app, filter by city/zone.
        const response = await api.get('/delivery?isVerified=true');
        return response.data.data.partners;
    }
};
