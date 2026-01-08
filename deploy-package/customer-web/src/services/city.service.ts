import api from './api';

export const cityService = {
    // Get all active cities for dropdown
    getAvailableCities: async (): Promise<string[]> => {
        const response = await api.get('/cities/all');
        // Extract city names from the response
        return response.data.data.map((city: any) => city.name);
    },

    getShopsByCity: async (city?: string) => {
        const response = await api.get('/cities/shops', {
            params: city ? { city } : {}
        });
        return response.data.data;
    }
};
