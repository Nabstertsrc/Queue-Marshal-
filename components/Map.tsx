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


const Map: React.FC<MapProps> = ({ tasks, onMarkerClick }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any | null>(null);
    const [markers, setMarkers] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        const initializeMap = () => {
            if (ref.current && !map) {
                const newMap = new window.google.maps.Map(ref.current, {
                    center: { lat: -26.2041, lng: 28.0473 }, // Default to Johannesburg
                    zoom: 10,
                    styles: mapStyles,
                    disableDefaultUI: true,
                    zoomControl: true,
                });
                setMap(newMap);
            }
        };

        if (window.google) {
            initializeMap();
        } else {
            window.addEventListener('google-maps-api-loaded', initializeMap);
        }
        
        return () => {
            window.removeEventListener('google-maps-api-loaded', initializeMap);
        };
    }, [ref, map]);

    useEffect(() => {
        if (map && window.google) {
             // Clear old markers
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
                });
                newMarkers[task.id] = marker;
            });

            setMarkers(newMarkers);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, tasks]);


    return <div ref={ref} style={{ height: '100%', width: '100%' }} />;
};

export default Map;