import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Navigation, Car, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ERideLogo from '@/components/ERideLogo';

interface TripData {
  pickup: string;
  destination: string;
  driver_name: string | null;
  vehicle: string | null;
  plate: string | null;
  is_active: boolean;
}

const SharedTrip: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    supabase
      .from('shared_trips')
      .select('pickup, destination, driver_name, vehicle, plate, is_active')
      .eq('share_token', token)
      .single()
      .then(({ data }) => {
        setTrip(data);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg font-semibold">Loading trip...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <ERideLogo size="md" />
        <p className="text-muted-foreground text-sm">This trip link is invalid or has expired.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-center px-5 pt-6 pb-4">
        <ERideLogo size="sm" />
      </header>

      <div className="flex-1 relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Car className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
            <p className="text-xs text-muted-foreground">Live tracking view</p>
          </div>
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="px-5 py-6 safe-bottom space-y-4">
        <div className="flex items-center gap-2 text-xs text-primary font-semibold">
          <Shield className="w-4 h-4" />
          <span>{trip.is_active ? 'Trip in progress' : 'Trip completed'}</span>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-0.5 h-6 bg-border" />
              <Navigation className="w-3.5 h-3.5 text-destructive" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-foreground">{trip.pickup}</p>
              <p className="text-sm font-medium text-foreground">{trip.destination}</p>
            </div>
          </div>
        </div>

        {trip.driver_name && (
          <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{trip.driver_name}</p>
              <p className="text-xs text-muted-foreground">{trip.vehicle} · {trip.plate}</p>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          Powered by eRide · Shared trip view
        </p>
      </div>
    </div>
  );
};

export default SharedTrip;
