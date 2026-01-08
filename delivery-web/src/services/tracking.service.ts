import api from './api';
import { calculateRoute, type Coordinates } from '../utils/osm.utils';

export interface LocationUpdate {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
}

export interface RouteUpdate {
    routePolyline: string;
    distanceKm: number;
    etaMinutes: number;
}

export interface ActiveDelivery {
    id: string;
    orderId: string;
    order: {
        orderNumber: string;
        shop: {
            name: string;
            latitude: number;
            longitude: number;
            address: string;
        };
        deliveryAddress: {
            latitude: number;
            longitude: number;
            address: string;
            city: string;
        };
    };
    currentLatitude: number | null;
    currentLongitude: number | null;
    isTracking: boolean;
    etaMinutes: number | null;
    distanceKm: number | null;
}

class TrackingService {
    /**
     * Start GPS tracking for a delivery
     */
    async startTracking(deliveryId: string): Promise<void> {
        await api.post(`/tracking/${deliveryId}/start`);
    }

    /**
     * Update current location
     */
    async updateLocation(deliveryId: string, location: LocationUpdate): Promise<void> {
        await api.post(`/tracking/${deliveryId}/location`, location);
    }

    /**
     * Update route and ETA
     */
    async updateRoute(deliveryId: string, route: RouteUpdate): Promise<void> {
        await api.post(`/tracking/${deliveryId}/route`, route);
    }

    /**
     * Stop GPS tracking
     */
    async stopTracking(deliveryId: string): Promise<void> {
        await api.post(`/tracking/${deliveryId}/stop`);
    }

    /**
     * Get all active deliveries for the current delivery partner
     */
    async getActiveDeliveries(): Promise<ActiveDelivery[]> {
        const response = await api.get('/tracking/active');
        return response.data;
    }

    /**
     * Calculate and update route using OSM
     */
    async calculateAndUpdateRoute(
        deliveryId: string,
        currentLocation: Coordinates,
        destination: Coordinates
    ): Promise<void> {
        try {
            const route = await calculateRoute(currentLocation, destination);

            if (route) {
                await this.updateRoute(deliveryId, {
                    routePolyline: route.geometry,
                    distanceKm: route.distance / 1000, // Convert meters to km
                    etaMinutes: Math.round(route.duration / 60), // Convert seconds to minutes
                });
            }
        } catch (error) {
            console.error('Failed to calculate route:', error);
            // Don't throw - route calculation is optional
        }
    }

    /**
     * Update location and route in one call
     */
    async updateLocationWithRoute(
        deliveryId: string,
        location: LocationUpdate,
        destination: Coordinates
    ): Promise<void> {
        // Update location first
        await this.updateLocation(deliveryId, location);

        // Then calculate and update route
        await this.calculateAndUpdateRoute(
            deliveryId,
            { lat: location.latitude, lng: location.longitude },
            destination
        );
    }
}

export default new TrackingService();
