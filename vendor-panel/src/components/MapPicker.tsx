import { useState, useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPickerProps {
    initialLocation: { lat: number; lng: number };
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    apiKey?: string; // Optional for compatibility
}

export default function MapPicker({ initialLocation, onLocationSelect }: MapPickerProps) {
    const mapRef = useRef<MapRef>(null);

    // Default to New Delhi if no location provided
    const defaultLocation = { lat: 28.6139, lng: 77.2090 };

    const [viewState, setViewState] = useState({
        longitude: initialLocation.lng || defaultLocation.lng,
        latitude: initialLocation.lat || defaultLocation.lat,
        zoom: 13
    });

    const [marker, setMarker] = useState<{ lat: number, lng: number } | null>(
        initialLocation.lat && initialLocation.lng ? initialLocation : null
    );

    // Sync prop changes
    useEffect(() => {
        if (initialLocation.lat && initialLocation.lng) {
            setMarker(initialLocation);

            // Fly to the new location to visually confirm the update
            if (mapRef.current) {
                mapRef.current.flyTo({
                    center: [initialLocation.lng, initialLocation.lat],
                    zoom: 14,
                    essential: true
                });
            }

            // Sync internal view state as well
            setViewState(prev => ({
                ...prev,
                latitude: initialLocation.lat,
                longitude: initialLocation.lng,
                zoom: 14
            }));
        }
    }, [initialLocation.lat, initialLocation.lng]);

    const handleClick = (event: any) => {
        const { lngLat } = event;
        const newLocation = { lat: lngLat.lat, lng: lngLat.lng };
        setMarker(newLocation);
        onLocationSelect(newLocation);
    };

    return (
        <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-300 relative shadow-inner">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                // Using Carto Positron (OSM based) free style
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                mapLib={maplibregl}
                onClick={handleClick}
                cursor="crosshair"
                attributionControl={false}
            >
                <NavigationControl position="top-right" />

                {marker && (
                    <Marker
                        longitude={marker.lng}
                        latitude={marker.lat}
                        anchor="bottom"
                        draggable
                        onDragEnd={(e) => {
                            const newLocation = { lat: e.lngLat.lat, lng: e.lngLat.lng };
                            setMarker(newLocation);
                            onLocationSelect(newLocation);
                        }}
                    >
                        <div className="text-indigo-600 drop-shadow-xl filter cursor-pointer hover:scale-110 transition-transform">
                            <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" fillRule="evenodd" />
                            </svg>
                        </div>
                    </Marker>
                )}
            </Map>
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded-md px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-md z-10 flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                Click or drag marker to select location
            </div>

            <div className="absolute bottom-1 right-1 bg-white/50 px-1 text-[10px] text-gray-500 rounded">
                © OpenStreetMap, © Carto
            </div>
        </div>
    );
}
