import api from './api';

export const cityService = {
    // Get all cities (including inactive)
    getAllCities: async () => {
        const response = await api.get('/cities/all');
        return response.data.data;
    },

    // Get available cities (active only, for dropdowns)
    getAvailableCities: async () => {
        const response = await api.get('/cities/available');
        return response.data.data;
    },

    // Get shops by city
    getShopsByCity: async (city?: string) => {
        const response = await api.get('/cities/shops', {
            params: city ? { city } : {}
        });
        return response.data.data;
    },

    // Get city statistics
    getCityStats: async () => {
        const response = await api.get('/cities/stats');
        return response.data.data;
    },

    // Create a new city
    createCity: async (data: { name: string; state: string; displayOrder?: number }) => {
        const response = await api.post('/cities', data);
        return response.data.data;
    },

    // Update a city
    updateCity: async (id: string, data: Partial<{ name: string; state: string; isActive: boolean; displayOrder: number }>) => {
        const response = await api.put(`/cities/${id}`, data);
        return response.data.data;
    },

    // Delete a city
    deleteCity: async (id: string) => {
        const response = await api.delete(`/cities/${id}`);
        return response.data.data;
    }
};
