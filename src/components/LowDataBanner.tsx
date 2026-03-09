import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, Zap } from 'lucide-react';
import type { NetworkQuality } from '@/hooks/useNetworkQuality';

interface LowDataBannerProps {
  quality: NetworkQuality;
}

const LowDataBanner: React.FC<LowDataBannerProps> = ({ quality }) => {
  if (quality === 'good') return null;

  const isOffline = quality === 'offline';

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className={`px-4 py-2 flex items-center gap-2 text-xs font-medium ${
        isOffline
          ? 'bg-destructive/10 text-destructive'
          : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span>You're offline. Booking will retry when connected.</span>
        </>
      ) : (
        <>
          <Zap className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Low Data Mode — Maps disabled, using lightweight booking.</span>
        </>
      )}
    </motion.div>
  );
};

export default LowDataBanner;
