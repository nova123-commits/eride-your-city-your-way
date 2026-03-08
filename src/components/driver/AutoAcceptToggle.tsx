import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface AutoAcceptToggleProps {
  onToggle?: (enabled: boolean) => void;
}

const AutoAcceptToggle: React.FC<AutoAcceptToggleProps> = ({ onToggle }) => {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    onToggle?.(checked);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <p className="text-sm font-semibold text-foreground">Auto-Accept</p>
            <p className="text-[10px] text-muted-foreground">Rides within 2km radius</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>
      <AnimatePresence>
        {enabled && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-[10px] text-primary mt-2 overflow-hidden"
          >
            ⚡ Auto-accepting nearby ride requests automatically
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutoAcceptToggle;
