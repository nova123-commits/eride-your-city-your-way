import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ERideLogo from '@/components/ERideLogo';
import EmptyState from '@/components/EmptyState';
import RoleNav from '@/components/RoleNav';

interface Trip {
  id: string;
  pickup: string;
  destination: string;
  scheduled_at: string;
  status: string;
  category_id: string;
}

const TripsHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTrips = async () => {
      const { data } = await supabase
        .from('scheduled_trips')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: false });
      setTrips(data ?? []);
      setLoading(false);
    };
    fetchTrips();
  }, [user]);

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
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-12 h-12 text-muted-foreground" />}
            title="No trips yet"
            description="Your trip history will appear here after your first ride."
          />
        ) : (
          trips.map((trip) => (
            <div key={trip.id} className="p-4 rounded-xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase">{trip.category_id}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  trip.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-accent text-accent-foreground'
                }`}>
                  {trip.status}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="text-foreground font-medium">{trip.pickup}</p>
                  <p className="text-muted-foreground">→ {trip.destination}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(trip.scheduled_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
              </p>
            </div>
          ))
        )}
      </div>
      <RoleNav />
    </div>
  );
};

export default TripsHistory;
