import api from './api';

export interface Shop {
    id: string;
    name: string;
    description?: string;
    category: {
        id: string;
        name: string;
        type: string;
    };
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    deliveryRadiusKm: number;
    avgPrepTimeMins: number;
    isOpen: boolean;
    isVerified: boolean;
    rating: number;
    totalOrders: number;
}

export interface Product {
    id: string;
    shopId: string;
    shop?: Shop;
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    discountedPrice?: number;
    isVeg: boolean;
    isAvailable: boolean;
    stockQuantity?: number;
    images: string[];
    category?: {
        id: string;
        name: string;
    };
}

export const shopService = {
    // Get all shops
    getShops: async (params?: {
        search?: string;
        categoryId?: string;
        isOpen?: boolean;
        latitude?: number;
        longitude?: number;
    }) => {
        const response = await api.get('/shops', { params });
        return response.data;
    },

    // Get shop by ID
    getShopById: async (id: string) => {
        const response = await api.get(`/shops/${id}`);
        return response.data;
    },

    // Get shop products
    getShopProducts: async (shopId: string, params?: {
        search?: string;
        categoryId?: string;
        isVeg?: boolean;
    }) => {
        const response = await api.get(`/shops/${shopId}/products`, { params });
        return response.data;
    },
};

export const productService = {
    // Get all products
    getProducts: async (params?: {
        search?: string;
        categoryId?: string;
        shopId?: string;
        isVeg?: boolean;
    }) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    // Get product by ID
    getProductById: async (id: string) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },
};

export const categoryService = {
    // Get all categories
    getCategories: async (type?: 'FOOD' | 'GROCERY' | 'OTHER') => {
        const response = await api.get('/categories', {
            params: type ? { type } : {},
        });
        return response.data;
    },
};
