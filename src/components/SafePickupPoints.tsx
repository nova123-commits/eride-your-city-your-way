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

// Fallback landmarks when API is unavailable
const FALLBACK_POINTS: PickupPoint[] = [
  { name: 'Total Energies Station', address: 'Total Station, Moi Avenue', type: 'fuel' },
  { name: 'Naivas Supermarket', address: 'Naivas, Tom Mboya St', type: 'mall' },
  { name: 'KICC Building', address: 'KICC, City Hall Way', type: 'landmark' },
];

const SafePickupPoints: React.FC<SafePickupPointsProps> = ({ onSelect }) => {
  const [points, setPoints] = useState<PickupPoint[]>(FALLBACK_POINTS);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      if (!navigator.geolocation) return;

      setLoading(true);
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );

        const { data, error } = await supabase.functions.invoke('nearby-landmarks', {
          body: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        });

        if (!error && data?.points?.length > 0) {
          setPoints(data.points.slice(0, 3));
        }
      } catch {
        // Use fallback points
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyPlaces();
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
