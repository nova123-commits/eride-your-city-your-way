import React from 'react';
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
}

const VehicleAvatar: React.FC<VehicleAvatarProps> = ({ categoryId, size = 48, className = '' }) => {
  const src = VEHICLE_MAP[categoryId];

  if (!src) {
    return <span className="text-3xl">🚗</span>;
  }

  return (
    <img
      src={src}
      alt={`${categoryId} vehicle`}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      loading="lazy"
    />
  );
};

export default VehicleAvatar;
