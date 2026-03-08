import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Shield, Headphones, Star, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ERideLogo from '@/components/ERideLogo';
import PrivacySettings from '@/components/PrivacySettings';

const BENEFITS = [
  { icon: Zap, title: '0% Surge Pricing', desc: 'Never pay extra during peak hours' },
  { icon: Shield, title: 'Priority Support', desc: '24/7 dedicated support line' },
  { icon: Star, title: 'Priority Matching', desc: 'Get matched with drivers first' },
  { icon: Headphones, title: 'Concierge Service', desc: 'Personal ride assistant on demand' },
];

const GoldMember: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-transparent" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        <div className="relative px-5 pt-4 pb-8 safe-top">
          <button
            onClick={() => navigate('/rider')}
            className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center mb-6"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20"
            >
              <Crown className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-black text-foreground mb-1">
              <span className="text-brand-gradient">eRide</span> Gold
            </h1>
            <p className="text-sm text-muted-foreground">The ultimate ride experience</p>
          </motion.div>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-5 -mt-2 space-y-3">
        {BENEFITS.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center gap-4 p-4 rounded-2xl glass-panel"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 flex items-center justify-center shrink-0">
              <b.icon className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pricing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-5 mt-6 pb-8 safe-bottom"
      >
        <div className="p-5 rounded-3xl border-2 border-yellow-500/30 glass-panel text-center space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Monthly subscription</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-black text-foreground">1,000</span>
            <span className="text-sm font-semibold text-muted-foreground">KES/mo</span>
          </div>
          <p className="text-xs text-muted-foreground">Cancel anytime · Billed monthly</p>
          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-yellow-500/20">
            Become a Gold Member
          </button>
          <p className="text-[10px] text-muted-foreground">Powered by Stripe · Secure payment</p>
        </div>
      </motion.div>
    </div>
  );
};

export default GoldMember;
