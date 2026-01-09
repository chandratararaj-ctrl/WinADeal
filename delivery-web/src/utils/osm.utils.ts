/**
 * OpenStreetMap Utilities
 * Free geocoding and routing using Nominatim and OSRM
 */

// Nominatim API for geocoding (free, rate-limited)
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// OSRM API for routing (free, public instance)
const OSRM_BASE = 'https://router.project-osrm.org';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: string; // polyline encoded
  coordinates: [number, number][]; // [[lng, lat], ...]
}

/**
 * Geocode an address to coordinates using Nominatim
 * Rate limit: 1 request per second
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE}/search?` +
      new URLSearchParams({
        q: address,
        format: 'json',
        limit: '1',
        addressdetails: '1',
      }),
      {
        headers: {
          'User-Agent': 'WinADeal-Platform/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data: GeocodingResult[] = await response.json();

    if (data.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address using Nominatim
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE}/reverse?` +
      new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
      }),
      {
        headers: {
          'User-Agent': 'WinADeal-Platform/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data: GeocodingResult = await response.json();
    return data.display_name;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Calculate route between two points using OSRM
 * Returns distance, duration, and route geometry
 */
export async function calculateRoute(
  start: Coordinates,
  end: Coordinates
): Promise<RouteResult | null> {
  try {
    // OSRM uses lng,lat format (opposite of lat,lng)
    const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;

    const response = await fetch(
      `${OSRM_BASE}/route/v1/driving/${coords}?` +
      new URLSearchParams({
        overview: 'full',
        geometries: 'geojson',
        steps: 'false',
      })
    );

    if (!response.ok) {
      throw new Error('Routing failed');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];

    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: JSON.stringify(route.geometry), // Store as string for backend
      coordinates: route.geometry.coordinates, // [[lng, lat], ...]
    };
  } catch (error) {
    console.error('Routing error:', error);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Estimate ETA based on current time and duration
 */
export function estimateETA(durationSeconds: number): Date {
  const now = new Date();
  return new Date(now.getTime() + durationSeconds * 1000);
}

/**
 * Format ETA for display
 */
export function formatETA(eta: Date): string {
  const hours = eta.getHours();
  const minutes = eta.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Decode polyline geometry from OSRM
 * Converts GeoJSON coordinates to Leaflet LatLng format
 */
export function decodePolyline(coordinates: [number, number][]): [number, number][] {
  // OSRM returns [lng, lat], but Leaflet needs [lat, lng]
  return coordinates.map(([lng, lat]) => [lat, lng]);
}
