import api from './api';

export interface LoginCredentials {
    phone?: string;
    email?: string;
    password: string;
}

export interface RegisterData {
    name: string;
    phone: string;
    email?: string;
    password: string;
    role?: 'CUSTOMER' | 'VENDOR' | 'DELIVERY';
}

export interface OTPData {
    phone: string;
    otp: string;
}

export interface AuthResponse {
    user: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        roles: string[];
        selectedRole: string;
        isVerified: boolean;
    };
    accessToken: string;
    refreshToken: string;
}

/**
 * Login with phone and password
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
};

/**
 * Register a new user
 */
export const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data.data;
};

/**
 * Verify OTP
 */
export const verifyOTP = async (data: OTPData): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data.data;
};

/**
 * Request OTP for passwordless login
 */
export const requestOTP = async (phone: string) => {
    const response = await api.post('/auth/request-otp', { phone });
    return response.data.data;
};

/**
 * Login with OTP
 */
export const loginWithOTP = async (data: OTPData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login-otp', data);
    return response.data.data;
};

/**
 * Logout
 */
export const logout = async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return response.data;
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
};

/**
 * Reset password with OTP
 */
/**
 * Switch active role
 */
export const switchRole = async (role: string) => {
    const response = await api.post('/auth/switch-role', { selectedRole: role });
    return response.data.data; // Backend returns { success: true, data: { accessToken, refreshToken, selectedRole } }
};

/**
 * Reset password with OTP
 */
export const resetPassword = async (data: OTPData & { newPassword: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data.data;
};
