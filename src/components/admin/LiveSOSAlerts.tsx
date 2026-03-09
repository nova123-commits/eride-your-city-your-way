import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SOSAlert {
  id: string;
  user_id: string;
  location_text: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

const LiveSOSAlerts: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('sos_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setAlerts((data as SOSAlert[]) ?? []);
      setLoading(false);
    };
    fetchAlerts();

    // Realtime subscription
    const channel = supabase
      .channel('sos-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_alerts' },
        (payload) => {
          const newAlert = payload.new as SOSAlert;
          setAlerts(prev => [newAlert, ...prev]);
          // Play alert sound
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'square';
            gain.gain.value = 0.3;
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 500);
          } catch {}
          toast.error('🚨 NEW SOS ALERT', { description: 'A rider needs immediate help!', duration: 10000 });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sos_alerts' },
        (payload) => {
          const updated = payload.new as SOSAlert;
          setAlerts(prev =>
            updated.status === 'resolved'
              ? prev.filter(a => a.id !== updated.id)
              : prev.map(a => a.id === updated.id ? updated : a)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const resolveAlert = async (alertId: string) => {
    if (!user) return;
    await supabase.from('sos_alerts').update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    }).eq('id', alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast.success('SOS alert resolved');
  };

  if (loading) return null;

  return (
    <div className="space-y-3">
      {/* Persistent banner when there are active alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border-2 border-destructive bg-destructive/10 p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-4 h-4 text-destructive-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-destructive text-sm">
                  {alerts.length} Active SOS Alert{alerts.length > 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-muted-foreground">Immediate attention required</p>
              </div>
            </div>

            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-destructive/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.created_at).toLocaleTimeString('en-KE')}
                  </div>
                  {alert.location_text && (
                    <div className="flex items-center gap-2 text-xs text-foreground">
                      <MapPin className="w-3 h-3 text-destructive" />
                      {alert.location_text}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">User: {alert.user_id.slice(0, 8)}...</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)} className="text-xs border-primary text-primary">
                  <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {alerts.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/30 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          No active SOS alerts — all clear
        </div>
      )}
    </div>
  );
};

export default LiveSOSAlerts;
