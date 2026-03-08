import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md';
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ isVerified, size = 'sm' }) => {
  if (!isVerified) return null;

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.1 }}
      className="inline-flex items-center"
      title="NTSA Verified Driver"
    >
      <ShieldCheck className={`${iconSize} text-[hsl(210,80%,50%)]`} />
    </motion.span>
  );
};

export default VerifiedBadge;
