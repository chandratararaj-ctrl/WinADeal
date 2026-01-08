import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    phone: string;
    roles: string[];        // Changed from single role to array
    selectedRole: string;   // Currently active role
    deliveryPartner?: {
        id: string;
        isOnline: boolean;
        vehicleType?: string;
        isVerified: boolean;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string, refreshToken?: string) => void;
    setAuth: (user: User, token: string, refreshToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            login: (user, token, refreshToken) => set({
                user,
                token,
                refreshToken: refreshToken || null,
                isAuthenticated: true
            }),
            setAuth: (user, token, refreshToken) => set({
                user,
                token,
                refreshToken,
                isAuthenticated: true,
            }),
            logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
        }),
        {
            name: 'delivery-auth',
        }
    )
);
