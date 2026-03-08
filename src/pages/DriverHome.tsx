import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, MapPin, Navigation, Clock, User, Star, Shield } from 'lucide-react';
import ERideLogo from '@/components/ERideLogo';
import RatingModal from '@/components/RatingModal';
import DriverCredentials from '@/components/safety/DriverCredentials';
import SelfieVerification from '@/components/safety/SelfieVerification';
import SOSButton from '@/components/safety/SOSButton';
import VerifiedBadge from '@/components/safety/VerifiedBadge';
import { RIDE_CATEGORIES, calculateFare, generateOTP } from '@/lib/ride';

type DriverStep = 'offline' | 'selfie' | 'online' | 'request' | 'navigating' | 'otp' | 'trip' | 'rating';

const DriverHome: React.FC = () => {
  const [step, setStep] = useState<DriverStep>('offline');
  const [countdown, setCountdown] = useState(15);
  const [otpInput, setOtpInput] = useState('');
  const [correctOtp] = useState(generateOTP());
  const [otpError, setOtpError] = useState(false);
  const [earnings] = useState(4250);
  const [showCredentials, setShowCredentials] = useState(false);

  // Simulate incoming request after going online
  useEffect(() => {
    if (step === 'online') {
      const t = setTimeout(() => setStep('request'), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Request countdown
  useEffect(() => {
    if (step === 'request' && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (step === 'request' && countdown === 0) {
      setStep('online');
      setCountdown(15);
    }
  }, [step, countdown]);

  const handleGoOnline = () => {
    // Trigger selfie verification before going online
    setStep('selfie');
  };

  const handleSelfieVerified = () => {
    setStep('online');
  };

  const handleSelfieCancelled = () => {
    setStep('offline');
  };

  const handleAccept = () => setStep('navigating');
  const handleDecline = () => { setStep('online'); setCountdown(15); };
  const handleArrived = () => setStep('otp');

  const handleOtpSubmit = () => {
    if (otpInput === correctOtp) {
      setStep('trip');
      setOtpError(false);
    } else {
      setOtpError(true);
    }
  };

  const handleFinishTrip = () => setStep('rating');

  const handleRatingSubmit = () => {
    setStep('online');
    setOtpInput('');
    setCountdown(15);
  };

  const mockCategory = RIDE_CATEGORIES[0];
  const fare = calculateFare(mockCategory, 7.2);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 safe-top">
        <div className="flex items-center gap-2">
          <ERideLogo size="sm" />
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">Driver</span>
          <VerifiedBadge isVerified={true} size="md" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="text-xs font-medium px-2 py-1 rounded-lg border border-[hsl(210,60%,85%)] text-[hsl(210,80%,50%)] bg-[hsl(210,60%,97%)] dark:border-[hsl(210,40%,25%)] dark:bg-[hsl(210,40%,12%)] btn-press"
          >
            Credentials
          </button>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Today's earnings</p>
            <p className="font-bold text-foreground">KES {earnings.toLocaleString()}</p>
          </div>
        </div>
      </header>

      {/* Credentials panel */}
      <AnimatePresence>
        {showCredentials && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            <DriverCredentials
              driverName="James Mwangi"
              psvLicense="PSV-NRB-2024-4821"
              expiryDate="Dec 15, 2026"
              isVerified={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map area */}
      <div className="flex-1 relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Navigation className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {step === 'offline' ? 'Go online to start' : 'Navigating...'}
            </p>
          </div>
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Selfie Verification overlay */}
      <AnimatePresence>
        {step === 'selfie' && (
          <SelfieVerification
            onVerified={handleSelfieVerified}
            onCancel={handleSelfieCancelled}
          />
        )}
      </AnimatePresence>

      {/* Bottom panel */}
      <div className="px-4 pb-4 pt-3 safe-bottom bg-background">
        <AnimatePresence mode="wait">
          {/* Offline / Online toggle */}
          {(step === 'offline' || step === 'online') && (
            <motion.div key="toggle" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                onClick={() => step === 'offline' ? handleGoOnline() : setStep('offline')}
                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                  step === 'online'
                    ? 'brand-gradient text-primary-foreground'
                    : 'bg-secondary text-foreground'
                }`}
              >
                <Power className="w-5 h-5" />
                {step === 'online' ? 'You\'re Online — Waiting for rides...' : 'Go Online'}
              </button>
              {step === 'online' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 flex justify-center"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Looking for ride requests nearby...
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Incoming request */}
          {step === 'request' && (
            <motion.div
              key="request"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">New Ride Request</h3>
                <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
                  <span className="font-bold text-primary text-sm">{countdown}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-foreground">Westlands Mall, Nairobi</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-2.5 h-2.5 text-destructive" />
                  <span className="text-foreground">JKIA Airport, Terminal 1</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-secondary rounded-xl p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Estimated fare</p>
                  <p className="font-bold text-foreground">KES {fare}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-bold text-foreground">7.2 km</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-bold text-foreground">Basic</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDecline}
                  className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-semibold text-sm"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 py-3 rounded-xl brand-gradient text-primary-foreground font-semibold text-sm active:scale-[0.98]"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          )}

          {/* Navigating to rider */}
          {step === 'navigating' && (
            <motion.div
              key="nav"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full brand-gradient flex items-center justify-center text-lg font-bold text-primary-foreground">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Alice Wanjiku</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>4.9</span>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>3 min away</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Westlands Mall, Nairobi</span>
                </div>
              </div>
              <button
                onClick={handleArrived}
                className="w-full py-4 rounded-2xl brand-gradient text-primary-foreground font-bold text-sm active:scale-[0.98]"
              >
                I've Arrived
              </button>
            </motion.div>
          )}

          {/* OTP verification */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-5 text-center space-y-4"
            >
              <h3 className="font-bold text-foreground">Enter Rider's PIN</h3>
              <p className="text-xs text-muted-foreground">Ask the rider for their 4-digit trip PIN</p>
              <p className="text-[10px] text-muted-foreground">(Demo PIN: {correctOtp})</p>

              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={otpInput[i] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/, '');
                      const newOtp = otpInput.split('');
                      newOtp[i] = val;
                      setOtpInput(newOtp.join(''));
                      if (val && e.target.nextElementSibling) {
                        (e.target.nextElementSibling as HTMLInputElement).focus();
                      }
                    }}
                    className={`w-14 h-16 text-center text-2xl font-bold rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary/30 ${
                      otpError ? 'ring-2 ring-destructive' : ''
                    }`}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-xs text-destructive">Incorrect PIN. Try again.</p>
              )}

              <button
                onClick={handleOtpSubmit}
                disabled={otpInput.length < 4}
                className="w-full py-3.5 rounded-xl brand-gradient text-primary-foreground font-semibold text-sm disabled:opacity-40"
              >
                Start Trip
              </button>
            </motion.div>
          )}

          {/* Active trip */}
          {step === 'trip' && (
            <motion.div
              key="trip"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">Trip in Progress</h3>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Live
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Westlands Mall</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-2.5 h-2.5 text-destructive" />
                    <span className="text-foreground font-medium">JKIA Airport, Terminal 1</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between bg-secondary rounded-xl p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Fare</p>
                    <p className="font-bold text-foreground">KES {fare}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-bold text-foreground">7.2 km</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Commission (15%)</p>
                    <p className="font-bold text-muted-foreground">KES {Math.round(fare * 0.15)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <SOSButton floating={false} />
                <button
                  onClick={handleFinishTrip}
                  className="flex-1 py-4 rounded-2xl brand-gradient text-primary-foreground font-bold text-sm active:scale-[0.98]"
                >
                  Finish Trip
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating modal */}
      {step === 'rating' && (
        <RatingModal
          role="driver"
          name="Alice Wanjiku"
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};

export default DriverHome;
