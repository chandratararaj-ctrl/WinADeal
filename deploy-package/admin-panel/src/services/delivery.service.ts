import api from './api';

export interface DeliveryPartner {
    id: string;
    userId: string;
    vehicleType: string;
    vehicleNumber?: string;
    city: string;
    zone?: string;
    isVerified: boolean;
    isOnline: boolean;
    rating: number;
    totalDeliveries: number;
    user: {
        name: string;
        phone: string;
        email?: string;
    };
    // Include other fields as needed
}

export const getDeliveryPartners = async (params: any = {}) => {
    const response = await api.get('/delivery', { params });
    // Response form: { partners: [], pagination: {} }
    // Or if different structure, adjust here.
    return response.data.data;
};

export const verifyDeliveryPartner = async (id: string, isVerified: boolean) => {
    const response = await api.put(`/delivery/${id}/verify`, { isVerified });
    return response.data.data;
};

// For assignment (if used here or in orders service)
export const assignOrderToPartner = async (orderId: string, partnerId: string) => {
    const response = await api.post('/delivery/assign', { orderId, partnerId });
    return response.data.data;
};
