import api from './api';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discountPrice?: number | null;
    stockQuantity: number;
    categoryId: string;
    shopId: string;
    images?: string[];
    isVeg: boolean;
    isActive: boolean;
    isAvailable: boolean;
    category?: {
        name: string;
    };
    shop?: {
        id: string;
        name: string;
    };
    rating?: number;
    totalSales?: number;
    createdAt?: string;
}

export interface ProductFilters {
    search?: string;
    categoryId?: string;
    shopId?: string;
    isVeg?: boolean | string;
    includeInactive?: boolean;
    page?: number;
    limit?: number;
}

export const productService = {
    // Get all products (Admin version)
    getProducts: async (filters: ProductFilters = {}) => {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.categoryId && filters.categoryId !== 'all') params.append('categoryId', filters.categoryId);
        if (filters.shopId) params.append('shopId', filters.shopId);
        if (filters.isVeg !== undefined && filters.isVeg !== 'all') params.append('isVeg', String(filters.isVeg));
        if (filters.includeInactive) params.append('includeInactive', 'true');
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));

        const response = await api.get(`/products?${params.toString()}`);
        return response.data.data;
    },

    // Get single product
    getProduct: async (id: string) => {
        const response = await api.get(`/products/${id}`);
        return response.data.data;
    },

    // Create product
    createProduct: async (data: any) => {
        const response = await api.post('/products', data);
        return response.data.data;
    },

    // Update product
    updateProduct: async (id: string, data: any) => {
        const response = await api.put(`/products/${id}`, data);
        return response.data.data;
    },

    // Delete product
    deleteProduct: async (id: string) => {
        const response = await api.delete(`/products/${id}`);
        return response.data.data;
    },

    // Get all categories
    getCategories: async () => {
        const response = await api.get('/categories');
        return response.data.data;
    },

    // Get all shops (for the add/edit form dropdown)
    getShops: async () => {
        const response = await api.get('/shops?isVerified=all');
        return response.data.data.shops;
    }
};
