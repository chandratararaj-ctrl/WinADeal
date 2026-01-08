import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import * as authService from '../services/auth.service';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const SOCKET_URL = API_URL.replace('/api/v1', '');
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

export const useSocket = () => {
    const { accessToken, refreshToken, isAuthenticated, setAuth, clearAuth } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refresh token and reconnect
    const refreshTokenAndReconnect = useCallback(async () => {
        if (!refreshToken) {
            console.error('No refresh token available');
            clearAuth();
            toast.error('Session expired. Please login again.');
            return false;
        }

        try {
            console.log('Attempting to refresh token...');
            const response = await authService.refreshToken(refreshToken);

            // Update auth store with new tokens
            setAuth(response.user, response.accessToken, response.refreshToken);

            console.log('Token refreshed successfully');
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            clearAuth();
            toast.error('Session expired. Please login again.');
            return false;
        }
    }, [refreshToken, setAuth, clearAuth]);

    // Connect to socket with current token
    const connectSocket = useCallback((authToken: string) => {
        // Disconnect existing socket
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        console.log('Connecting to Vendor WebSocket...');
        socketRef.current = io(SOCKET_URL, {
            auth: { token: authToken },
            reconnection: true,
            reconnectionDelay: RECONNECT_DELAY,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        });

        // Connection successful
        socketRef.current.on('connect', () => {
            console.log('✅ Vendor Socket connected successfully');
            reconnectAttemptsRef.current = 0;
            useSocketStore.getState().setConnectionStatus(true);
        });

        // Connection error
        socketRef.current.on('connect_error', async (err) => {
            console.error('❌ Vendor Socket connection error:', err);

            // Check if it's an authentication error
            if (err.message.includes('Authentication error') || err.message.includes('jwt expired')) {
                console.log('JWT expired, attempting to refresh token...');

                // Attempt token refresh
                const refreshed = await refreshTokenAndReconnect();

                if (refreshed) {
                    // Reconnect with new token
                    const newToken = useAuthStore.getState().accessToken;
                    if (newToken) {
                        console.log('Reconnecting with new token...');
                        connectSocket(newToken);
                    }
                } else {
                    // Refresh failed, disconnect
                    if (socketRef.current) {
                        socketRef.current.disconnect();
                        socketRef.current = null;
                    }
                    useSocketStore.getState().setConnectionStatus(false);
                }
            } else {
                // Other connection errors
                reconnectAttemptsRef.current++;

                if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
                    console.error('Max reconnection attempts reached');
                    toast.error('Unable to connect to server. Please check your connection.');
                    useSocketStore.getState().setConnectionStatus(false);
                }
            }
        });

        // Disconnection
        socketRef.current.on('disconnect', (reason) => {
            console.log('Vendor Socket disconnected:', reason);
            useSocketStore.getState().setConnectionStatus(false);

            // Auto-reconnect on server disconnect (not manual disconnect)
            if (reason === 'io server disconnect') {
                console.log('Server disconnected, attempting to reconnect...');
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (accessToken) {
                        connectSocket(accessToken);
                    }
                }, RECONNECT_DELAY);
            }
        });

        // Listen for new orders
        socketRef.current.on('new_order', (data: any) => {
            console.log('📦 New order received:', data);
            toast.success(`🔔 ${data.message || 'New order received!'}`, {
                duration: 6000,
                position: 'top-right',
            });
            useSocketStore.getState().setLastEvent({ type: 'new_order', payload: data, timestamp: Date.now() });
        });

        // Listen for order updates
        socketRef.current.on('order_update', (data: any) => {
            console.log('📝 Order update received:', data);
            useSocketStore.getState().setLastEvent({ type: 'order_update', payload: data, timestamp: Date.now() });
        });

        // Listen for delivery updates
        socketRef.current.on('delivery:update', (data: any) => {
            console.log('🚚 Delivery update received:', data);
            useSocketStore.getState().setLastEvent({ type: 'delivery:update', payload: data, timestamp: Date.now() });
        });

    }, [refreshTokenAndReconnect, accessToken]);

    // Main effect - connect/disconnect based on auth state
    useEffect(() => {
        if (isAuthenticated && accessToken) {
            connectSocket(accessToken);
        } else {
            // Disconnect if logged out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            useSocketStore.getState().setConnectionStatus(false);
        }

        // Cleanup
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isAuthenticated, accessToken, connectSocket]);

    return socketRef.current;
};
