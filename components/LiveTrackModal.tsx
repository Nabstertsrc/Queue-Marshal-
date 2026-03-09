import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Task, User } from '../types';

interface LiveTrackModalProps {
  task: Task;
  onClose: () => void;
}

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#00D26A" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#242424" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#555555" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e1e1e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#303030" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#555555" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a3a" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#555555" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#4a4a4a" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#242424" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1a2a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3a3a3a" }] },
];

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

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00D26A" width="36px" height="36px">
        <circle cx="12" cy="12" r="10" fill="#00D26A" opacity="0.2"/>
        <circle cx="12" cy="12" r="6" fill="#00D26A"/>
        <circle cx="12" cy="12" r="3" fill="#0D0D0D"/>
      </svg>
    `;

    const svgIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgString),
      scaledSize: new window.google.maps.Size(36, 36),
      anchor: new window.google.maps.Point(18, 18),
    };

    // Your location marker
    new window.google.maps.Marker({
      position: user.location,
      map: map,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#00D26A",
        fillOpacity: 0.3,
        strokeColor: "#00D26A",
        strokeWeight: 2,
      },
    });

    const unsubscribe = db.collection('users').doc(task.marshalId).onSnapshot((doc: any) => {
      const marshalData = doc.data() as User;
      if (marshalData?.location) {
        const newPosition = marshalData.location;

        if (!marshalMarkerRef.current) {
          marshalMarkerRef.current = new window.google.maps.Marker({
            position: newPosition,
            map: map,
            title: 'Marshal\'s Location',
            icon: svgIcon,
          });
        } else {
          animateMarker(marshalMarkerRef.current, newPosition);
        }

        if (user.location) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(user.location);
          bounds.extend(newPosition);
          map.fitBounds(bounds, 100);
        }
      }
    });

    return () => unsubscribe();

  }, [map, user, task.marshalId]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
      <div className="bg-dark-800 rounded-2xl shadow-2xl border border-dark-600/50 w-full h-full max-w-4xl max-h-[90vh] relative flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-dark-600/50 flex justify-between items-center bg-dark-800">
          <div>
            <h2 className="text-sm font-bold text-white">Live Tracking</h2>
            <p className="text-xs text-dark-400">{task.title}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-primary/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs text-primary font-medium">Live</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-dark-600 hover:bg-dark-500 text-dark-300 hover:text-white transition-all">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div ref={mapRef} className="flex-grow w-full h-full" />
      </div>
    </div>
  );
};

export default LiveTrackModal;