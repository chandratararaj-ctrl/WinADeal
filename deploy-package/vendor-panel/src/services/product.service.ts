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
    taxRate: number;
    category?: {
        name: string;
    };
    rating?: number;
    totalSales?: number;
    createdAt?: string;
}

export interface CreateProductData {
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    categoryId: string;
    shopId: string;
    image?: string;
    isVeg: boolean;
    stock?: number;
    taxRate?: number;
}

export interface UpdateProductData {
    name?: string;
    description?: string;
    price?: number;
    discountPrice?: number;
    categoryId?: string;
    image?: string;
    isVeg?: boolean;
    stock?: number;
    taxRate?: number;
    isActive?: boolean;
    isAvailable?: boolean;
}

export interface ProductFilters {
    search?: string;
    categoryId?: string;
    isVeg?: boolean | string;
    page?: number;
    limit?: number;
}

export const productService = {
    // Get products for a specific shop
    getShopProducts: async (shopId: string, filters: ProductFilters = {}) => {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.categoryId && filters.categoryId !== 'all') params.append('categoryId', filters.categoryId);
        if (filters.isVeg !== undefined && filters.isVeg !== 'all') params.append('isVeg', String(filters.isVeg));
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
        params.append('includeInactive', 'true');

        const response = await api.get(`/shops/${shopId}/products?${params.toString()}`);
        return response.data.data;
    },

    // Get single product details
    getProduct: async (id: string) => {
        const response = await api.get(`/products/${id}`);
        return response.data.data;
    },

    // Create a new product
    createProduct: async (data: CreateProductData) => {
        const response = await api.post('/products', data);
        return response.data.data;
    },

    // Update a product
    updateProduct: async (id: string, data: UpdateProductData) => {
        const response = await api.put(`/products/${id}`, data);
        return response.data.data;
    },

    // Delete a product
    deleteProduct: async (id: string) => {
        const response = await api.delete(`/products/${id}`);
        return response.data.data;
    },

    // Get all categories (for dropdowns)
    getCategories: async () => {
        const response = await api.get('/categories');
        return response.data.data;
    },
};
