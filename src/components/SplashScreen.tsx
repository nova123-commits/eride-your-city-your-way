import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, duration = 2400 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(145deg, hsl(220 20% 8%), hsl(220 18% 14%))' }}
        >
          {/* Ambient glow */}
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[120px]"
            style={{ background: 'hsl(210 100% 55%)' }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.2 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            {/* Icon mark */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(210 100% 55%), hsl(200 100% 45%))',
                boxShadow: '0 0 60px hsl(210 100% 55% / 0.4), 0 20px 40px hsl(220 20% 4% / 0.5)',
              }}
            >
              <span className="text-4xl font-black text-white tracking-tighter">e</span>
            </motion.div>

            {/* Wordmark */}
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-5xl font-black tracking-tight"
            >
              <span style={{ color: 'hsl(210 100% 60%)' }}>e</span>
              <span className="text-white">Ride</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-sm font-medium tracking-[0.2em] uppercase"
              style={{ color: 'hsl(210 30% 60%)' }}
            >
              Move Smarter
            </motion.p>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-20 w-40 h-0.5 rounded-full overflow-hidden"
            style={{ background: 'hsl(220 16% 20%)' }}
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 1, duration: (duration - 1000) / 1000, ease: 'easeInOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(210 100% 55%), hsl(200 100% 50%))' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
