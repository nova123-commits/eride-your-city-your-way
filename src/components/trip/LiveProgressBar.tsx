import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigation, MapPin, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LiveProgressBarProps {
  pickup: string;
  destination: string;
  totalDistanceKm: number;
  /** Simulated ETA in minutes */
  etaMinutes?: number;
}

const LiveProgressBar: React.FC<LiveProgressBarProps> = ({
  pickup,
  destination,
  totalDistanceKm,
  etaMinutes = 12,
}) => {
  const [progress, setProgress] = useState(0);
  const [remainingMin, setRemainingMin] = useState(etaMinutes);

  useEffect(() => {
    // Simulate GPS progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        const increment = Math.random() * 4 + 1;
        return Math.min(p + increment, 95);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setRemainingMin(Math.max(1, Math.round(etaMinutes * (1 - progress / 100))));
  }, [progress, etaMinutes]);

  const distanceCovered = ((progress / 100) * totalDistanceKm).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground">Trip Progress</h4>
        <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>{remainingMin} min left</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <Progress value={progress} className="h-3 bg-secondary" />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary shadow-lg flex items-center justify-center"
          style={{ left: `calc(${progress}% - 10px)` }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Navigation className="w-2.5 h-2.5 text-primary-foreground" />
        </motion.div>
      </div>

      {/* Route labels */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="truncate max-w-[100px]">{pickup}</span>
        </div>
        <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
        <div className="flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-destructive" />
          <span className="truncate max-w-[100px]">{destination}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-1.5 rounded-lg bg-secondary">
          <p className="text-xs font-bold text-foreground">{distanceCovered} km</p>
          <p className="text-[9px] text-muted-foreground">Covered</p>
        </div>
        <div className="text-center p-1.5 rounded-lg bg-secondary">
          <p className="text-xs font-bold text-foreground">{(totalDistanceKm - parseFloat(distanceCovered)).toFixed(1)} km</p>
          <p className="text-[9px] text-muted-foreground">Remaining</p>
        </div>
        <div className="text-center p-1.5 rounded-lg bg-secondary">
          <p className="text-xs font-bold text-primary">{remainingMin} min</p>
          <p className="text-[9px] text-muted-foreground">ETA</p>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveProgressBar;
