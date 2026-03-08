import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, MapPin } from 'lucide-react';

const ZONES = [
  { area: 'Westlands', searches: 142, x: 28, y: 18, demand: 'high' as const },
  { area: 'Kilimani', searches: 78, x: 48, y: 42, demand: 'medium' as const },
  { area: 'Eastleigh', searches: 215, x: 68, y: 28, demand: 'critical' as const },
  { area: 'Karen', searches: 25, x: 22, y: 68, demand: 'low' as const },
  { area: 'CBD', searches: 110, x: 42, y: 48, demand: 'high' as const },
  { area: 'Langata', searches: 45, x: 52, y: 62, demand: 'medium' as const },
  { area: 'Kasarani', searches: 180, x: 55, y: 15, demand: 'critical' as const },
  { area: 'South B', searches: 33, x: 60, y: 72, demand: 'low' as const },
];

const DEMAND_STYLE = {
  critical: { color: 'hsl(var(--destructive))', radius: 48, opacity: 0.55 },
  high: { color: 'hsl(var(--destructive))', radius: 40, opacity: 0.4 },
  medium: { color: 'hsl(45 90% 55%)', radius: 32, opacity: 0.35 },
  low: { color: 'hsl(var(--primary))', radius: 24, opacity: 0.25 },
};

interface DriverDemandHeatmapProps {
  className?: string;
}

const DriverDemandHeatmap: React.FC<DriverDemandHeatmapProps> = ({ className = '' }) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Heatmap blobs */}
      {ZONES.map((zone, i) => {
        const style = DEMAND_STYLE[zone.demand];
        const isSelected = selected === zone.area;
        return (
          <motion.div
            key={zone.area}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 150 }}
            className="absolute pointer-events-auto cursor-pointer flex flex-col items-center"
            style={{ left: `${zone.x}%`, top: `${zone.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => setSelected(isSelected ? null : zone.area)}
          >
            {/* Glow blob */}
            <div
              className="rounded-full blur-xl absolute"
              style={{
                width: style.radius * 2,
                height: style.radius * 2,
                background: style.color,
                opacity: style.opacity,
              }}
            />
            {/* Core dot */}
            <div
              className="relative rounded-full flex items-center justify-center border"
              style={{
                width: style.radius,
                height: style.radius,
                background: `${style.color}`,
                opacity: 0.85,
                borderColor: `${style.color}`,
              }}
            >
              <span className="text-[9px] font-bold text-primary-foreground">{zone.searches}</span>
            </div>
            <span className="relative text-[9px] font-medium text-foreground/70 mt-1">{zone.area}</span>
          </motion.div>
        );
      })}

      {/* Selected tooltip */}
      {selected && (() => {
        const zone = ZONES.find(z => z.area === selected)!;
        return (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-3 right-3 pointer-events-auto"
          >
            <div className="glass-panel rounded-xl px-3 py-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{zone.area}</p>
                <p className="text-[10px] text-muted-foreground">{zone.searches} rider searches · {zone.demand}</p>
              </div>
              <Flame className="w-4 h-4 text-destructive shrink-0" />
            </div>
          </motion.div>
        );
      })()}

      {/* Legend */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-none">
        {(['critical', 'high', 'medium', 'low'] as const).map(level => (
          <div key={level} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: DEMAND_STYLE[level].color, opacity: DEMAND_STYLE[level].opacity + 0.3 }} />
            <span className="text-[9px] text-foreground/60 capitalize">{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriverDemandHeatmap;
