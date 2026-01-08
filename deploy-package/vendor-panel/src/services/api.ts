import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Normalize API URL to ensure it has /api/v1 suffix
if (API_URL && !API_URL.includes('/api/v1')) {
    API_URL = API_URL.replace(/\/$/, ''); // Remove trailing slash
    if (API_URL.endsWith('/api')) {
        API_URL = `${API_URL}/v1`;
    } else {
        API_URL = `${API_URL}/api/v1`;
    }
}

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);

                    // Retry original request
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } else {
                    useAuthStore.getState().clearAuth();
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                useAuthStore.getState().clearAuth();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
