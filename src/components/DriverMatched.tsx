import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import SOSButton from '@/components/safety/SOSButton';
import PrivacyCall from '@/components/safety/PrivacyCall';
import VerifiedBadge from '@/components/safety/VerifiedBadge';

interface DriverMatchedProps {
  otp: string;
  onCancel: () => void;
  category: string;
  fare: number;
  driverName?: string;
  driverRating?: number;
  driverTrips?: number;
  vehicleName?: string;
  vehicleColor?: string;
  plate?: string;
}

const DriverMatched: React.FC<DriverMatchedProps> = ({
  otp, onCancel, category, fare,
  driverName = 'Your Driver',
  driverRating = 4.8,
  driverTrips = 0,
  vehicleName = 'Vehicle',
  vehicleColor = 'White',
  plate = '',
}) => {
  useEffect(() => {
    toast.success('Driver matched! 🎉', {
      description: `${driverName} is on the way`,
      icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
    });
  }, [driverName]);

  return (
    <>
      <SOSButton floating />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 glass-bottom-sheet rounded-t-3xl p-5 safe-bottom"
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-full bg-primary/10 mx-auto w-fit"
        >
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Ride Matched</span>
        </motion.div>

        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground mb-1">Share this PIN with your driver</p>
          <div className="flex justify-center gap-2">
            {otp.split('').map((digit, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotateY: 90 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                className="w-12 h-14 rounded-xl bg-accent flex items-center justify-center text-2xl font-bold text-accent-foreground"
              >
                {digit}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.15 }}
            className="w-14 h-14 rounded-full brand-gradient flex items-center justify-center text-2xl font-bold text-primary-foreground"
          >
            {driverName[0]}
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground">{driverName}</h3>
              <VerifiedBadge isVerified={true} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span>{driverRating}</span>
              {driverTrips > 0 && <><span>·</span><span>{driverTrips} trips</span></>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-foreground">KES {fare}</p>
            <p className="text-xs text-muted-foreground">{category}</p>
          </div>
        </div>

        <div className="rounded-xl glass-panel p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{vehicleName}</p>
              <p className="text-xs text-muted-foreground">{vehicleColor} · Sedan</p>
            </div>
            {plate && (
              <div className="px-3 py-1.5 rounded-lg glass-fab">
                <p className="font-bold text-sm text-foreground tracking-wider">{plate}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-accent border border-border">
          <span className="text-[10px] text-muted-foreground">🔒 Your phone number is hidden for your privacy.</span>
        </div>

        <div className="flex gap-3 mb-3">
          <PrivacyCall recipientName={driverName} />
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass-fab text-foreground font-medium text-sm btn-press">
            <MessageCircle className="w-4 h-4" />
            Message
          </button>
          <SOSButton floating={false} />
        </div>

        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl border border-border/50 text-muted-foreground font-medium text-sm btn-press"
        >
          Cancel ride
        </button>
      </motion.div>
    </>
  );
};

export default DriverMatched;
