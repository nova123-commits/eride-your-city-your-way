import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Bike, MessageCircle } from 'lucide-react';
import ERideLogo from '@/components/ERideLogo';

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <ERideLogo size="lg" />
        <p className="text-muted-foreground mt-3 text-sm">Your ride, your way</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/rider')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all active:scale-[0.98] group"
        >
          <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center">
            <Car className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-foreground text-lg">I need a ride</h2>
            <p className="text-sm text-muted-foreground">Book a ride to your destination</p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/driver')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all active:scale-[0.98] group"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Bike className="w-7 h-7 text-foreground" />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-foreground text-lg">I'm a driver</h2>
            <p className="text-sm text-muted-foreground">Go online and accept rides</p>
          </div>
        </motion.button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 text-xs text-muted-foreground"
      >
        Basic · Xtra · Boda — rides for everyone
      </motion.p>
    </div>
  );
};

export default Index;
