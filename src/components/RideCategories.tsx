import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { RIDE_CATEGORIES, calculateFare, isPeakHour, type RideCategory } from '@/lib/ride';

interface RideCategoriesProps {
  selectedId: string | null;
  onSelect: (category: RideCategory) => void;
  distanceKm: number;
  onConfirm: () => void;
}

const RideCategories: React.FC<RideCategoriesProps> = ({ selectedId, onSelect, distanceKm, onConfirm }) => {
  const peak = isPeakHour();

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25 }}
      className="space-y-3"
    >
      {peak && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-medium">
          <Zap className="w-3.5 h-3.5" />
          <span>Surge pricing active — 1.5x rates</span>
        </div>
      )}

      {RIDE_CATEGORIES.map((cat, i) => {
        const fare = calculateFare(cat, distanceKm);
        const isSelected = selectedId === cat.id;
        return (
          <motion.button
            key={cat.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onSelect(cat)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] ${
              isSelected
                ? 'border-primary bg-accent'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <span className="text-3xl">{cat.icon}</span>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{cat.name}</span>
                {peak && <Zap className="w-3 h-3 text-primary" />}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{cat.eta}</span>
                <span>·</span>
                <span>{cat.capacity}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-foreground">KES {fare}</span>
              {peak && (
                <div className="text-[10px] text-muted-foreground line-through">
                  KES {Math.round(fare / 1.5)}
                </div>
              )}
            </div>
          </motion.button>
        );
      })}

      {selectedId && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onConfirm}
          className="w-full py-4 rounded-2xl brand-gradient text-primary-foreground font-bold text-sm transition-all active:scale-[0.98]"
        >
          Request Ride
        </motion.button>
      )}
    </motion.div>
  );
};

export default RideCategories;
