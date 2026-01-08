import api from './api';

export interface PlatformSettings {
    platformName: string;
    currency: string;
    taxRate: number;
    baseFee: number;
    perKmFee: number;
    platformCommission: number;
    baseDistance: number;
    maxDeliveryRadius: number;
    supportEmail: string;
    supportPhone: string;
    minOrderValue: number;
}

export interface SettingHistoryItem {
    id: string;
    key: string;
    oldValue: string | null;
    newValue: string;
    changedBy: string;
    user: {
        name: string;
        email: string;
    };
    createdAt: string;
}

export const settingsService = {
    getDeliverySettings: async (): Promise<PlatformSettings> => {
        const response = await api.get('/settings/delivery');
        return response.data.data;
    },

    updateDeliverySettings: async (settings: Partial<PlatformSettings>) => {
        const response = await api.put('/settings/delivery', settings);
        return response.data.data;
    },

    getSettingHistory: async (): Promise<SettingHistoryItem[]> => {
        const response = await api.get('/settings/history');
        return response.data.data;
    }
};
