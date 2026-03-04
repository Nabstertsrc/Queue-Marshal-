import React, { useEffect, useRef, useState } from 'react';
import type { Task } from '../types';

declare global {
    interface Window {
        google: any;
        googleMapsApiLoaded?: boolean;
    }
}

interface MapProps {
    tasks: Task[];
    onMarkerClick: (taskId: string) => void;
    selectedTaskId?: string | null;
}

// Uber/Bolt-style dark map theme
const darkMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#00D26A" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#222222" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#555" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e2e1e" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3a5a3a" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a1a" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#555" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#333333" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a3a" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#2a2a2a" }] },
    { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#444" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#444" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#222" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#555" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1a2e" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3a3a5a" }] },
];

// Custom SVG marker for task pins
const createCustomMarkerSvg = (fee: number, isSelected: boolean) => {
    const color = isSelected ? '#00D26A' : '#FFFFFF';
    const bgColor = isSelected ? '#00D26A' : '#333';
    const textColor = isSelected ? '#0D0D0D' : '#FFF';
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
        <defs>
            <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
            </filter>
        </defs>
        <g filter="url(#shadow)">
            <path d="M24 52 C24 52 6 34 6 20 C6 10.06 14.06 2 24 2 C33.94 2 42 10.06 42 20 C42 34 24 52 24 52Z" fill="${bgColor}" stroke="${color}" stroke-width="1.5"/>
            <text x="24" y="24" text-anchor="middle" fill="${textColor}" font-size="11" font-weight="700" font-family="Inter,sans-serif">R${fee > 999 ? '999+' : fee.toFixed(0)}</text>
        </g>
    </svg>`;
};


const Map: React.FC<MapProps> = ({ tasks, onMarkerClick, selectedTaskId }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any | null>(null);
    const [markers, setMarkers] = useState<{ [key: string]: any }>({});
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        const handleApiError = (event: CustomEvent) => {
            setMapError(event.detail.message || 'An error occurred loading Google Maps.');
        };

        window.addEventListener('google-maps-api-error', handleApiError as EventListener);

        const initializeMap = () => {
            if (ref.current && !map && !mapError) {
                if (window.google && window.google.maps) {
                    const newMap = new window.google.maps.Map(ref.current, {
                        center: { lat: -26.2041, lng: 28.0473 },
                        zoom: 11,
                        styles: darkMapStyles,
                        mapId: 'DEMO_MAP_ID', // Required for Advanced Markers
                        disableDefaultUI: true,
                        zoomControl: true,
                        zoomControlOptions: {
                            position: window.google.maps.ControlPosition.RIGHT_CENTER,
                        },
                        fullscreenControl: false,
                        mapTypeControl: false,
                        streetViewControl: false,
                        gestureHandling: 'greedy',
                    });
                    setMap(newMap);
                }
            }
        };

        if (window.googleMapsApiLoaded) {
            initializeMap();
        } else {
            window.addEventListener('google-maps-api-loaded', initializeMap);
        }

        const timeoutId = setTimeout(() => {
            if (!window.google && !mapError) {
                setMapError('Google Maps failed to load. Please check your API key and billing settings.');
            }
        }, 8000);

        return () => {
            window.removeEventListener('google-maps-api-loaded', initializeMap);
            window.removeEventListener('google-maps-api-error', handleApiError as EventListener);
            clearTimeout(timeoutId);
        };
    }, [ref, map, mapError]);

    useEffect(() => {
        if (map && window.google) {
            // Remove old markers
            Object.values(markers).forEach((marker: any) => {
                marker.map = null;
            });

            const newMarkers: { [key: string]: any } = {};
            const bounds = new window.google.maps.LatLngBounds();
            let hasValidBounds = false;

            tasks.forEach(task => {
                const isSelected = selectedTaskId === task.id;
                const container = document.createElement('div');
                container.innerHTML = createCustomMarkerSvg(task.fee, isSelected);

                const marker = new window.google.maps.marker.AdvancedMarkerElement({
                    position: task.location,
                    map: map,
                    title: task.title,
                    content: container,
                });

                marker.addListener('click', () => {
                    onMarkerClick(task.id);
                    map.panTo(task.location);
                    map.setZoom(15);
                });

                newMarkers[task.id] = marker;
                bounds.extend(task.location);
                hasValidBounds = true;
            });

            // Auto-fit bounds if there are tasks
            if (hasValidBounds && tasks.length > 1) {
                map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
            }

            setMarkers(newMarkers);
        }
    }, [map, tasks, selectedTaskId]);

    useEffect(() => {
        if (map && selectedTaskId) {
            const task = tasks.find(t => t.id === selectedTaskId);
            if (task) {
                map.panTo(task.location);
                map.setZoom(15);
            }
        }
    }, [map, selectedTaskId, tasks]);

    if (mapError) {
        return (
            <div className="h-full w-full bg-dark-800 flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 mb-4">
                        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">Map Unavailable</h3>
                    <p className="text-dark-300 text-xs leading-relaxed">{mapError}</p>
                    <div className="mt-4 p-3 bg-dark-700 rounded-xl border border-dark-600 text-left">
                        <p className="text-xs font-medium text-dark-200 mb-2">Common fixes:</p>
                        <ul className="text-xs text-dark-400 space-y-1 list-disc list-inside">
                            <li>Enable billing on Google Cloud</li>
                            <li>Enable Maps JavaScript API</li>
                            <li>Check API key restrictions</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            <div ref={ref} className="h-full w-full" />
            {/* Map loading state */}
            {!map && !mapError && (
                <div className="absolute inset-0 bg-dark-800 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-3">
                        <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                        </svg>
                        <span className="text-dark-300 text-xs">Loading map...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Map;
