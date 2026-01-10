import api from './api';

export interface RegisterData {
    name: string;
    email?: string;
    phone: string;
    password: string;
    role?: 'CUSTOMER' | 'VENDOR' | 'DELIVERY_PARTNER';
}

export interface LoginData {
    phone?: string;
    email?: string;
    password: string;
}

export interface VerifyOTPData {
    phone: string;
    otp: string;
}

export const authService = {
    register: async (data: RegisterData) => {
        const response = await api.post('/auth/register', {
            ...data,
            role: data.role || 'CUSTOMER',
        });
        return response.data;
    },

    login: async (data: LoginData) => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    verifyOTP: async (data: VerifyOTPData) => {
        const response = await api.post('/auth/verify-otp', data);
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    refreshToken: async (refreshToken: string) => {
        const response = await api.post('/auth/refresh', { refreshToken });
        return response.data;
    },

    requestOTP: async (phone: string) => {
        const response = await api.post('/auth/request-otp', { phone });
        return response.data;
    },

    resetPassword: async (data: { phone: string; otp: string; newPassword: string }) => {
        const response = await api.post('/auth/reset-password', data);
        return response.data;
    },

    switchRole: async (selectedRole: string) => {
        const response = await api.post('/auth/switch-role', { selectedRole });
        return response.data;
    },
};
