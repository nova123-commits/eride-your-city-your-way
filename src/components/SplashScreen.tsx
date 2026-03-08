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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[hsl(var(--splash-bg))]"
        >
          {/* Ambient glow */}
          <div
            className="absolute w-[320px] h-[320px] rounded-full opacity-15 blur-[100px]"
            style={{ background: 'hsl(var(--primary))' }}
          />

          {/* Logo group */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120, delay: 0.2 }}
            className="relative z-10 flex flex-col items-center gap-5"
          >
            {/* Icon mark */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-[0_0_60px_hsl(var(--primary)/0.4),0_20px_40px_hsl(0_0%_0%/0.4)]"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))' }}
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
              <span className="text-primary">e</span>
              <span className="text-white">Ride</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground"
            >
              Move Smarter
            </motion.p>
          </motion.div>

          {/* Shimmer loading bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-20 w-40 h-0.5 rounded-full overflow-hidden bg-border/30"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ delay: 1, duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full w-1/2 rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
