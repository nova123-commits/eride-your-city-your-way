import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, MapPin, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ERideLogo from '@/components/ERideLogo';
import DestinationInput from '@/components/DestinationInput';
import RideCategories from '@/components/RideCategories';
import RidePreferences, { type RidePrefs } from '@/components/RidePreferences';
import ErrandStop, { type ErrandStopData } from '@/components/ErrandStop';
import SearchingDriver from '@/components/SearchingDriver';
import DriverMatched from '@/components/DriverMatched';
import RatingModal from '@/components/RatingModal';
import ImpactTracker from '@/components/ImpactTracker';
import PinkModeToggle from '@/components/safety/PinkModeToggle';
import PaymentFlow from '@/components/payments/PaymentFlow';
import DigitalReceipt from '@/components/payments/DigitalReceipt';
import CurrencyToggle from '@/components/payments/CurrencyToggle';
import { RIDE_CATEGORIES, calculateFare, generateOTP, MOCK_DRIVER, type RideCategory } from '@/lib/ride';
import { calculateFareBreakdown, isPeakHour as checkPeak, formatCurrency, convertCurrency, type CurrencyCode } from '@/lib/currency';

// Re-export isPeakHour from ride.ts
import { isPeakHour } from '@/lib/ride';

type RiderStep = 'home' | 'categories' | 'preferences' | 'searching' | 'matched' | 'payment' | 'receipt' | 'rating';

const RiderHome: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RiderStep>('home');
  const [pickup, setPickup] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RideCategory | null>(null);
  const [otp, setOtp] = useState('');
  const [errandStop, setErrandStop] = useState<ErrandStopData | null>(null);
  const [pinkMode, setPinkMode] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>('KES');
  const [ridePrefs, setRidePrefs] = useState<RidePrefs>({
    conversation: 'open',
    temperature: 'ac_low',
    musicGenre: 'None',
  });
  const distanceKm = 7.2;

  const handleSearch = () => setStep('categories');
  const handleCategoryConfirm = () => setStep('preferences');

  const handleRequestRide = () => {
    setOtp(generateOTP());
    setStep('searching');
  };

  const handleDriverFound = useCallback(() => {
    setStep('matched');
  }, []);

  const handleCancelRide = () => {
    setStep('home');
    setSelectedCategory(null);
    setDestination('');
    setErrandStop(null);
  };

  const handleTripComplete = () => setStep('payment');
  const handlePaymentComplete = () => setStep('receipt');
  const handleReceiptDone = () => setStep('rating');

  const handleRatingSubmit = (rating: number, isFavorite?: boolean) => {
    setStep('home');
    setSelectedCategory(null);
    setDestination('');
    setErrandStop(null);
  };

  const waitMinutes = errandStop?.waitMinutes ?? 0;
  const fare = selectedCategory ? calculateFare(selectedCategory, distanceKm, waitMinutes) : 0;
  const isElectric = selectedCategory?.id === 'electric';

  const fareBreakdown = selectedCategory
    ? calculateFareBreakdown(selectedCategory.baseRate, selectedCategory.perKm, distanceKm, waitMinutes, 8, isPeakHour())
    : null;

  const displayFare = currency === 'KES' ? fare : convertCurrency(fare, currency);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 safe-top">
        <button className="w-10 h-10 rounded-xl glass-fab flex items-center justify-center btn-press">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <ERideLogo size="sm" />
        <div className="flex items-center gap-2">
          <div className="w-24">
            <CurrencyToggle currency={currency} onChange={setCurrency} />
          </div>
          <button
            onClick={() => navigate('/gold')}
            className="w-10 h-10 rounded-xl glass-fab flex items-center justify-center btn-press"
          >
            <Crown className="w-5 h-5 text-yellow-500" />
          </button>
        </div>
      </header>

      {/* Map placeholder */}
      <div className="flex-1 relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
            <p className="text-xs text-muted-foreground">Map view</p>
          </div>
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {step === 'matched' && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleTripComplete}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl brand-gradient text-primary-foreground text-xs font-semibold z-10 btn-press"
          >
            Simulate: Trip Complete
          </motion.button>
        )}
      </div>

      {/* Bottom panel */}
      <div className="px-4 pb-4 pt-3 safe-bottom glass-bottom-sheet space-y-3">
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <div key="dest" className="space-y-3">
              <DestinationInput
                pickup={pickup}
                destination={destination}
                onPickupChange={setPickup}
                onDestinationChange={setDestination}
                onSearch={handleSearch}
              />
              <ErrandStop
                stop={errandStop}
                onAdd={setErrandStop}
                onRemove={() => setErrandStop(null)}
              />
              <PinkModeToggle enabled={pinkMode} onToggle={setPinkMode} />
            </div>
          )}
          {step === 'categories' && (
            <div key="cats" className="space-y-3">
              <RideCategories
                selectedId={selectedCategory?.id ?? null}
                onSelect={setSelectedCategory}
                distanceKm={distanceKm}
                onConfirm={handleCategoryConfirm}
                waitMinutes={waitMinutes}
              />
              {isElectric && <ImpactTracker distanceKm={distanceKm} />}
            </div>
          )}
          {step === 'preferences' && selectedCategory && (
            <RidePreferences
              key="prefs"
              prefs={ridePrefs}
              onChange={setRidePrefs}
              onConfirm={handleRequestRide}
              onBack={() => setStep('categories')}
            />
          )}
          {step === 'receipt' && fareBreakdown && (
            <motion.div key="receipt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <DigitalReceipt
                breakdown={fareBreakdown}
                currency={currency}
                tripId="TRP-2026-4821"
                date={new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}
                pickup={pickup}
                dropoff={destination || 'JKIA Airport'}
                distance={`${distanceKm} km`}
                driverName={MOCK_DRIVER.name}
              />
              <button
                onClick={handleReceiptDone}
                className="w-full py-3.5 rounded-xl brand-gradient text-primary-foreground font-bold text-sm btn-press"
              >
                Rate Your Ride
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {step === 'searching' && (
          <SearchingDriver key="searching" onFound={handleDriverFound} />
        )}
      </AnimatePresence>

      {step === 'matched' && selectedCategory && (
        <DriverMatched
          otp={otp}
          onCancel={handleCancelRide}
          category={selectedCategory.name}
          fare={displayFare}
        />
      )}

      <AnimatePresence>
        {step === 'payment' && (
          <PaymentFlow
            key="payment"
            amount={displayFare}
            currency={currency === 'KES' ? 'KES' : '$'}
            onPaymentComplete={handlePaymentComplete}
            onCancel={() => setStep('matched')}
          />
        )}
      </AnimatePresence>

      {step === 'rating' && (
        <RatingModal
          role="rider"
          name={MOCK_DRIVER.name}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
};

export default RiderHome;
