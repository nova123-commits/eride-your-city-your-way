import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SearchingDriverProps {
  onFound: () => void;
}

const MESSAGES = [
  'Prioritizing your favorite drivers nearby...',
  'Checking trusted network first...',
  'Scanning drivers within 3km...',
  'Almost there...',
];

const SearchingDriver: React.FC<SearchingDriverProps> = ({ onFound }) => {
  const [dots, setDots] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);

    const msgInterval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES.length);
    }, 2500);

    const foundTimeout = setTimeout(() => {
      onFound();
    }, 4000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(msgInterval);
      clearTimeout(foundTimeout);
    };
  }, [onFound]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'hsl(var(--background) / 0.88)', backdropFilter: 'blur(32px)' }}
    >
      <div className="relative flex items-center justify-center mb-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-primary/25 animate-pulse-ring"
            style={{
              width: `${60 + i * 28}px`,
              height: `${60 + i * 28}px`,
              animationDelay: `${i * 0.35}s`,
            }}
          />
        ))}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center z-10 animate-glow-pulse"
        >
          <span className="text-2xl">🚗</span>
        </motion.div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Finding your <span className="text-brand-gradient">eRide</span>{dots}
      </h2>
      <p className="text-sm text-muted-foreground">
        Connecting you with nearby drivers
      </p>

      <motion.div className="mt-8 w-48 h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full brand-gradient rounded-full"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          style={{ width: '50%' }}
        />
      </motion.div>

      <motion.p
        key={msgIdx}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="mt-4 text-xs text-muted-foreground"
      >
        {MESSAGES[msgIdx]}
      </motion.p>
    </motion.div>
  );
};

export default SearchingDriver;
