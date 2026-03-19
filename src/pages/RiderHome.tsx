import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, MapPin, Crown, Clock, Lock } from 'lucide-react';
import RiderSidebar from '@/components/RiderSidebar';
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
import CarbonFootprintTracker from '@/components/CarbonFootprintTracker';
import LoyaltyRewards from '@/components/LoyaltyRewards';
import PinkModeToggle from '@/components/safety/PinkModeToggle';
import PaymentFlow from '@/components/payments/PaymentFlow';
import DigitalReceipt from '@/components/payments/DigitalReceipt';
import CurrencyToggle from '@/components/payments/CurrencyToggle';
import SavedPlaces from '@/components/SavedPlaces';
import ScheduleRide from '@/components/ScheduleRide';
import LiveTripShare from '@/components/LiveTripShare';
import { type AccessibilityPrefs } from '@/components/AccessibilityToggles';
import { RIDE_CATEGORIES, calculateFare, generateOTP, isPeakHour, type RideCategory } from '@/lib/ride';
import { calculateFareBreakdown, formatCurrency, convertCurrency, type CurrencyCode } from '@/lib/currency';
import RoleNav from '@/components/RoleNav';
import PromoBanner from '@/components/PromoBanner';
import RiderWaitlist from '@/components/RiderWaitlist';
import LiveProgressBar from '@/components/trip/LiveProgressBar';
import TripSummaryOverlay from '@/components/trip/TripSummaryOverlay';
import PulseMapMarker from '@/components/trip/PulseMapMarker';
import { downloadReceiptAsImage } from '@/lib/receiptGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import LowDataBanner from '@/components/LowDataBanner';
import SafePickupPoints from '@/components/SafePickupPoints';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { useFareLock } from '@/hooks/useFareLock';
import BookForSomeone, { type GuestBooking } from '@/components/BookForSomeone';
import { useRideRequest } from '@/hooks/useRideRequest';
import { useRideRealtime } from '@/hooks/useRideRealtime';

type RiderStep = 'home' | 'categories' | 'preferences' | 'searching' | 'matched' | 'inTrip' | 'tripSummary' | 'payment' | 'receipt' | 'rating' | 'schedule';

const STOP_FEE = 40; // KES per stop (5 min wait)

const RiderHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { quality, isLowData } = useNetworkQuality();
  const { lockFare, getLockedFare, releaseLock } = useFareLock();
  const { rideId, createRide, cancelRide: cancelRideRequest } = useRideRequest();
  const { ride, driver, vehicle } = useRideRealtime(rideId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [step, setStep] = useState<RiderStep>('home');
  const [fareLocked, setFareLocked] = useState(false);
  const [pickup, setPickup] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [additionalStops, setAdditionalStops] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RideCategory | null>(null);
  const [otp, setOtp] = useState('');
  const [errandStop, setErrandStop] = useState<ErrandStopData | null>(null);
  const [pinkMode, setPinkMode] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>('KES');
  const [accessibilityPrefs, setAccessibilityPrefs] = useState<AccessibilityPrefs>({ wheelchair: false, extraLuggage: false });
  const [ridePrefs, setRidePrefs] = useState<RidePrefs>({
    conversation: 'open',
    temperature: 'ac_low',
    musicGenre: 'None',
  });
  const [guestBooking, setGuestBooking] = useState<GuestBooking>({ enabled: false, passengerName: '', passengerPhone: '' });
  const distanceKm = 7.2;

  // Derived driver info from realtime
  const driverName = driver?.full_name ?? 'Your Driver';
  const driverVehicle = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle';
  const driverPlate = vehicle?.plate_number ?? '';

  // React to realtime ride status changes
  useEffect(() => {
    if (!ride) return;
    if (ride.status === 'driver_assigned' && step === 'searching') {
      setOtp(ride.otp_code ?? '');
      setStep('matched');
    } else if (ride.status === 'ride_started' && step !== 'inTrip') {
      setStep('inTrip');
    } else if (ride.status === 'ride_completed' && step !== 'tripSummary' && step !== 'payment' && step !== 'receipt' && step !== 'rating') {
      setStep('tripSummary');
    } else if (ride.status === 'cancelled' && step !== 'home') {
      setStep('home');
      toast({ title: 'Ride cancelled' });
    }
  }, [ride?.status]);

  const handleSearch = () => setStep('categories');
  const handleCategoryConfirm = () => setStep('preferences');

  const handleRequestRide = async () => {
    if (!selectedCategory || !user) return;
    // Lock the fare
    await lockFare({
      categoryId: selectedCategory.id,
      pickup,
      destination: destination || 'JKIA Airport',
      fareAmount: fare,
      currency,
      distanceKm,
    });
    setFareLocked(true);
    setStep('searching');

    // Create the ride in the database
    const id = await createRide({
      pickup,
      destination: destination || 'JKIA Airport',
      category: selectedCategory,
      estimatedFare: fare,
      distanceKm,
      surgeMultiplier: isPeakHour() ? 1.5 : 1,
    });

    if (!id) {
      setStep('home');
      setFareLocked(false);
    }

    // Also try to assign a driver via edge function
    if (id) {
      try {
        await supabase.functions.invoke('assign-driver', { body: { ride_id: id } });
      } catch (err) {
        console.warn("[RiderHome] assign-driver call failed, waiting for manual accept", err);
      }
    }
  };

  const handleDriverFound = useCallback(() => {
    // This is the fallback timeout from SearchingDriver
    // With realtime, this may already be handled by useEffect above
    if (step === 'searching') setStep('matched');
  }, [step]);

  const handleCancelRide = async () => {
    await cancelRideRequest();
    await releaseLock();
    setFareLocked(false);
    setStep('home');
    setSelectedCategory(null);
    setDestination('');
    setAdditionalStops([]);
    setErrandStop(null);
  };

  const handleTripComplete = () => setStep('inTrip');
  const handleInTripComplete = () => setStep('tripSummary');
  const handleSummaryPayment = () => setStep('payment');
  const handlePaymentComplete = () => setStep('receipt');
  const handleReceiptDone = () => setStep('rating');

  const handleDownloadReceipt = () => {
    if (!fareBreakdown) return;
    downloadReceiptAsImage({
      tripId: 'TRP-2026-4821',
      date: new Date().toLocaleDateString('en-KE', { dateStyle: 'full' }),
      pickup,
      dropoff: destination || 'JKIA Airport',
      distance: `${distanceKm} km`,
      duration: '18 min',
      driverName: driverName,
      breakdown: fareBreakdown,
      currency,
    });
  };

  const handleRatingSubmit = async () => {
    await releaseLock();
    setFareLocked(false);
    setStep('home');
    setSelectedCategory(null);
    setDestination('');
    setAdditionalStops([]);
    setErrandStop(null);
  };

  const handleScheduleRide = async (scheduledAt: Date) => {
    if (!user || !selectedCategory) return;
    const { error } = await supabase.from('scheduled_trips').insert({
      user_id: user.id,
      pickup,
      destination: destination || 'JKIA Airport',
      stops: additionalStops.filter(s => s.length > 0),
      category_id: selectedCategory.id,
      scheduled_at: scheduledAt.toISOString(),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ride Scheduled!', description: `Pickup at ${scheduledAt.toLocaleString('en-KE')}` });
      setStep('home');
    }
  };

  const handleSavedPlaceSelect = (address: string) => {
    setDestination(address);
  };

  const waitMinutes = errandStop?.waitMinutes ?? 0;
  const stopsFee = additionalStops.filter(s => s.length > 0).length * STOP_FEE;
  const fare = selectedCategory ? calculateFare(selectedCategory, distanceKm, waitMinutes) + stopsFee : 0;
  const isElectric = selectedCategory?.id === 'electric';

  const fareBreakdown = selectedCategory
    ? calculateFareBreakdown(selectedCategory.baseRate, selectedCategory.perKm, distanceKm, waitMinutes, 8, isPeakHour())
    : null;

  const displayFare = currency === 'KES' ? fare : convertCurrency(fare, currency);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RiderSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <header className="flex items-center justify-between px-5 pt-4 pb-2 safe-top">
        <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl glass-fab flex items-center justify-center btn-press">
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

      <PromoBanner />
      <LowDataBanner quality={quality} />

      <div className="flex-1 relative bg-secondary overflow-hidden">
        {!isLowData && (
          <>
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
          </>
        )}
        {isLowData && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Maps paused — low data mode</p>
          </div>
        )}

        {step === 'matched' && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleTripComplete}
            className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl brand-gradient text-primary-foreground text-xs font-semibold z-10 btn-press"
          >
            Simulate: Start Trip
          </motion.button>
        )}

        {step === 'inTrip' && (
          <>
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleInTripComplete}
              className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl brand-gradient text-primary-foreground text-xs font-semibold z-10 btn-press"
            >
              Simulate: Arrive
            </motion.button>
            {/* Pulsing map markers */}
            <div className="absolute top-20 left-10">
              <PulseMapMarker type="pickup" label="Pickup" />
            </div>
            <div className="absolute bottom-20 right-10">
              <PulseMapMarker type="destination" label="Dropoff" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <PulseMapMarker type="driver" />
            </div>
          </>
        )}
      </div>

      <div className="px-4 pb-4 pt-3 safe-bottom glass-bottom-sheet space-y-3">
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <div key="dest" className="space-y-3">
              <SafePickupPoints onSelect={(addr) => setPickup(addr)} />
              <SavedPlaces onSelect={handleSavedPlaceSelect} />
              <DestinationInput
                pickup={pickup}
                destination={destination}
                onPickupChange={setPickup}
                onDestinationChange={setDestination}
                onSearch={handleSearch}
                stops={additionalStops}
                onStopsChange={setAdditionalStops}
              />
              <ErrandStop
                stop={errandStop}
                onAdd={setErrandStop}
                onRemove={() => setErrandStop(null)}
              />
              <BookForSomeone value={guestBooking} onChange={setGuestBooking} />
              <PinkModeToggle enabled={pinkMode} onToggle={setPinkMode} />
              <LoyaltyRewards />
              <RiderWaitlist />
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
                accessibilityPrefs={accessibilityPrefs}
                onAccessibilityChange={setAccessibilityPrefs}
              />
              {selectedCategory && (
                <CarbonFootprintTracker
                  distanceKm={distanceKm}
                  categoryId={selectedCategory.id}
                  totalTrips={12}
                />
              )}
              {additionalStops.filter(s => s.length > 0).length > 0 && (
                <div className="text-xs text-muted-foreground px-1">
                  +KES {stopsFee} for {additionalStops.filter(s => s.length > 0).length} additional stop(s)
                </div>
              )}
              {selectedCategory && (
                <div className="flex items-center gap-1.5 px-1 text-xs text-primary font-medium">
                  <Lock className="w-3 h-3" />
                  Fare locks at {formatCurrency(fare, currency)} when you confirm
                </div>
              )}
            </div>
          )}
          {step === 'preferences' && selectedCategory && (
            <div key="prefs" className="space-y-3">
              <RidePreferences
                prefs={ridePrefs}
                onChange={setRidePrefs}
                onConfirm={handleRequestRide}
                onBack={() => setStep('categories')}
              />
              <button
                onClick={() => setStep('schedule')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 transition-all btn-press"
              >
                <Clock className="w-4 h-4 text-primary" />
                Schedule for Later
              </button>
            </div>
          )}
          {step === 'schedule' && selectedCategory && (
            <ScheduleRide
              key="schedule"
              onSchedule={handleScheduleRide}
              onCancel={() => setStep('preferences')}
            />
          )}
          {step === 'inTrip' && selectedCategory && (
            <div key="intrip" className="space-y-3">
              <LiveProgressBar
                pickup={pickup}
                destination={destination || 'JKIA Airport'}
                totalDistanceKm={distanceKm}
                etaMinutes={18}
              />
            </div>
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
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadReceipt}
                  className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-bold text-sm btn-press flex items-center justify-center gap-2"
                >
                  📥 Download Receipt
                </button>
                <button
                  onClick={handleReceiptDone}
                  className="flex-1 py-3.5 rounded-xl brand-gradient text-primary-foreground font-bold text-sm btn-press"
                >
                  Rate Your Ride
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {step === 'searching' && (
          <SearchingDriver key="searching" onFound={handleDriverFound} />
        )}
      </AnimatePresence>

      {step === 'matched' && selectedCategory && (
        <div className="space-y-2">
          <DriverMatched
            otp={otp}
            onCancel={handleCancelRide}
            category={selectedCategory.name}
            fare={displayFare}
          />
          <div className="px-4 pb-2 space-y-2">
            <LiveTripShare
              pickup={pickup}
              destination={destination || 'JKIA Airport'}
              driverName={MOCK_DRIVER.name}
              vehicle={MOCK_DRIVER.vehicle}
              plate={MOCK_DRIVER.plate}
            />
          </div>
        </div>
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

      <AnimatePresence>
        {step === 'tripSummary' && selectedCategory && (
          <TripSummaryOverlay
            key="summary"
            pickup={pickup}
            destination={destination || 'JKIA Airport'}
            distanceKm={distanceKm}
            durationMinutes={18}
            categoryId={selectedCategory.id}
            fare={fare}
            currency={currency === 'KES' ? 'KES' : '$'}
            onContinue={handleSummaryPayment}
            onDownloadReceipt={handleDownloadReceipt}
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
      <RoleNav />
    </div>
  );
};

export default RiderHome;
