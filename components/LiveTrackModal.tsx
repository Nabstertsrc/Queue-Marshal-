import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Task, User } from '../types';

interface LiveTrackModalProps {
  task: Task;
  onClose: () => void;
}

const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#1877f2" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

// Animation helper for smooth marker movement
const animateMarker = (marker: any, newPosition: any, duration: number = 1000) => {
    const startPosition = marker.getPosition();
    const startTime = Date.now();

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const fraction = elapsed / duration;

        if (fraction < 1) {
            const lat = startPosition.lat() + (newPosition.lat - startPosition.lat()) * fraction;
            const lng = startPosition.lng() + (newPosition.lng - startPosition.lng()) * fraction;
            marker.setPosition({ lat, lng });
            requestAnimationFrame(animate);
        } else {
            marker.setPosition(newPosition);
        }
    };
    requestAnimationFrame(animate);
};

const LiveTrackModal: React.FC<LiveTrackModalProps> = ({ task, onClose }) => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const marshalMarkerRef = useRef<any | null>(null);
  
  useEffect(() => {
    if (mapRef.current && !map && window.google) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: task.location,
        zoom: 15,
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
      });
      setMap(newMap);
    }
  }, [mapRef, map, task.location]);

  useEffect(() => {
    if (!map || !user?.location || !task.marshalId) return;

    // FIX: Directly define the SVG as a string to avoid ReactDOM.render, which is deprecated in React 18.
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1877F2" width="32px" height="32px">
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M20.5 5.5c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zM5 19h10V5H5v14zm8-12h2v2h-2V7zm0 4h2v2h-2v-2z" opacity=".3"/>
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11V7h14v4H5z"/>
        <path d="M20.5 6.5c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
      </svg>
    `;
    
    const svgIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgString),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16),
    };
    
    // Requester's marker (static)
    new window.google.maps.Marker({
        position: user.location,
        map: map,
        title: 'Your Location',
        icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
        },
    });

    const unsubscribe = db.collection('users').doc(task.marshalId).onSnapshot((doc) => {
        const marshalData = doc.data() as User;
        if (marshalData?.location) {
            const newPosition = marshalData.location;

            if (!marshalMarkerRef.current) {
                // Create Marshal marker for the first time
                marshalMarkerRef.current = new window.google.maps.Marker({
                    position: newPosition,
                    map: map,
                    title: 'Marshal\'s Location',
                    icon: svgIcon,
                });
            } else {
                // Animate to new position
                animateMarker(marshalMarkerRef.current, newPosition);
            }
            
            // Adjust map bounds to keep both markers in view
            if (user.location) {
                const bounds = new window.google.maps.LatLngBounds();
                bounds.extend(user.location);
                bounds.extend(newPosition);
                map.fitBounds(bounds, 100); // 100px padding
            }
        }
    });

    return () => unsubscribe();

  }, [map, user, task.marshalId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-4xl max-h-[90vh] relative flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Live Tracking: {task.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div ref={mapRef} className="flex-grow w-full h-full rounded-b-lg" />
      </div>
    </div>
  );
};

export default LiveTrackModal;