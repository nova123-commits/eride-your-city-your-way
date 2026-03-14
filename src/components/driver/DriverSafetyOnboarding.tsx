import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, Bike, Car, Users, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const SAFETY_SLIDES = [
  {
    icon: Shield,
    title: 'Welcome to eRide Safety',
    points: [
      'Safety is our #1 priority — for you and every rider.',
      'This manual covers your responsibilities as an eRide partner.',
      'Completing this means you agree to uphold these standards on every trip.',
    ],
  },
  {
    icon: Car,
    title: 'Vehicle & Personal Readiness',
    points: [
      'Keep your vehicle clean, fueled, and roadworthy at all times.',
      'Carry a valid PSV license, NTSA badge, and first-aid kit.',
      'Boda riders: always have a spare helmet and wear your eRide reflector.',
    ],
  },
  {
    icon: Users,
    title: 'Rider Interaction',
    points: [
      'Always verify the rider using the 4-digit OTP before starting.',
      'Respect "Silent Trip" preferences — greet briefly, then minimize chat.',
      'Never refuse a trip based on the rider\'s destination or appearance.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Emergency Protocols',
    points: [
      'If a rider triggers SOS, remain calm — admin is alerted instantly.',
      'In case of an accident, ensure passenger safety first, then report.',
      'Never disable location sharing during an active trip.',
    ],
  },
  {
    icon: Phone,
    title: 'Platform Rules',
    points: [
      'Do not contact riders on personal numbers after a trip ends.',
      'Maintain a rating above 4.5 to stay active on the platform.',
      'Repeated cancellations will lower your commitment score and visibility.',
    ],
  },
];

interface DriverSafetyOnboardingProps {
  onComplete: () => void;
}

const DriverSafetyOnboarding: React.FC<DriverSafetyOnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const isLastSlide = currentSlide === SAFETY_SLIDES.length - 1;
  const slide = SAFETY_SLIDES[currentSlide];
  const Icon = slide.icon;

  const handleAccept = async () => {
    if (!user || !agreed) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      // Update profile with acceptance timestamp
      await supabase.from('profiles').update({ safety_terms_accepted_at: now } as any).eq('id', user.id);
      // Log to audit trail
      await supabase.from('audit_trail').insert({
        actor_id: user.id,
        actor_role: 'driver',
        action: 'safety_terms_accepted',
        details: { accepted_at: now },
      });
      toast({ title: 'Safety Terms Accepted', description: 'You can now start accepting trips.' });
      onComplete();
    } catch {
      toast({ title: 'Error', description: 'Could not save. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    >
      {/* Progress bar */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Step {currentSlide + 1} of {SAFETY_SLIDES.length}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round(((currentSlide + 1) / SAFETY_SLIDES.length) * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {SAFETY_SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'flex-[2] bg-primary'
                  : i < currentSlide
                  ? 'flex-1 bg-primary/50'
                  : 'flex-1 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide content — scrollable if needed */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6">
        <div className="flex flex-col items-center justify-center min-h-full py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{slide.title}</h2>
              <ul className="space-y-3 text-left">
                {slide.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Agreement + Navigation — always pinned to bottom */}
      <div className="shrink-0 px-6 pb-6 pt-4 border-t border-border bg-background space-y-4">
        {isLastSlide && (
          <label className="flex items-start gap-3 p-4 rounded-xl bg-accent/50 border border-border cursor-pointer">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
            <span className="text-sm font-medium text-foreground">
              I Agree to the eRide Safety Terms and commit to following these guidelines on every trip.
            </span>
          </label>
        )}

        <div className="flex gap-3">
          {currentSlide > 0 ? (
            <Button
              variant="outline"
              onClick={() => setCurrentSlide((s) => s - 1)}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={onComplete}
              className="flex-1 text-muted-foreground"
            >
              Skip for now
            </Button>
          )}

          {!isLastSlide ? (
            <Button
              onClick={() => setCurrentSlide((s) => s + 1)}
              className="flex-1"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleAccept}
              disabled={!agreed || submitting}
              className="flex-1"
            >
              {submitting ? 'Saving...' : 'Accept & Continue'}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DriverSafetyOnboarding;
