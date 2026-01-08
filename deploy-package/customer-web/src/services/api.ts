import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        let token = useAuthStore.getState().token;

        // Fallback: Try to read from localStorage if zustand hasn't hydrated or is empty
        if (!token) {
            try {
                const stored = localStorage.getItem('customer-auth-storage');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.state && parsed.state.token) {
                        token = parsed.state.token;
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { token, refreshToken: newRefreshToken } = response.data.data;
                const user = useAuthStore.getState().user;

                if (user) {
                    useAuthStore.getState().setAuth(user, token, newRefreshToken);
                }

                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().clearAuth();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        if (error.response?.status === 401 && originalRequest._retry) {
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;
