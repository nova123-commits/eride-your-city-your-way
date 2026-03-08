import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Award, TrendingDown, TreePine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CarbonFootprintTrackerProps {
  distanceKm: number;
  categoryId: string;
  totalTrips?: number;
}

// CO2 emissions per km by vehicle type (grams)
const EMISSIONS_PER_KM: Record<string, number> = {
  basic: 120,    // standard car
  xtra: 140,     // larger car
  boda: 60,      // motorbike (less emissions)
  electric: 0,   // zero emission
};

// Baseline comparison: average Nairobi taxi emits ~150g/km
const BASELINE_EMISSIONS = 150;

const CarbonFootprintTracker: React.FC<CarbonFootprintTrackerProps> = ({
  distanceKm,
  categoryId,
  totalTrips = 0,
}) => {
  const [showBadge, setShowBadge] = useState(false);

  const vehicleEmissions = EMISSIONS_PER_KM[categoryId] ?? 120;
  const co2SavedGrams = Math.round((BASELINE_EMISSIONS - vehicleEmissions) * distanceKm);
  const co2SavedKg = (co2SavedGrams / 1000).toFixed(2);

  // Cumulative savings (simulated based on trip count)
  const cumulativeSavedKg = parseFloat(co2SavedKg) + (totalTrips * 0.45);
  const hasGreenBadge = cumulativeSavedKg >= 10;
  const treesEquiv = (cumulativeSavedKg / 21).toFixed(1);
  const progressTo10 = Math.min((cumulativeSavedKg / 10) * 100, 100);

  useEffect(() => {
    if (hasGreenBadge) {
      const timer = setTimeout(() => setShowBadge(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasGreenBadge]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-primary/20 bg-accent/30 overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Carbon Impact</p>
                <p className="text-[10px] text-muted-foreground">This trip saves CO₂</p>
              </div>
            </div>
            <AnimatePresence>
              {hasGreenBadge && showBadge && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Badge className="bg-primary/15 text-primary gap-1">
                    <Award className="w-3 h-3" /> Green Badge
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* This trip stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-secondary text-center">
              <p className="text-lg font-bold text-primary">{co2SavedKg}</p>
              <p className="text-[9px] text-muted-foreground">kg CO₂ saved</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary text-center">
              <p className="text-lg font-bold text-foreground">{vehicleEmissions}</p>
              <p className="text-[9px] text-muted-foreground">g/km emission</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary text-center flex flex-col items-center justify-center">
              <TreePine className="w-4 h-4 text-primary mb-0.5" />
              <p className="text-[9px] text-muted-foreground">≈ {treesEquiv} trees</p>
            </div>
          </div>

          {/* Progress to Green Badge */}
          {!hasGreenBadge && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Progress to Green Badge</span>
                <span className="text-[10px] font-medium text-primary">{cumulativeSavedKg.toFixed(1)} / 10 kg</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressTo10}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {categoryId === 'electric' && (
            <p className="text-[10px] text-primary font-medium flex items-center gap-1">
              <Leaf className="w-3 h-3" /> Zero-emission ride — maximum CO₂ savings!
            </p>
          )}
          {categoryId === 'boda' && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Boda emits 60% less CO₂ than standard taxis
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CarbonFootprintTracker;
