import React from 'react';
import { motion } from 'framer-motion';
import { Star, Phone, MessageCircle, Shield } from 'lucide-react';
import { MOCK_DRIVER } from '@/lib/ride';

interface DriverMatchedProps {
  otp: string;
  onCancel: () => void;
  category: string;
  fare: number;
}

const DriverMatched: React.FC<DriverMatchedProps> = ({ otp, onCancel, category, fare }) => {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl p-5 safe-bottom"
    >
      {/* Handle */}
      <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />

      {/* OTP */}
      <div className="text-center mb-4">
        <p className="text-xs text-muted-foreground mb-1">Share this PIN with your driver</p>
        <div className="flex justify-center gap-2">
          {otp.split('').map((digit, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="w-12 h-14 rounded-xl bg-accent flex items-center justify-center text-2xl font-bold text-accent-foreground"
            >
              {digit}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Driver info */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full brand-gradient flex items-center justify-center text-2xl font-bold text-primary-foreground">
          {MOCK_DRIVER.name[0]}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{MOCK_DRIVER.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span>{MOCK_DRIVER.rating}</span>
            <span>·</span>
            <span>{MOCK_DRIVER.trips} trips</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-foreground">KES {fare}</p>
          <p className="text-xs text-muted-foreground">{category}</p>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="bg-secondary rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{MOCK_DRIVER.vehicle}</p>
            <p className="text-xs text-muted-foreground">White · Sedan</p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-card border border-border">
            <p className="font-bold text-sm text-foreground tracking-wider">{MOCK_DRIVER.plate}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-3">
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm">
          <Phone className="w-4 h-4" />
          Call
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm">
          <MessageCircle className="w-4 h-4" />
          Message
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-medium text-sm">
          <Shield className="w-4 h-4" />
          SOS
        </button>
      </div>

      <button
        onClick={onCancel}
        className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium text-sm"
      >
        Cancel ride
      </button>
    </motion.div>
  );
};

export default DriverMatched;
