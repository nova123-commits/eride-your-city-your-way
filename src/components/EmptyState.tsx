import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Search, Car } from 'lucide-react';

type EmptyVariant = 'no-rides' | 'no-history' | 'no-results' | 'no-drivers';

const CONFIG: Record<EmptyVariant, { icon: React.ElementType; title: string; subtitle: string }> = {
  'no-rides': {
    icon: Car,
    title: 'No Rides Available',
    subtitle: 'All drivers are busy right now. Try again in a moment.',
  },
  'no-history': {
    icon: Clock,
    title: 'No Trip History Yet',
    subtitle: 'Your completed rides will appear here. Book your first trip!',
  },
  'no-results': {
    icon: Search,
    title: 'No Results Found',
    subtitle: 'Try adjusting your search or check back later.',
  },
  'no-drivers': {
    icon: MapPin,
    title: 'No Drivers Nearby',
    subtitle: 'We\'re expanding to your area soon. Join the waitlist!',
  },
};

interface EmptyStateProps {
  variant: EmptyVariant;
  className?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ variant, className = '', action }) => {
  const { icon: Icon, title, subtitle } = CONFIG[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      {/* Illustration circle */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-accent flex items-center justify-center">
          <Icon className="w-12 h-12 text-primary" />
        </div>
        {/* Decorative rings */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/15 animate-[spin_20s_linear_infinite] scale-[1.35]" />
        <div className="absolute inset-0 rounded-full border border-primary/10 scale-[1.65]" />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">{subtitle}</p>

      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
