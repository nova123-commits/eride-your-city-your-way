import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, MapPin, User } from 'lucide-react';
import ERideLogo from '@/components/ERideLogo';
import DestinationInput from '@/components/DestinationInput';
import RideCategories from '@/components/RideCategories';
import SearchingDriver from '@/components/SearchingDriver';
import DriverMatched from '@/components/DriverMatched';
import RatingModal from '@/components/RatingModal';
import { RIDE_CATEGORIES, calculateFare, generateOTP, MOCK_DRIVER, type RideCategory } from '@/lib/ride';

type RiderStep = 'home' | 'categories' | 'searching' | 'matched' | 'rating';

const RiderHome: React.FC = () => {
  const [step, setStep] = useState<RiderStep>('home');
  const [pickup, setPickup] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RideCategory | null>(null);
  const [otp, setOtp] = useState('');
  const distanceKm = 7.2; // mock distance

  const handleSearch = () => setStep('categories');

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
  };

  const handleTripComplete = () => {
    setStep('rating');
  };

  const handleRatingSubmit = (rating: number) => {
    setStep('home');
    setSelectedCategory(null);
    setDestination('');
  };

  const fare = selectedCategory ? calculateFare(selectedCategory, distanceKm) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 safe-top">
        <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <ERideLogo size="sm" />
        <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <User className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Map placeholder */}
      <div className="flex-1 relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
            <p className="text-xs text-muted-foreground">Map view</p>
          </div>
        </div>
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Simulate trip button when matched */}
        {step === 'matched' && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleTripComplete}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold z-10"
          >
            Simulate: Trip Complete
          </motion.button>
        )}
      </div>

      {/* Bottom panel */}
      <div className="px-4 pb-4 pt-3 safe-bottom bg-background space-y-3">
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <DestinationInput
              key="dest"
              pickup={pickup}
              destination={destination}
              onPickupChange={setPickup}
              onDestinationChange={setDestination}
              onSearch={handleSearch}
            />
          )}
          {step === 'categories' && (
            <RideCategories
              key="cats"
              selectedId={selectedCategory?.id ?? null}
              onSelect={setSelectedCategory}
              distanceKm={distanceKm}
              onConfirm={handleRequestRide}
            />
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
          fare={fare}
        />
      )}

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
