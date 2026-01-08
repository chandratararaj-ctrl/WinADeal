import api from './api';

export interface VendorShop {
    id: string;
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    gstin?: string;
    fssaiNumber?: string;
    isVerified: boolean;
    isActive: boolean;
    rating: number;
    logo?: string;
    categoryId: string;
    user?: {
        name: string;
        email: string;
        phone: string;
    };
    category?: {
        name: string;
    };
    createdAt: string;
}

export const getAllVendors = async () => {
    const response = await api.get('/shops?isVerified=all&limit=100');
    return response.data.data.shops;
};

export const getAllVendorUsers = async () => {
    const response = await api.get('/users?role=VENDOR&limit=100');
    return response.data.data.users;
};

export const approveVendor = async (shopId: string) => {
    const response = await api.put(`/shops/${shopId}`, { isVerified: true });
    return response.data.data;
};

export const rejectVendor = async (shopId: string, reason: string) => {
    const response = await api.put(`/shops/${shopId}`, {
        isVerified: false,
        rejectionReason: reason
    });
    return response.data.data;
};
