import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Search, Car, Heart, Navigation } from 'lucide-react';

type EmptyVariant = 'no-rides' | 'no-history' | 'no-results' | 'no-drivers' | 'no-favorites';

const CONFIG: Record<EmptyVariant, { icon: React.ElementType; accent: React.ElementType | null; title: string; subtitle: string }> = {
  'no-rides': {
    icon: Car,
    accent: Navigation,
    title: 'No Drivers Nearby',
    subtitle: 'No drivers nearby right now. Try again in a moment.',
  },
  'no-history': {
    icon: Clock,
    accent: MapPin,
    title: 'No Trip History Yet',
    subtitle: 'Your journey starts here. Book your first eRide today!',
  },
  'no-results': {
    icon: Search,
    accent: null,
    title: 'No Results Found',
    subtitle: 'Try adjusting your search or check back later.',
  },
  'no-drivers': {
    icon: MapPin,
    accent: Car,
    title: 'Expanding Soon',
    subtitle: "We're expanding to your area soon. Join the waitlist!",
  },
  'no-favorites': {
    icon: Heart,
    accent: null,
    title: 'No Favorite Drivers',
    subtitle: 'Drivers you mark as favorites will appear here for quick rebooking.',
  },
};

interface EmptyStateProps {
  variant: EmptyVariant;
  className?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ variant, className = '', action }) => {
  const { icon: Icon, accent: AccentIcon, title, subtitle } = CONFIG[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      {/* Illustration */}
      <div className="relative mb-8">
        {/* Outer decorative ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-dashed border-primary/20 scale-[1.8]"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 rounded-full border border-primary/10 scale-[2.1]" />

        {/* Main circle */}
        <div className="w-28 h-28 rounded-full bg-accent flex items-center justify-center relative">
          <div
            className="absolute inset-0 rounded-full opacity-30 blur-xl"
            style={{ background: 'hsl(var(--primary) / 0.3)' }}
          />
          <Icon className="w-12 h-12 text-primary relative z-10" strokeWidth={1.5} />
        </div>

        {/* Floating accent icon */}
        {AccentIcon && (
          <motion.div
            className="absolute -top-2 -right-2 w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-md"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <AccentIcon className="w-4 h-4 text-primary" />
          </motion.div>
        )}
      </div>

      <h3 className="text-lg font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">{subtitle}</p>

      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
