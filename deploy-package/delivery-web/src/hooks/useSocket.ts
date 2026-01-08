import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

// Extract base URL from API_URL (remove /api/v1)
const SOCKET_URL = API_URL.replace('/api/v1', '');
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 seconds

export const useSocket = () => {
    const { token, refreshToken, isAuthenticated, setAuth, logout } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refresh token and reconnect
    const refreshTokenAndReconnect = useCallback(async () => {
        if (!refreshToken) {
            console.error('No refresh token available');
            logout();
            toast.error('Session expired. Please login again.');
            return false;
        }

        try {
            console.log('Attempting to refresh token...');
            const response = await authService.refreshToken(refreshToken);

            // Update auth store with new tokens
            setAuth(response.user, response.token, response.refreshToken);

            console.log('Token refreshed successfully');
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
            toast.error('Session expired. Please login again.');
            return false;
        }
    }, [refreshToken, setAuth, logout]);

    // Connect to socket with current token
    const connectSocket = useCallback((authToken: string) => {
        // Disconnect existing socket
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        console.log('Connecting to Delivery WebSocket...');
        socketRef.current = io(SOCKET_URL, {
            auth: { token: authToken },
            reconnection: true,
            reconnectionDelay: RECONNECT_DELAY,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        });

        // Connection successful
        socketRef.current.on('connect', () => {
            console.log('✅ Delivery Socket connected successfully');
            reconnectAttemptsRef.current = 0;
            useSocketStore.getState().setConnectionStatus(true);
        });

        // Connection error
        socketRef.current.on('connect_error', async (err) => {
            console.error('❌ Delivery Socket connection error:', err);

            // Check if it's an authentication error
            if (err.message.includes('Authentication error') || err.message.includes('jwt expired')) {
                console.log('JWT expired, attempting to refresh token...');

                // Attempt token refresh
                const refreshed = await refreshTokenAndReconnect();

                if (refreshed) {
                    // Reconnect with new token
                    const newToken = useAuthStore.getState().token;
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
            console.log('Delivery Socket disconnected:', reason);
            useSocketStore.getState().setConnectionStatus(false);

            // Auto-reconnect on server disconnect (not manual disconnect)
            if (reason === 'io server disconnect') {
                console.log('Server disconnected, attempting to reconnect...');
                reconnectTimeoutRef.current = setTimeout(() => {
                    if (token) {
                        connectSocket(token);
                    }
                }, RECONNECT_DELAY);
            }
        });

        // Listen for new delivery assignments
        socketRef.current.on('new_delivery', (data: any) => {
            console.log('🚚 New delivery received:', data);
            toast.success(data.message || '🎉 New delivery assigned!', {
                duration: 5000,
            });
            useSocketStore.getState().setLastEvent({ type: 'new_delivery', payload: data, timestamp: Date.now() });
        });

        // Listen for delivery updates
        socketRef.current.on('delivery:update', (data: any) => {
            console.log('📝 Delivery update received:', data);
            useSocketStore.getState().setLastEvent({ type: 'delivery:update', payload: data, timestamp: Date.now() });
        });

        // Listen for location updates
        socketRef.current.on('location:update', (data: any) => {
            console.log('📍 Location update received:', data);
            useSocketStore.getState().setLastEvent({ type: 'location:update', payload: data, timestamp: Date.now() });
        });

    }, [refreshTokenAndReconnect, token]);

    // Main effect - connect/disconnect based on auth state
    useEffect(() => {
        if (isAuthenticated && token) {
            connectSocket(token);
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
    }, [isAuthenticated, token, connectSocket]);

    return socketRef.current;
};
