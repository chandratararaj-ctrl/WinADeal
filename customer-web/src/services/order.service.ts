import api from './api';

export interface CreateOrderData {
    shopId: string;
    deliveryAddressId: string;
    items: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    paymentMethod: 'ONLINE' | 'COD' | 'WALLET';
    couponCode?: string;
    specialInstructions?: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: string;
    shop: {
        id: string;
        name: string;
    };
    deliveryAddress: {
        addressLine1: string;
        city: string;
        pincode: string;
    };
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: string;
    items: {
        id: string;
        product: {
            name: string;
            images: string[];
        };
        quantity: number;
        price: number;
    }[];
}

export const orderService = {
    // Create new order
    createOrder: async (data: CreateOrderData) => {
        const response = await api.post('/orders', data);
        return response.data;
    },

    // Get user orders
    getMyOrders: async (params?: {
        status?: string;
        page?: number;
        limit?: number;
    }) => {
        const response = await api.get('/orders', { params });
        return response.data.data;
    },

    // Get order by ID
    getOrderById: async (id: string) => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    // Cancel order
    cancelOrder: async (id: string, reason?: string) => {
        const response = await api.post(`/orders/${id}/cancel`, { reason });
        return response.data;
    },

    // Initialize Payment
    createPaymentOrder: async (orderId: string) => {
        const response = await api.post('/payments/orders', { orderId });
        return response.data;
    },

    // Verify Payment
    verifyPayment: async (data: any) => {
        const response = await api.post('/payments/verify', data);
        return response.data;
    },
};

export const addressService = {
    // Get user addresses
    getMyAddresses: async () => {
        const response = await api.get('/addresses');
        return response.data.data;
    },

    // Create address
    createAddress: async (data: {
        label: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
        latitude?: number;
        longitude?: number;
        isDefault?: boolean;
    }) => {
        const response = await api.post('/addresses', data);
        return response.data;
    },

    // Update address
    updateAddress: async (id: string, data: any) => {
        const response = await api.patch(`/addresses/${id}`, data);
        return response.data;
    },

    // Delete address
    deleteAddress: async (id: string) => {
        const response = await api.delete(`/addresses/${id}`);
        return response.data;
    },
};
