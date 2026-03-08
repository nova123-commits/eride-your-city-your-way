import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface PinkModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const PinkModeToggle: React.FC<PinkModeToggleProps> = ({ enabled, onToggle }) => {
  return (
    <motion.button
      onClick={() => onToggle(!enabled)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors btn-press ${
        enabled
          ? 'border-pink-300 bg-pink-50 dark:border-pink-800 dark:bg-pink-950/30'
          : 'border-border bg-card'
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          enabled ? 'bg-pink-500/20' : 'bg-secondary'
        }`}
      >
        <ShieldCheck className={`w-5 h-5 ${enabled ? 'text-pink-500' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-foreground">Prefer Female Driver</p>
        <p className="text-xs text-muted-foreground">
          {enabled ? 'System will prioritize female drivers' : 'Disabled — any available driver'}
        </p>
      </div>
      <div
        className={`w-11 h-6 rounded-full relative transition-colors ${
          enabled ? 'bg-pink-500' : 'bg-muted'
        }`}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ left: enabled ? '22px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.button>
  );
};

export default PinkModeToggle;
