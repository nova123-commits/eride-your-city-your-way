import { useState, useEffect } from 'react';

export type NetworkQuality = 'good' | 'slow' | 'offline';

export function useNetworkQuality(): { quality: NetworkQuality; isLowData: boolean } {
  const [quality, setQuality] = useState<NetworkQuality>('good');

  useEffect(() => {
    const updateQuality = () => {
      if (!navigator.onLine) {
        setQuality('offline');
        return;
      }

      const conn = (navigator as any).connection;
      if (conn) {
        const effectiveType = conn.effectiveType; // '4g', '3g', '2g', 'slow-2g'
        const downlink = conn.downlink; // Mbps

        if (effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 0.5) {
          setQuality('slow');
        } else if (effectiveType === '3g' && downlink < 1) {
          setQuality('slow');
        } else {
          setQuality('good');
        }
      }
    };

    updateQuality();

    window.addEventListener('online', updateQuality);
    window.addEventListener('offline', () => setQuality('offline'));

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', updateQuality);
    }

    return () => {
      window.removeEventListener('online', updateQuality);
      window.removeEventListener('offline', () => setQuality('offline'));
      if (conn) conn.removeEventListener('change', updateQuality);
    };
  }, []);

  return { quality, isLowData: quality === 'slow' || quality === 'offline' };
}
