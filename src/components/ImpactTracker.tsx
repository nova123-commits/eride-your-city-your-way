import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, TrendingDown } from 'lucide-react';

interface ImpactTrackerProps {
  distanceKm: number;
}

const ImpactTracker: React.FC<ImpactTrackerProps> = ({ distanceKm }) => {
  // Average car emits ~120g CO2/km; EV emits ~0g (charged renewably)
  const co2SavedGrams = Math.round(distanceKm * 120);
  const co2SavedKg = (co2SavedGrams / 1000).toFixed(1);
  const treesEquivalent = (co2SavedGrams / 21000).toFixed(2); // 1 tree absorbs ~21kg CO2/year

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-2xl border border-primary/20 bg-accent/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center">
          <Leaf className="w-4 h-4 text-primary-foreground" />
        </div>
        <p className="text-xs font-bold text-foreground">eRide Electric Impact</p>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <p className="text-lg font-bold text-primary">{co2SavedKg} kg</p>
          <p className="text-[10px] text-muted-foreground">CO₂ saved</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex items-center gap-1">
          <TrendingDown className="w-3.5 h-3.5 text-primary" />
          <div>
            <p className="text-xs font-semibold text-foreground">≈ {treesEquivalent} trees</p>
            <p className="text-[10px] text-muted-foreground">worth of carbon</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImpactTracker;
