import React, { useEffect, useRef, useState } from 'react';
import type { Task } from '../types';

// Extend window interface for Google Maps
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

const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#e8f1fe" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#525252" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#1877f2" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#3175f6" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#d1e3fd" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a6b" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#a9c8fb" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#525252" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#a9c8fb" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#81acfa" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#d1e3fd" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#a9c8fb" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#ffffff" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#1877f2" }],
    },
];


const Map: React.FC<MapProps> = ({ tasks, onMarkerClick, selectedTaskId }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any | null>(null);
    const [markers, setMarkers] = useState<{ [key: string]: any }>({});
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        const handleApiError = (event: CustomEvent) => {
            setMapError(event.detail.message || 'An unknown error occurred while loading Google Maps.');
        };
        
        window.addEventListener('google-maps-api-error', handleApiError as EventListener);

        const initializeMap = () => {
            if (ref.current && !map && !mapError) {
                if (window.google && window.google.maps) {
                    const newMap = new window.google.maps.Map(ref.current, {
                        center: { lat: -26.2041, lng: 28.0473 },
                        zoom: 10,
                        styles: mapStyles,
                        disableDefaultUI: true,
                        zoomControl: true,
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
                setMapError('Google Maps failed to load. Please check the browser console for more details, verify your API key, and ensure billing is enabled.');
            }
        }, 5000);

        return () => {
            window.removeEventListener('google-maps-api-loaded', initializeMap);
            window.removeEventListener('google-maps-api-error', handleApiError as EventListener);
            clearTimeout(timeoutId);
        };
    }, [ref, map, mapError]);

    useEffect(() => {
        if (map && window.google) {
            // Clear existing markers
            Object.values(markers).forEach((marker: any) => marker.setMap(null));
            const newMarkers: { [key: string]: any } = {};

            tasks.forEach(task => {
                const marker = new window.google.maps.Marker({
                    position: task.location,
                    map: map,
                    title: task.title,
                    animation: window.google.maps.Animation.DROP,
                });

                marker.addListener('click', () => {
                   onMarkerClick(task.id);
                   map.panTo(task.location);
                   map.setZoom(15);
                });
                newMarkers[task.id] = marker;
            });

            setMarkers(newMarkers);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, tasks]);

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
            <div className="h-full w-full bg-red-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <h3 className="text-lg font-bold text-red-700">Map Error</h3>
                    <p className="text-red-600 mt-2">{mapError}</p>
                    <div className="mt-4 text-sm text-gray-600 text-left space-y-2 max-w-md mx-auto bg-red-100 p-4 rounded-lg border border-red-200">
                        <p className="font-semibold">This can be caused by a few common API key configuration issues:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                <strong>BillingNotEnabledMapError:</strong> Billing is not enabled for your Google Cloud project.
                                <a href="https://developers.google.com/maps/documentation/javascript/error-messages#billing-not-enabled-map-error" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1 font-medium">How to fix.</a>
                            </li>
                            <li>
                                <strong>ApiTargetBlockedMapError:</strong> Your API key is restricted and doesn't allow this website's URL.
                                <a href="https://developers.google.com/maps/documentation/javascript/error-messages#api-target-blocked-map-error" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1 font-medium">How to fix.</a>
                            </li>
                        </ul>
                        <p className="pt-2">Please check your API key settings in the Google Cloud Console to resolve this.</p>
                    </div>
                </div>
            </div>
        );
    }

    return <div ref={ref} style={{ height: '100%', width: '100%' }} />;
};

export default Map;
