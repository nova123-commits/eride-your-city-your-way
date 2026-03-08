import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SearchingDriverProps {
  onFound: () => void;
}

const SearchingDriver: React.FC<SearchingDriverProps> = ({ onFound }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);

    const foundTimeout = setTimeout(() => {
      onFound();
    }, 4000);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(foundTimeout);
    };
  }, [onFound]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <div className="relative flex items-center justify-center mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute w-24 h-24 rounded-full border-2 border-primary/30 animate-pulse-ring"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
        <div className="w-16 h-16 rounded-full brand-gradient flex items-center justify-center z-10">
          <span className="text-2xl">🚗</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Finding your driver{dots}
      </h2>
      <p className="text-sm text-muted-foreground">
        Connecting you with nearby drivers
      </p>

      <motion.div
        className="mt-8 w-48 h-1 rounded-full bg-secondary overflow-hidden"
      >
        <motion.div
          className="h-full brand-gradient rounded-full"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          style={{ width: '50%' }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SearchingDriver;
