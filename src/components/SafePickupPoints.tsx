import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Fuel, ShoppingBag, Building2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SafePickupPointsProps {
  onSelect: (address: string) => void;
}

interface PickupPoint {
  name: string;
  address: string;
  type: 'fuel' | 'mall' | 'landmark';
}

const ICON_MAP = {
  fuel: Fuel,
  mall: ShoppingBag,
  landmark: Building2,
};

/** Haversine distance in km */
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SafePickupPoints: React.FC<SafePickupPointsProps> = ({ onSelect }) => {
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPoints = async () => {
      try {
        // Fetch all active pickup points from DB
        const { data: dbPoints } = await supabase
          .from('safe_pickup_points')
          .select('name, address, type, latitude, longitude')
          .eq('is_active', true);

        if (cancelled || !dbPoints?.length) {
          if (!cancelled) setLoading(false);
          return;
        }

        // Try to get user location to sort by proximity
        let userLat = -1.2921; // default Nairobi CBD
        let userLng = 36.8219;

        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          userLat = pos.coords.latitude;
          userLng = pos.coords.longitude;
        } catch {
          // Use default Nairobi coordinates
        }

        if (cancelled) return;

        // Sort by distance and pick closest 5
        const sorted = dbPoints
          .map((p) => ({
            name: p.name,
            address: p.address,
            type: p.type as PickupPoint['type'],
            dist: distanceKm(userLat, userLng, p.latitude, p.longitude),
          }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 5);

        setPoints(sorted);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPoints();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (point: PickupPoint) => {
    setSelected(point.name);
    onSelect(point.address);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <MapPin className="w-3 h-3 text-primary" />
        Safe Pickup Points
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {points.map((point) => {
          const Icon = ICON_MAP[point.type];
          const isSelected = selected === point.name;
          return (
            <motion.button
              key={point.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(point)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all btn-press ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:border-primary/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              Pickup at {point.name}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SafePickupPoints;
