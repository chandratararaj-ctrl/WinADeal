import { useState, useEffect, useCallback, useRef } from 'react';
import trackingService from '../services/tracking.service';
import toast from 'react-hot-toast';

interface LocationTrackerOptions {
    deliveryId: string | null;
    enabled: boolean;
    updateInterval?: number; // milliseconds
}

export function useLocationTracker({ deliveryId, enabled, updateInterval = 10000 }: LocationTrackerOptions) {
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
    const [error, setError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const updateIntervalRef = useRef<any | null>(null);

    const latestLocationRef = useRef<GeolocationPosition | null>(null);

    // Get current position with fallback
    const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            // Options for high accuracy
            const highAccuracyOptions = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            };

            // Options for low accuracy fallback
            const lowAccuracyOptions = {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 30000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => {
                    console.warn('High accuracy positioning failed, falling back to low accuracy', error);
                    // Fallback to low accuracy
                    navigator.geolocation.getCurrentPosition(
                        (position) => resolve(position),
                        (fallbackError) => reject(fallbackError),
                        lowAccuracyOptions
                    );
                },
                highAccuracyOptions
            );
        });
    }, []);

    // Send location update to server
    const sendLocationUpdate = useCallback(async (position: GeolocationPosition) => {
        if (!deliveryId) return;

        try {
            await trackingService.updateLocation(deliveryId, {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                speed: position.coords.speed || undefined,
                heading: position.coords.heading || undefined,
                accuracy: position.coords.accuracy
            });
            setCurrentLocation(position);
            setError(null);
        } catch (err: any) {
            console.error('Failed to update location:', err);
            // setError(err.message || 'Failed to update location');
        }
    }, [deliveryId]);

    // Start tracking
    const startTracking = useCallback(async () => {
        if (!deliveryId) {
            toast.error('No delivery selected');
            return;
        }

        try {
            // Request permission and get initial position
            const position = await getCurrentPosition();
            latestLocationRef.current = position;

            // Start tracking on server
            await trackingService.startTracking(deliveryId);

            // Send initial location
            await sendLocationUpdate(position);

            setIsTracking(true);
            toast.success('GPS tracking started');

            // Watch position changes
            if (navigator.geolocation) {
                const watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        setCurrentLocation(position);
                        latestLocationRef.current = position;
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        // Don't set global error immediately on watch failure, as it retries
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 30000,
                        maximumAge: 10000
                    }
                );
                watchIdRef.current = watchId;
            }

            // Set up periodic updates
            const intervalId = setInterval(async () => {
                try {
                    // Use the latest position from watchPosition if available and fresh enough
                    const latest = latestLocationRef.current;
                    const now = Date.now();
                    const isFresh = latest && (now - latest.timestamp < updateInterval * 2);

                    if (isFresh && latest) {
                         await sendLocationUpdate(latest);
                    } else {
                        // If no fresh location from watch, verify with explicit call
                        const position = await getCurrentPosition();
                         latestLocationRef.current = position;
                        await sendLocationUpdate(position);
                    }
                } catch (err) {
                    console.error('Failed to get position:', err);
                }
            }, updateInterval);
            updateIntervalRef.current = intervalId;

        } catch (err: any) {
            console.error('Failed to start tracking:', err);
            toast.error(err.message || 'Failed to start GPS tracking');
            setError(err.message);
        }
    }, [deliveryId, getCurrentPosition, sendLocationUpdate, updateInterval]);

    // Stop tracking
    const stopTracking = useCallback(async () => {
        if (!deliveryId) return;

        try {
            // Stop watching position
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }

            // Clear update interval
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
                updateIntervalRef.current = null;
            }
            
            latestLocationRef.current = null;

            // Stop tracking on server
            await trackingService.stopTracking(deliveryId);

            setIsTracking(false);
            toast.success('GPS tracking stopped');
        } catch (err: any) {
            console.error('Failed to stop tracking:', err);
            toast.error('Failed to stop GPS tracking');
        }
    }, [deliveryId]);

    // Auto-start/stop based on enabled prop
    useEffect(() => {
        if (enabled && deliveryId && !isTracking) {
            startTracking();
        } else if (!enabled && isTracking) {
            stopTracking();
        }
    }, [enabled, deliveryId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
            }
        };
    }, []);

    return {
        isTracking,
        currentLocation,
        error,
        startTracking,
        stopTracking
    };
}
