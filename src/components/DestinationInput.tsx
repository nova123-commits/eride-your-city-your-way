import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface DestinationInputProps {
  pickup: string;
  destination: string;
  onPickupChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onSearch: () => void;
}

const DestinationInput: React.FC<DestinationInputProps> = ({
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
  onSearch,
}) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="rounded-2xl bg-card border border-border p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div className="w-0.5 h-8 bg-border" />
          <Navigation className="w-3.5 h-3.5 text-destructive" />
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder="Pickup location"
            value={pickup}
            onChange={(e) => onPickupChange(e.target.value)}
            className="w-full rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <input
            type="text"
            placeholder="Where to?"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>
      {destination.length > 2 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onSearch}
          className="w-full py-3.5 rounded-xl brand-gradient text-primary-foreground font-semibold text-sm transition-all active:scale-[0.98]"
        >
          Find rides
        </motion.button>
      )}
    </motion.div>
  );
};

export default DestinationInput;
