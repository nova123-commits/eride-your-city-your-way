import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mic, MapPin, Phone, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SOSButtonProps {
  floating?: boolean;
}

const SOSButton: React.FC<SOSButtonProps> = ({ floating = true }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);

  const handleSOS = async () => {
    setIsActive(true);
    toast.error('🚨 Safety Alert Triggered', {
      description: 'Live location shared with eRide Safety Team',
      duration: 5000,
    });

    // Persist SOS alert to DB so admin/manager dashboards can see it
    if (user) {
      await (supabase as any).from('sos_alerts').insert({
        user_id: user.id,
        location_text: 'Current GPS location',
        status: 'active',
      });
    }
  };

  const handleDismiss = () => {
    setIsActive(false);
    toast('Safety alert dismissed', { description: 'Stay safe out there!' });
  };

  if (floating && !isActive) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSOS}
        className="fixed right-4 bottom-48 z-40 w-14 h-14 rounded-full bg-destructive shadow-lg shadow-destructive/30 flex items-center justify-center btn-press"
      >
        <ShieldCheck className="w-6 h-6 text-destructive-foreground" />
      </motion.button>
    );
  }

  if (!floating && !isActive) {
    return (
      <button
        onClick={handleSOS}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-medium text-sm btn-press"
      >
        <ShieldCheck className="w-4 h-4" />
        SOS
      </button>
    );
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-background/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-md rounded-3xl border border-destructive/30 bg-card p-5 space-y-4 safe-bottom"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center animate-pulse">
                  <ShieldCheck className="w-5 h-5 text-destructive-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-destructive text-sm">Safety Alert Active</h3>
                  <p className="text-xs text-muted-foreground">Help is on the way</p>
                </div>
              </div>
              <button onClick={handleDismiss} className="p-2 rounded-full bg-secondary btn-press">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5">
                <Mic className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Recording Audio</p>
                  <p className="text-xs text-muted-foreground">Audio shared with eRide Safety Team</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-destructive animate-pulse" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5">
                <MapPin className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Sharing Live Location</p>
                  <p className="text-xs text-muted-foreground">Real-time GPS tracking enabled</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(210,60%,97%)] dark:bg-[hsl(210,40%,12%)]">
                <Phone className="w-4 h-4 text-[hsl(210,80%,50%)]" />
                <div>
                  <p className="text-sm font-medium text-foreground">Emergency Contact Notified</p>
                  <p className="text-xs text-muted-foreground">SMS with live tracking link sent</p>
                </div>
                <CheckIcon />
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium text-sm btn-press"
            >
              I'm Safe — Dismiss Alert
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CheckIcon = () => (
  <div className="ml-auto w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
    <ShieldCheck className="w-3 h-3 text-primary" />
  </div>
);

export default SOSButton;
