import React from 'react';

interface EridLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
};

const ERideLogo: React.FC<EridLogoProps> = ({ size = 'md', className = '' }) => {
  return (
    <span className={`font-black tracking-tight ${sizes[size]} ${className}`}>
      <span className="text-primary">e</span>
      <span className="text-foreground">Ride</span>
    </span>
  );
};

export default ERideLogo;
