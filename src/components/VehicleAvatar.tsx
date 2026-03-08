import React from 'react';
import { motion } from 'framer-motion';
import bodaImg from '@/assets/vehicle-boda.png';
import basicImg from '@/assets/vehicle-basic.png';
import executiveImg from '@/assets/vehicle-executive.png';
import electricImg from '@/assets/vehicle-electric.png';

const VEHICLE_MAP: Record<string, string> = {
  boda: bodaImg,
  basic: basicImg,
  xtra: executiveImg,
  electric: electricImg,
};

interface VehicleAvatarProps {
  categoryId: string;
  size?: number;
  className?: string;
  /** Driver bearing in degrees (0 = north, 90 = east). Rotates the icon. */
  bearing?: number;
  /** Show a live pulse ring around the icon */
  isActive?: boolean;
}

const VehicleAvatar: React.FC<VehicleAvatarProps> = ({
  categoryId,
  size = 48,
  className = '',
  bearing,
  isActive = false,
}) => {
  const src = VEHICLE_MAP[categoryId];

  if (!src) {
    return <span className="text-3xl">🚗</span>;
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Active pulse rings */}
      {isActive && (
        <>
          <span
            className="absolute inset-0 rounded-full animate-pulse-ring"
            style={{ background: 'hsl(var(--primary) / 0.25)' }}
          />
          <span
            className="absolute inset-0 rounded-full animate-pulse-ring"
            style={{ background: 'hsl(var(--primary) / 0.15)', animationDelay: '0.6s' }}
          />
        </>
      )}

      {/* Vehicle icon with optional bearing rotation */}
      <motion.img
        src={src}
        alt={`${categoryId} vehicle`}
        width={size}
        height={size}
        className={`relative z-10 object-contain drop-shadow-md ${className}`}
        loading="lazy"
        style={{ rotate: bearing !== undefined ? `${bearing}deg` : undefined }}
        animate={isActive ? { scale: [1, 1.06, 1] } : {}}
        transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      />
    </div>
  );
};

export default VehicleAvatar;
