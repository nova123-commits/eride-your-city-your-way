import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Leaf, Route, Zap, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TripSummaryOverlayProps {
  pickup: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  categoryId: string;
  fare: number;
  currency?: string;
  onContinue: () => void;
  onDownloadReceipt: () => void;
}

const EMISSIONS_PER_KM: Record<string, number> = {
  basic: 120,
  xtra: 140,
  boda: 60,
  electric: 0,
};
const BASELINE = 150;

const TripSummaryOverlay: React.FC<TripSummaryOverlayProps> = ({
  pickup,
  destination,
  distanceKm,
  durationMinutes,
  categoryId,
  fare,
  currency = 'KES',
  onContinue,
  onDownloadReceipt,
}) => {
  const vehicleEmissions = EMISSIONS_PER_KM[categoryId] ?? 120;
  const co2SavedGrams = Math.round((BASELINE - vehicleEmissions) * distanceKm);
  const co2SavedKg = (co2SavedGrams / 1000).toFixed(2);
  const isElectric = categoryId === 'electric';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'hsl(var(--background) / 0.7)', backdropFilter: 'blur(16px)' }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="w-full max-w-md px-4 pb-6 safe-bottom"
      >
        <Card className="border-primary/20 overflow-hidden shadow-2xl">
          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
              >
                <Zap className="w-7 h-7 text-primary" />
              </motion.div>
              <h2 className="text-lg font-bold text-foreground">Trip Complete! 🎉</h2>
              <p className="text-xs text-muted-foreground">Here's your trip summary</p>
            </div>

            {/* Route */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground truncate">{pickup}</span>
              </div>
              <div className="ml-[5px] border-l-2 border-dashed border-border h-3" />
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-2.5 h-2.5 text-destructive" />
                <span className="text-foreground font-medium truncate">{destination}</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-3 rounded-xl bg-secondary"
              >
                <Route className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{distanceKm} km</p>
                <p className="text-[9px] text-muted-foreground">Total Distance</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center p-3 rounded-xl bg-secondary"
              >
                <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{durationMinutes} min</p>
                <p className="text-[9px] text-muted-foreground">Time Taken</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center p-3 rounded-xl bg-primary/10"
              >
                <Leaf className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-primary">{co2SavedKg} kg</p>
                <p className="text-[9px] text-muted-foreground">CO₂ Saved</p>
              </motion.div>
            </div>

            {isElectric && (
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-primary font-medium">
                <Leaf className="w-3 h-3" />
                Zero-emission ride — maximum green impact!
              </div>
            )}

            {/* Fare */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-accent/50 border border-border">
              <span className="text-sm text-muted-foreground">Total Fare</span>
              <span className="text-lg font-bold text-foreground">{currency} {fare.toLocaleString()}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={onDownloadReceipt}
              >
                <Download className="w-4 h-4" />
                Receipt
              </Button>
              <Button
                className="flex-1 brand-gradient text-primary-foreground"
                onClick={onContinue}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TripSummaryOverlay;
