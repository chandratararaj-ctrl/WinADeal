import { useEffect, useState, useMemo, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface DeliveryMapProps {
    deliveryPartnerLocation?: { lat: number; lng: number };
    shopLocation?: { lat: number; lng: number };
    customerLocation?: { lat: number; lng: number };
    routePolyline?: string; // GeoJSON coordinates as string
    deliveryPartnerName?: string;
    shopName?: string;
    customerName?: string;
}

export default function DeliveryMap({
    deliveryPartnerLocation,
    shopLocation,
    customerLocation,
    routePolyline,
    deliveryPartnerName = 'Delivery Partner',
    shopName = 'Shop',
    customerName = 'Customer',
}: DeliveryMapProps) {
    const mapRef = useRef<MapRef>(null);

    // Default center (Delhi)
    const [viewState, setViewState] = useState({
        longitude: 77.209,
        latitude: 28.6139,
        zoom: 13
    });

    const routeGeoJSON = useMemo(() => {
        if (!routePolyline) return null;
        try {
            // Check if it's already a stringified GeoJSON or needs decoding
            // Assuming stringified GeoJSON as per delivery-web
            const parsed = JSON.parse(routePolyline);
            return {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: parsed.coordinates // MapLibre expects [lng, lat]
                }
            };
        } catch (e) {
            // If JSON parse fails, maybe it's an encoded polyline?
            // For now we assume GeoJSON string as standardized
            console.error('Error parsing polyline', e);
            return null;
        }
    }, [routePolyline]);

    useEffect(() => {
        if (!mapRef.current) return;

        const bounds = new maplibregl.LngLatBounds();
        let hasPoints = false;

        const points = [
            deliveryPartnerLocation, shopLocation, customerLocation
        ];

        points.forEach(p => {
            if (p?.lat != null && p?.lng != null) {
                bounds.extend([p.lng, p.lat]);
                hasPoints = true;
            }
        });

        if (hasPoints) {
            try {
                mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
            } catch (e) {
                console.warn('Could not fit bounds', e);
            }
        }
    }, [deliveryPartnerLocation, shopLocation, customerLocation]);

    const MarkerItem = ({ location, label, emoji, color }: any) => {
        if (!location?.lat || !location?.lng) return null;
        return (
            <Marker longitude={location.lng} latitude={location.lat} anchor="center">
                <div className="relative group cursor-pointer flex flex-col items-center">
                    <div style={{
                        backgroundColor: color,
                        width: '40px',
                        height: '40px',
                        borderRadius: '50% 50% 50% 0',
                        transform: 'rotate(-45deg)',
                        border: '3px solid white',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{ transform: 'rotate(45deg)', fontSize: '20px' }}>{emoji}</span>
                    </div>

                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 hidden group-hover:block bg-white px-2 py-1 rounded shadow text-xs font-semibold whitespace-nowrap z-50 text-gray-800 border border-gray-200">
                        {label}
                    </div>
                </div>
            </Marker>
        );
    }

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg border border-gray-100">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                // Using Carto Positron (OSM based) free style
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                mapLib={maplibregl}
                attributionControl={false}
            >
                <NavigationControl position="top-right" />

                {/* Route Line */}
                {routeGeoJSON && (
                    <Source type="geojson" data={routeGeoJSON as any}>
                        <Layer
                            id="route"
                            type="line"
                            layout={{
                                'line-join': 'round',
                                'line-cap': 'round'
                            }}
                            paint={{
                                'line-color': '#3b82f6',
                                'line-width': 4,
                                'line-opacity': 0.8,
                                'line-dasharray': [2, 1]
                            }}
                        />
                    </Source>

                )}

                <MarkerItem location={shopLocation} label={shopName} emoji="🏪" color="#3b82f6" />
                <MarkerItem location={customerLocation} label={customerName} emoji="📍" color="#ef4444" />
                <MarkerItem location={deliveryPartnerLocation} label={deliveryPartnerName} emoji="🚚" color="#10b981" />

            </Map>

            {/* Custom Attribution */}
            <div className="absolute bottom-1 right-1 bg-white/50 px-1 text-[10px] text-gray-600 rounded">
                © OpenStreetMap, © Carto
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 z-[10]">
                <div className="text-[10px] space-y-1">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Me</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Shop</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Cust</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
