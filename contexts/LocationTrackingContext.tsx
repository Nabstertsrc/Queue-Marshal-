import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useTasks } from './TaskContext';
import { UserRole, TaskStatus } from '../types';
import type { LocationTrackingContextType } from '../types';

const LocationTrackingContext = createContext<LocationTrackingContextType | null>(null);

export const LocationTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserLocation } = useAuth();
  const { getTasksByMarshal } = useTasks();
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (user?.role !== UserRole.MARSHAL) {
      // If user is not a marshal, ensure tracking is off.
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsTracking(false);
      }
      return;
    }

    const activeTasks = getTasksByMarshal(user.id).filter(
      (task) => task.status === TaskStatus.IN_PROGRESS
    );

    if (activeTasks.length > 0 && watchIdRef.current === null) {
      // Start tracking if there are active tasks and not already tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Geolocation watch error:', error);
          // Optional: handle specific errors like PERMISSION_DENIED
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
        }
      );
      watchIdRef.current = watchId;
      setIsTracking(true);
    } else if (activeTasks.length === 0 && watchIdRef.current !== null) {
      // Stop tracking if there are no active tasks but tracking is on
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
    
    // Cleanup function to stop watching when component unmounts or user changes
    return () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setIsTracking(false);
        }
    };

  }, [user, getTasksByMarshal, updateUserLocation]);

  return (
    <LocationTrackingContext.Provider value={{ isTracking }}>
      {children}
    </LocationTrackingContext.Provider>
  );
};

export const useLocationTracking = () => {
  const context = useContext(LocationTrackingContext);
  if (!context) {
    throw new Error('useLocationTracking must be used within a LocationTrackingProvider');
  }
  return context;
};
