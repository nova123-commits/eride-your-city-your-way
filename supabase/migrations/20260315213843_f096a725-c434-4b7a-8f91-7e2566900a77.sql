
-- ========================================
-- RIDES TABLE — Core ride lifecycle
-- ========================================
CREATE TABLE public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','driver_assigned','driver_arriving','ride_started','ride_completed','cancelled')),
  pickup_address text NOT NULL,
  destination_address text NOT NULL,
  pickup_lat double precision,
  pickup_lng double precision,
  destination_lat double precision,
  destination_lng double precision,
  category text NOT NULL DEFAULT 'basic',
  estimated_fare numeric NOT NULL DEFAULT 0,
  final_fare numeric,
  distance_km numeric,
  duration_minutes numeric,
  otp_code text,
  surge_multiplier numeric NOT NULL DEFAULT 1.0,
  payment_method text NOT NULL DEFAULT 'cash',
  cancelled_by text,
  cancel_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders can view own rides" ON public.rides
  FOR SELECT USING (auth.uid() = rider_id);

CREATE POLICY "Drivers can view assigned rides" ON public.rides
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Riders can create rides" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Drivers can update assigned rides" ON public.rides
  FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all rides" ON public.rides
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view all rides" ON public.rides
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

CREATE INDEX idx_rides_rider ON public.rides(rider_id);
CREATE INDEX idx_rides_driver ON public.rides(driver_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_created ON public.rides(created_at DESC);

-- ========================================
-- RIDE STATUS HISTORY
-- ========================================
CREATE TABLE public.ride_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ride_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ride history" ON public.ride_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND (r.rider_id = auth.uid() OR r.driver_id = auth.uid()))
  );

CREATE POLICY "Admins view all history" ON public.ride_status_history
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ride_history_ride ON public.ride_status_history(ride_id);

-- ========================================
-- VEHICLES TABLE
-- ========================================
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  color text NOT NULL,
  plate_number text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'basic',
  is_active boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers manage own vehicles" ON public.vehicles
  FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins view all vehicles" ON public.vehicles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_vehicles_driver ON public.vehicles(driver_id);

-- ========================================
-- DRIVER DOCUMENTS
-- ========================================
CREATE TABLE public.driver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  expiry_date date,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','expired')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers manage own documents" ON public.driver_documents
  FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins view all documents" ON public.driver_documents
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update documents" ON public.driver_documents
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_driver_docs ON public.driver_documents(driver_id);

-- ========================================
-- DRIVER LOCATIONS (PostGIS-ready with lat/lng)
-- ========================================
CREATE TABLE public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading double precision,
  speed double precision,
  is_online boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers manage own location" ON public.driver_locations
  FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Authenticated can read online drivers" ON public.driver_locations
  FOR SELECT USING (is_online = true);

CREATE POLICY "Admins view all locations" ON public.driver_locations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_driver_loc ON public.driver_locations(driver_id);
CREATE INDEX idx_driver_loc_online ON public.driver_locations(is_online) WHERE is_online = true;

-- Enable realtime for driver_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;

-- ========================================
-- PAYMENTS TABLE
-- ========================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  method text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed','refunded')),
  transaction_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = payer_id);

CREATE POLICY "Admins view all payments" ON public.payments
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_payments_ride ON public.payments(ride_id);

-- ========================================
-- RATINGS TABLE
-- ========================================
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id),
  rated_id uuid NOT NULL REFERENCES auth.users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  rater_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ride_id, rater_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can rate after ride" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users view own ratings" ON public.ratings
  FOR SELECT USING (auth.uid() = rater_id OR auth.uid() = rated_id);

CREATE POLICY "Admins view all ratings" ON public.ratings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ratings_ride ON public.ratings(ride_id);
CREATE INDEX idx_ratings_rated ON public.ratings(rated_id);

-- ========================================
-- NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  is_read boolean NOT NULL DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- ========================================
-- DRIVER PAYOUTS
-- ========================================
CREATE TABLE public.driver_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id uuid REFERENCES public.rides(id),
  amount numeric NOT NULL,
  commission numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers view own payouts" ON public.driver_payouts
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Admins view all payouts" ON public.driver_payouts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_payouts_driver ON public.driver_payouts(driver_id);

-- ========================================
-- SURGE RULES
-- ========================================
CREATE TABLE public.surge_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name text NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.5,
  start_hour integer NOT NULL,
  end_hour integer NOT NULL,
  day_of_week integer[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.surge_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read surge rules" ON public.surge_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins manage surge rules" ON public.surge_rules
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
