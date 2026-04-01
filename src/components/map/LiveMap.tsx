import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '@/hooks/useGeolocation';

// Fix default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:hsl(142,76%,36%);border:3px solid white;box-shadow:0 0 8px rgba(0,0,0,0.3),0 0 20px rgba(34,197,94,0.4);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface LiveMapProps {
  className?: string;
  showAccuracy?: boolean;
  followUser?: boolean;
  enabled?: boolean;
}

const LiveMap: React.FC<LiveMapProps> = ({
  className = '',
  showAccuracy = true,
  followUser = true,
  enabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const initializedRef = useRef(false);
  const { position, error } = useGeolocation(enabled);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-1.2921, 36.8219], // Nairobi default
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OSM',
    }).addTo(map);

    mapRef.current = map;
    initializedRef.current = true;

    // Fix blank map when returning to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mapRef.current) {
        setTimeout(() => mapRef.current?.invalidateSize(), 200);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  // Update marker on position change
  useEffect(() => {
    if (!mapRef.current || !position) return;
    const latlng: L.LatLngExpression = [position.lat, position.lng];

    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup('<b>You are here</b>');
    } else {
      markerRef.current.setLatLng(latlng);
    }

    if (showAccuracy && position.accuracy > 30) {
      if (!circleRef.current) {
        circleRef.current = L.circle(latlng, {
          radius: position.accuracy,
          color: 'hsl(142,76%,36%)',
          fillColor: 'hsl(142,76%,36%)',
          fillOpacity: 0.08,
          weight: 1,
        }).addTo(mapRef.current);
      } else {
        circleRef.current.setLatLng(latlng);
        circleRef.current.setRadius(position.accuracy);
      }
    }

    if (followUser) {
      mapRef.current.setView(latlng, mapRef.current.getZoom(), { animate: true });
    }
  }, [position, followUser, showAccuracy]);

  if (error && !position) {
    return (
      <div className={`flex items-center justify-center bg-secondary ${className}`}>
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
            <span className="text-lg">📍</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">Location access needed</p>
          <p className="text-[10px] text-muted-foreground/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {position && (
        <div className="absolute top-2 right-2 z-[1000] bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm border border-border/50">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-medium text-foreground">Live</span>
        </div>
      )}
    </div>
  );
};

export default LiveMap;
