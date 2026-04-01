import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation, type GeoPosition } from '@/hooks/useGeolocation';

// Fix Leaflet default marker icons in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:hsl(142,76%,36%);
    border:3px solid white;
    box-shadow:0 0 8px rgba(0,0,0,0.3),0 0 20px rgba(34,197,94,0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const pickupIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:hsl(142,76%,36%);
    border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destinationIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;border-radius:4px;
    background:hsl(0,84%,60%);
    border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/** Recenter the map when position changes */
function RecenterMap({ position }: { position: GeoPosition }) {
  const map = useMap();
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
  }, [position.lat, position.lng, map]);
  return null;
}

interface LiveMapProps {
  className?: string;
  showAccuracy?: boolean;
  pickupCoords?: { lat: number; lng: number } | null;
  destinationCoords?: { lat: number; lng: number } | null;
  driverCoords?: { lat: number; lng: number } | null;
  followUser?: boolean;
  enabled?: boolean;
}

const LiveMap: React.FC<LiveMapProps> = ({
  className = '',
  showAccuracy = true,
  pickupCoords,
  destinationCoords,
  driverCoords,
  followUser = true,
  enabled = true,
}) => {
  const { position, error } = useGeolocation(enabled);

  const center = useMemo(() => {
    if (position) return { lat: position.lat, lng: position.lng };
    // Default to Nairobi
    return { lat: -1.2921, lng: 36.8219 };
  }, [position]);

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
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={15}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        {/* User's real position */}
        {position && (
          <>
            {followUser && <RecenterMap position={position} />}
            <Marker position={[position.lat, position.lng]} icon={userIcon}>
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">You are here</p>
                  <p className="text-muted-foreground">
                    Accuracy: {Math.round(position.accuracy)}m
                  </p>
                  {position.speed !== null && (
                    <p className="text-muted-foreground">
                      Speed: {Math.round(position.speed * 3.6)} km/h
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
            {showAccuracy && position.accuracy > 30 && (
              <Circle
                center={[position.lat, position.lng]}
                radius={position.accuracy}
                pathOptions={{
                  color: 'hsl(142,76%,36%)',
                  fillColor: 'hsl(142,76%,36%)',
                  fillOpacity: 0.08,
                  weight: 1,
                }}
              />
            )}
          </>
        )}

        {/* Pickup marker */}
        {pickupCoords && (
          <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon}>
            <Popup><span className="text-xs font-medium">Pickup</span></Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destinationCoords && (
          <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon}>
            <Popup><span className="text-xs font-medium">Destination</span></Popup>
          </Marker>
        )}

        {/* Driver marker */}
        {driverCoords && (
          <Marker position={[driverCoords.lat, driverCoords.lng]} icon={userIcon}>
            <Popup><span className="text-xs font-medium">Driver</span></Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Location status badge */}
      {position && (
        <div className="absolute top-2 right-2 z-[400] bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm border border-border/50">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-medium text-foreground">Live</span>
        </div>
      )}
    </div>
  );
};

export default LiveMap;
