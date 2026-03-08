import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const DriverMetrics: React.FC = () => {
  const acceptanceRate = 92;
  const cancellationRate = 3;
  const hoursOnline = 38.5;
  const distanceCovered = 412;

  return (
    <div className="space-y-3">
      {/* Rates */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-xl p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Acceptance Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{acceptanceRate}%</p>
          <Progress value={acceptanceRate} className="h-1.5 mt-2" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-xl p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Cancellation Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{cancellationRate}%</p>
          <Progress value={cancellationRate} className="h-1.5 mt-2 [&>div]:bg-destructive" />
        </motion.div>
      </div>

      {/* Ride statistics */}
      <div className="bg-card border border-border rounded-xl p-3">
        <h4 className="text-xs font-semibold text-foreground mb-2">Ride Statistics (This Week)</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Clock className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{hoursOnline}h</p>
              <p className="text-[10px] text-muted-foreground">Hours Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <MapPin className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{distanceCovered} km</p>
              <p className="text-[10px] text-muted-foreground">Distance Covered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverMetrics;
