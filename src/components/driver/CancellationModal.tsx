import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CancellationModalProps {
  tripId?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const REASONS = [
  'Vehicle Issue',
  'Road Blocked',
  'Passenger Unreachable',
  'Emergency',
  'Wrong Pickup Location',
  'Other',
];

const CancellationModal: React.FC<CancellationModalProps> = ({ tripId, onCancel, onConfirm }) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason to cancel.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      // Log cancellation
      await supabase.from('driver_cancellations').insert({
        driver_id: user.id,
        trip_id: tripId || null,
        reason,
      });

      // Update commitment score
      const { data: existing } = await supabase
        .from('driver_commitment_scores')
        .select('*')
        .eq('driver_id', user.id)
        .maybeSingle();

      if (existing) {
        const newScore = Math.max(0, existing.score - 5);
        await supabase
          .from('driver_commitment_scores')
          .update({
            score: newScore,
            total_cancels: existing.total_cancels + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('driver_id', user.id);
      } else {
        await supabase.from('driver_commitment_scores').insert({
          driver_id: user.id,
          score: 95, // 100 - 5
          total_cancels: 1,
          total_accepts: 0,
        });
      }

      toast.warning('Ride cancelled. Your commitment score has been updated.');
      onConfirm();
    } catch {
      toast.error('Failed to cancel ride.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        className="w-full max-w-md bg-card rounded-t-3xl p-6 space-y-4 safe-bottom"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-bold text-foreground">Cancel Ride</h3>
          </div>
          <button onClick={onCancel} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Cancelling affects your Commitment Score. Drivers below 70% lose access to Executive rides.
        </p>

        <div className="space-y-2">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                reason === r
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-secondary border-border text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!reason || submitting}
          variant="destructive"
          className="w-full"
        >
          {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default CancellationModal;
