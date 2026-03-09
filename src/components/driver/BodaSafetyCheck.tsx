import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Bike, HardHat, Shirt, Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BodaSafetyCheckProps {
  onComplete: () => void;
  onCancel: () => void;
}

const CHECKS = [
  { id: 'passenger_helmet', label: 'I have a spare helmet for the passenger', icon: HardHat },
  { id: 'reflector', label: 'I am wearing my eRide reflector', icon: Shirt },
  { id: 'fuel', label: 'My bike has enough fuel for a 10km trip', icon: Fuel },
];

const BodaSafetyCheck: React.FC<BodaSafetyCheckProps> = ({ onComplete, onCancel }) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allChecked = CHECKS.every(c => checked.has(c.id));

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bike className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Daily Safety Check</h3>
            <p className="text-xs text-muted-foreground">Complete all checks before going online</p>
          </div>
        </div>

        <div className="space-y-2">
          {CHECKS.map(c => {
            const isChecked = checked.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  isChecked
                    ? 'bg-primary/10 border-primary'
                    : 'bg-secondary border-border'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  isChecked ? 'bg-primary border-primary' : 'border-muted-foreground'
                }`}>
                  {isChecked && <ShieldCheck className="w-4 h-4 text-primary-foreground" />}
                </div>
                <c.icon className={`w-5 h-5 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button onClick={onComplete} disabled={!allChecked} className="flex-1">
            {allChecked ? 'Go Online' : `${checked.size}/3 Checked`}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BodaSafetyCheck;
