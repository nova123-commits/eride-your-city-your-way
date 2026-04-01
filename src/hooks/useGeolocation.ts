import { useState, useEffect, useRef } from 'react';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export function useGeolocation(enabled = true, highAccuracy = true) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      if (!navigator.geolocation) setError('Geolocation not supported');
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      });
      setError(null);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err.message);
    };

    const opts: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 15000,
      maximumAge: 3000,
    };

    // Get initial position quickly
    navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);

    // Then watch for updates
    watchRef.current = navigator.geolocation.watchPosition(onSuccess, onError, opts);

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [enabled, highAccuracy]);

  return { position, error };
}
