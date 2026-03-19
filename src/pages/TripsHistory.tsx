import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ERideLogo from '@/components/ERideLogo';
import EmptyState from '@/components/EmptyState';
import RoleNav from '@/components/RoleNav';

interface RideRecord {
  id: string;
  pickup_address: string;
  destination_address: string;
  category: string;
  status: string;
  estimated_fare: number;
  final_fare: number | null;
  distance_km: number | null;
  created_at: string;
  completed_at: string | null;
}

const statusColors: Record<string, string> = {
  ride_completed: 'bg-primary/15 text-primary',
  cancelled: 'bg-destructive/15 text-destructive',
  requested: 'bg-accent text-accent-foreground',
  driver_assigned: 'bg-accent text-accent-foreground',
  ride_started: 'bg-primary/15 text-primary',
};

const TripsHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRides = async () => {
      // Show rides based on role
      let query = supabase
        .from('rides')
        .select('id, pickup_address, destination_address, category, status, estimated_fare, final_fare, distance_km, created_at, completed_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (role === 'driver') {
        query = query.eq('driver_id', user.id);
      } else {
        query = query.eq('rider_id', user.id);
      }

      const { data } = await query;
      setRides((data as RideRecord[]) ?? []);
      setLoading(false);
    };
    fetchRides();
  }, [user, role]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">My Trips</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rides.length === 0 ? (
          <EmptyState variant="no-history" />
        ) : (
          rides.map((ride) => (
            <div key={ride.id} className="p-4 rounded-xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase">{ride.category}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[ride.status] ?? 'bg-accent text-accent-foreground'}`}>
                  {ride.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="text-foreground font-medium">{ride.pickup_address}</p>
                  <p className="text-muted-foreground">→ {ride.destination_address}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(ride.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
                <span className="font-semibold text-foreground">
                  KES {(ride.final_fare ?? ride.estimated_fare).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <RoleNav />
    </div>
  );
};

export default TripsHistory;
