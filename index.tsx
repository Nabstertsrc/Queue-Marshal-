
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Initialize the Google Maps loader as early as possible
const loadGoogleMaps = () => {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const key = envKey && !envKey.startsWith('%') ? envKey : "AIzaSyAFB_Zx6Id5jvjPrQGahLb27ay0ge6K1_w";

  if (!key) {
    console.error('Google Maps API Key missing or incorrectly formatted in environments.');
    return;
  }

  if ((window as any).googleMapsApiLoaded) return;

  // Set up global initMap callback for Google Maps script
  (window as any).initMap = () => {
    (window as any).googleMapsApiLoaded = true;
    window.dispatchEvent(new CustomEvent('google-maps-api-loaded'));
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,marker&callback=initMap&loading=async`;
  script.async = true;
  script.defer = true;
  script.onerror = () => window.dispatchEvent(new CustomEvent('google-maps-api-error', {
    detail: { message: 'Google Maps script failed to load.' }
  }));
  document.head.appendChild(script);
};

// Start loading the maps API
loadGoogleMaps();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
