import api from './api';

export interface CreateShopData {
    name: string;
    description?: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    categoryId: string;
    gstin?: string;
    fssaiNumber?: string;
    openingTime?: string;
    closingTime?: string;
    minOrderAmount?: number;
    deliveryRadius?: number;
    latitude?: number;
    longitude?: number;
    image?: string;
    isActive?: boolean;
    isOpen?: boolean;
}

export const createShop = async (data: CreateShopData) => {
    const response = await api.post('/shops', data);
    return response.data.data;
};

export const updateShop = async (id: string, data: Partial<CreateShopData>) => {
    const response = await api.put(`/shops/${id}`, data);
    return response.data.data;
};

export const getMyShop = async () => {
    // Usually via /users/me or /shops/me?
    // Assuming user object has shop.
    // If we need to fetch fresh:
    const response = await api.get('/auth/me'); // uses endpoint that returns user+shop
    return response.data.data.shop;
};

export const getShopStats = async (shopId: string) => {
    const response = await api.get(`/shops/${shopId}/stats`);
    return response.data.data;
};

export const shopService = {
    createShop,
    updateShop,
    getMyShop,
    getShopStats
};

export default shopService;
