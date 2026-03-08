import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';

interface PulseMapMarkerProps {
  type: 'pickup' | 'destination' | 'driver';
  label?: string;
}

const markerConfig = {
  pickup: {
    icon: <div className="w-3 h-3 rounded-full bg-primary" />,
    pulseColor: 'hsl(var(--primary))',
    ringCount: 3,
  },
  destination: {
    icon: <MapPin className="w-4 h-4 text-destructive" />,
    pulseColor: 'hsl(var(--destructive))',
    ringCount: 2,
  },
  driver: {
    icon: <Navigation className="w-4 h-4 text-primary-foreground" />,
    pulseColor: 'hsl(var(--primary))',
    ringCount: 4,
  },
};

const PulseMapMarker: React.FC<PulseMapMarkerProps> = ({ type, label }) => {
  const config = markerConfig[type];

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings */}
      {Array.from({ length: config.ringCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            borderColor: config.pulseColor,
            width: `${28 + i * 16}px`,
            height: `${28 + i * 16}px`,
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Core marker */}
      <motion.div
        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
          type === 'driver' ? 'bg-primary' : 'bg-card border border-border'
        }`}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {config.icon}
      </motion.div>

      {/* Label */}
      {label && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-5 text-[9px] font-medium text-muted-foreground whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </div>
  );
};

export default PulseMapMarker;
