import api from './api';
import { calculateRoute, type Coordinates } from '../utils/osm.utils';

export interface Location {
    latitude: number;
    longitude: number;
    lastUpdate?: string;
}

export interface DeliveryTracking {
    delivery: {
        id: string;
        currentLocation: Location;
        isTracking: boolean;
        etaMinutes: number | null;
        distanceKm: number | null;
        routePolyline: string | null;
    };
    order: {
        orderNumber: string;
        shopLocation: {
            name: string;
            latitude: number;
            longitude: number;
            address: string;
        };
        deliveryLocation: {
            latitude: number;
            longitude: number;
            address: string;
            city: string;
        };
    };
    deliveryPartner: {
        name: string;
        phone: string;
        vehicleType: string;
        rating: number;
    };
}

export interface LocationHistory {
    id: string;
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    accuracy: number | null;
    timestamp: string;
}

export interface RouteCalculation {
    distance: number; // meters
    duration: number; // seconds
    polyline: string; // GeoJSON string
}

export const trackingService = {
    // Get delivery location (for customers)
    async getDeliveryLocation(deliveryId: string): Promise<DeliveryTracking> {
        const response = await api.get(`/api/v1/tracking/${deliveryId}`);
        return response.data;
    },

    // Get location history
    async getLocationHistory(deliveryId: string, limit = 50): Promise<LocationHistory[]> {
        const response = await api.get(`/api/v1/tracking/${deliveryId}/history?limit=${limit}`);
        return response.data;
    },

    // Calculate route using OSM (client-side)
    async calculateRouteOSM(start: Coordinates, end: Coordinates): Promise<RouteCalculation | null> {
        try {
            const route = await calculateRoute(start, end);
            if (!route) return null;

            return {
                distance: route.distance,
                duration: route.duration,
                polyline: route.geometry,
            };
        } catch (error) {
            console.error('Route calculation error:', error);
            return null;
        }
    },

    // Update route with OSM data (for delivery partners)
    async updateRouteWithOSM(
        deliveryId: string,
        currentLocation: Coordinates,
        destination: Coordinates
    ): Promise<void> {
        const route = await this.calculateRouteOSM(currentLocation, destination);

        if (route) {
            await api.post(`/api/v1/tracking/${deliveryId}/route`, {
                routePolyline: route.polyline,
                distanceMeters: route.distance,
                etaSeconds: route.duration,
            });
        }
    },
};
