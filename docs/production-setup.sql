-- ============================================================
-- eRide Production SQL Setup
-- ============================================================
-- This file contains all SQL needed for a fresh Supabase project.
-- Run this ONCE against your external Supabase database.
-- It is idempotent (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'rider', 'driver', 'admin', 'manager',
    'super_admin', 'operations_manager', 'support_agent', 'finance'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 2. TABLES
-- ============================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  mpesa_phone text,
  avatar_url text,
  managed_by uuid,
  subscription_plan text NOT NULL DEFAULT 'basic',
  safety_terms_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User Roles (separate table per security best practice)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'rider',
  UNIQUE(user_id, role)
);

-- Wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  fee numeric NOT NULL DEFAULT 0,
  type text NOT NULL,
  label text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  color text NOT NULL,
  plate_number text NOT NULL,
  category text NOT NULL DEFAULT 'basic',
  is_active boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Driver Locations
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading double precision,
  speed double precision,
  is_online boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Driver Documents
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  expiry_date date,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Rides
CREATE TABLE IF NOT EXISTS public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL,
  driver_id uuid,
  status text NOT NULL DEFAULT 'requested',
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
  surge_multiplier numeric NOT NULL DEFAULT 1.0,
  payment_method text NOT NULL DEFAULT 'cash',
  otp_code text,
  cancel_reason text,
  cancelled_by text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ride Status History
CREATE TABLE IF NOT EXISTS public.ride_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id),
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id),
  payer_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  method text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'pending',
  transaction_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Driver Payouts
CREATE TABLE IF NOT EXISTS public.driver_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  ride_id uuid REFERENCES public.rides(id),
  amount numeric NOT NULL,
  commission numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id),
  rater_id uuid NOT NULL,
  rated_id uuid NOT NULL,
  rater_role text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Saved Addresses
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scheduled Trips
CREATE TABLE IF NOT EXISTS public.scheduled_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pickup text NOT NULL,
  destination text NOT NULL,
  category_id text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  stops jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Locked Fares
CREATE TABLE IF NOT EXISTS public.locked_fares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pickup text NOT NULL,
  destination text NOT NULL,
  category_id text NOT NULL,
  fare_amount numeric NOT NULL,
  distance_km numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  is_active boolean NOT NULL DEFAULT true,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Shared Trips
CREATE TABLE IF NOT EXISTS public.shared_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  share_token text NOT NULL UNIQUE,
  pickup text NOT NULL,
  destination text NOT NULL,
  driver_name text,
  vehicle text,
  plate text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SOS Alerts
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_text text,
  status text NOT NULL DEFAULT 'active',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trusted Contacts
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'open',
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Support Messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticket_id uuid REFERENCES public.support_tickets(id),
  content text NOT NULL,
  sender_role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lost Items
CREATE TABLE IF NOT EXISTS public.lost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  description text NOT NULL,
  trip_date text,
  status text NOT NULL DEFAULT 'reported',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  trips_completed integer NOT NULL DEFAULT 0,
  bonus_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Promo Codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent integer NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  max_uses integer NOT NULL DEFAULT 500,
  current_uses integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  flag_label text NOT NULL DEFAULT '',
  description text DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Broadcasts
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  target_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Admin Permissions
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL UNIQUE,
  can_approve_drivers boolean NOT NULL DEFAULT true,
  can_view_revenue boolean NOT NULL DEFAULT true,
  can_issue_refunds boolean NOT NULL DEFAULT false,
  can_delete_users boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Surge Rules
CREATE TABLE IF NOT EXISTS public.surge_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name text NOT NULL,
  start_hour integer NOT NULL,
  end_hour integer NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.5,
  day_of_week integer[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Regional Fare Tiers
CREATE TABLE IF NOT EXISTS public.regional_fare_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name text NOT NULL,
  region_type text NOT NULL DEFAULT 'city',
  base_fare_basic numeric NOT NULL DEFAULT 100,
  base_fare_xtra numeric NOT NULL DEFAULT 250,
  base_fare_boda numeric NOT NULL DEFAULT 50,
  per_km_rate numeric NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Driver Cancellations
CREATE TABLE IF NOT EXISTS public.driver_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  trip_id text,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Driver Commitment Scores
CREATE TABLE IF NOT EXISTS public.driver_commitment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL UNIQUE,
  score integer NOT NULL DEFAULT 100,
  total_accepts integer NOT NULL DEFAULT 0,
  total_cancels integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Waitlist
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  city text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locked_fares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_fare_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_commitment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 4. SECURITY DEFINER FUNCTIONS (used by RLS policies)
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('manager', 'super_admin')
  )
$$;


-- ============================================================
-- 5. NEW USER TRIGGER (auto-create profile, role, wallet)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;

  -- Insert role
  _role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', '')::app_role,
    'rider'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Insert wallet
  INSERT INTO public.wallets (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (this is what auto-creates data on signup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 6. REFERRAL BONUS FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.complete_referral_bonus(
  _referral_id uuid, _referrer_id uuid, _referred_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inviter_reward numeric;
  _invitee_reward numeric;
BEGIN
  SELECT value::numeric INTO _inviter_reward FROM platform_settings WHERE key = 'referral_inviter_reward';
  SELECT value::numeric INTO _invitee_reward FROM platform_settings WHERE key = 'referral_invitee_reward';
  _inviter_reward := COALESCE(_inviter_reward, 100);
  _invitee_reward := COALESCE(_invitee_reward, 50);

  UPDATE wallets SET balance = balance + _inviter_reward, updated_at = now() WHERE user_id = _referrer_id;
  INSERT INTO wallet_transactions (user_id, amount, type, label, status)
    VALUES (_referrer_id, _inviter_reward, 'credit', 'Referral bonus', 'completed');

  UPDATE wallets SET balance = balance + _invitee_reward, updated_at = now() WHERE user_id = _referred_id;
  INSERT INTO wallet_transactions (user_id, amount, type, label, status)
    VALUES (_referred_id, _invitee_reward, 'credit', 'Welcome referral bonus', 'completed');

  UPDATE referrals SET status = 'completed', bonus_paid = true WHERE id = _referral_id;
END;
$$;


-- ============================================================
-- 7. RLS POLICIES (comprehensive, per table)
-- ============================================================

-- Helper: drop policy if exists (Postgres doesn't have DROP POLICY IF EXISTS natively)
-- We use DO blocks

-- PROFILES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
END $$;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- USER ROLES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
END $$;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- WALLETS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
  DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
  DROP POLICY IF EXISTS "System can insert wallets" ON public.wallets;
  DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
END $$;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert wallets" ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- WALLET TRANSACTIONS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
  DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;
  DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
END $$;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- VEHICLES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Drivers manage own vehicles" ON public.vehicles;
  DROP POLICY IF EXISTS "Admins view all vehicles" ON public.vehicles;
END $$;
CREATE POLICY "Drivers manage own vehicles" ON public.vehicles FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Admins view all vehicles" ON public.vehicles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- DRIVER LOCATIONS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Drivers manage own location" ON public.driver_locations;
  DROP POLICY IF EXISTS "Authenticated can read online drivers" ON public.driver_locations;
  DROP POLICY IF EXISTS "Admins view all locations" ON public.driver_locations;
END $$;
CREATE POLICY "Drivers manage own location" ON public.driver_locations FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Authenticated can read online drivers" ON public.driver_locations FOR SELECT USING (is_online = true);
CREATE POLICY "Admins view all locations" ON public.driver_locations FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- DRIVER DOCUMENTS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Drivers manage own documents" ON public.driver_documents;
  DROP POLICY IF EXISTS "Admins view all documents" ON public.driver_documents;
  DROP POLICY IF EXISTS "Admins update documents" ON public.driver_documents;
END $$;
CREATE POLICY "Drivers manage own documents" ON public.driver_documents FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Admins view all documents" ON public.driver_documents FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update documents" ON public.driver_documents FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RIDES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Riders can create rides" ON public.rides;
  DROP POLICY IF EXISTS "Riders can view own rides" ON public.rides;
  DROP POLICY IF EXISTS "Drivers can view assigned rides" ON public.rides;
  DROP POLICY IF EXISTS "Drivers can update assigned rides" ON public.rides;
  DROP POLICY IF EXISTS "Admins can view all rides" ON public.rides;
  DROP POLICY IF EXISTS "Managers can view all rides" ON public.rides;
END $$;
CREATE POLICY "Riders can create rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = rider_id);
CREATE POLICY "Riders can view own rides" ON public.rides FOR SELECT USING (auth.uid() = rider_id);
CREATE POLICY "Drivers can view assigned rides" ON public.rides FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can update assigned rides" ON public.rides FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Admins can view all rides" ON public.rides FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers can view all rides" ON public.rides FOR SELECT USING (has_role(auth.uid(), 'manager'));

-- RIDE STATUS HISTORY
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated can insert ride history" ON public.ride_status_history;
  DROP POLICY IF EXISTS "Admins view all history" ON public.ride_status_history;
  DROP POLICY IF EXISTS "Users can view own ride history" ON public.ride_status_history;
END $$;
CREATE POLICY "Authenticated can insert ride history" ON public.ride_status_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = changed_by);
CREATE POLICY "Admins view all history" ON public.ride_status_history FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own ride history" ON public.ride_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM rides r WHERE r.id = ride_status_history.ride_id AND (r.rider_id = auth.uid() OR r.driver_id = auth.uid()))
);

-- PAYMENTS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated can insert payments" ON public.payments;
  DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
  DROP POLICY IF EXISTS "Admins view all payments" ON public.payments;
END $$;
CREATE POLICY "Authenticated can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = payer_id);
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT USING (auth.uid() = payer_id);
CREATE POLICY "Admins view all payments" ON public.payments FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- DRIVER PAYOUTS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Drivers view own payouts" ON public.driver_payouts;
  DROP POLICY IF EXISTS "Admins view all payouts" ON public.driver_payouts;
  DROP POLICY IF EXISTS "Service can insert payouts" ON public.driver_payouts;
END $$;
CREATE POLICY "Drivers view own payouts" ON public.driver_payouts FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins view all payouts" ON public.driver_payouts FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service can insert payouts" ON public.driver_payouts FOR INSERT TO authenticated WITH CHECK (true);

-- RATINGS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can rate after ride" ON public.ratings;
  DROP POLICY IF EXISTS "Users view own ratings" ON public.ratings;
  DROP POLICY IF EXISTS "Admins view all ratings" ON public.ratings;
END $$;
CREATE POLICY "Users can rate after ride" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "Users view own ratings" ON public.ratings FOR SELECT USING (auth.uid() = rater_id OR auth.uid() = rated_id);
CREATE POLICY "Admins view all ratings" ON public.ratings FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
END $$;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- SAVED ADDRESSES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own addresses" ON public.saved_addresses;
  DROP POLICY IF EXISTS "Users can insert own addresses" ON public.saved_addresses;
  DROP POLICY IF EXISTS "Users can update own addresses" ON public.saved_addresses;
  DROP POLICY IF EXISTS "Users can delete own addresses" ON public.saved_addresses;
END $$;
CREATE POLICY "Users can view own addresses" ON public.saved_addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.saved_addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.saved_addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.saved_addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SCHEDULED TRIPS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own scheduled trips" ON public.scheduled_trips;
  DROP POLICY IF EXISTS "Users can create scheduled trips" ON public.scheduled_trips;
  DROP POLICY IF EXISTS "Users can update own scheduled trips" ON public.scheduled_trips;
END $$;
CREATE POLICY "Users can view own scheduled trips" ON public.scheduled_trips FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create scheduled trips" ON public.scheduled_trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled trips" ON public.scheduled_trips FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- LOCKED FARES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage own locked fares" ON public.locked_fares;
END $$;
CREATE POLICY "Users can manage own locked fares" ON public.locked_fares FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SHARED TRIPS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can create shared trips" ON public.shared_trips;
  DROP POLICY IF EXISTS "Users can view own shared trips" ON public.shared_trips;
  DROP POLICY IF EXISTS "Users can update own shared trips" ON public.shared_trips;
  DROP POLICY IF EXISTS "Anyone can view active shared trips by token" ON public.shared_trips;
END $$;
CREATE POLICY "Users can create shared trips" ON public.shared_trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own shared trips" ON public.shared_trips FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own shared trips" ON public.shared_trips FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active shared trips by token" ON public.shared_trips FOR SELECT TO anon USING (is_active = true);

-- SOS ALERTS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert own SOS" ON public.sos_alerts;
  DROP POLICY IF EXISTS "Users can view own SOS" ON public.sos_alerts;
  DROP POLICY IF EXISTS "Admins can view all SOS" ON public.sos_alerts;
  DROP POLICY IF EXISTS "Admins can update SOS" ON public.sos_alerts;
  DROP POLICY IF EXISTS "Manager can view all SOS" ON public.sos_alerts;
  DROP POLICY IF EXISTS "Manager can update SOS" ON public.sos_alerts;
END $$;
CREATE POLICY "Users can insert own SOS" ON public.sos_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own SOS" ON public.sos_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all SOS" ON public.sos_alerts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update SOS" ON public.sos_alerts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Manager can view all SOS" ON public.sos_alerts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Manager can update SOS" ON public.sos_alerts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'manager'));

-- TRUSTED CONTACTS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage own contacts" ON public.trusted_contacts;
END $$;
CREATE POLICY "Users can manage own contacts" ON public.trusted_contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SUPPORT TICKETS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
  DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
  DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
  DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
END $$;
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- SUPPORT MESSAGES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can send messages" ON public.support_messages;
  DROP POLICY IF EXISTS "Users can view own messages" ON public.support_messages;
  DROP POLICY IF EXISTS "Admins can send messages" ON public.support_messages;
  DROP POLICY IF EXISTS "Admins can view all messages" ON public.support_messages;
END $$;
CREATE POLICY "Users can send messages" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own messages" ON public.support_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can send messages" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all messages" ON public.support_messages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- LOST ITEMS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can report lost items" ON public.lost_items;
  DROP POLICY IF EXISTS "Users can view own lost items" ON public.lost_items;
  DROP POLICY IF EXISTS "Admins can view all lost items" ON public.lost_items;
  DROP POLICY IF EXISTS "Admins can update lost items" ON public.lost_items;
END $$;
CREATE POLICY "Users can report lost items" ON public.lost_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own lost items" ON public.lost_items FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all lost items" ON public.lost_items FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lost items" ON public.lost_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- REFERRALS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can insert referrals" ON public.referrals;
  DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
  DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;
  DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
END $$;
CREATE POLICY "Authenticated users can insert referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid());
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "System can update referrals" ON public.referrals FOR UPDATE TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "Admins can view all referrals" ON public.referrals FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- PROMO CODES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
  DROP POLICY IF EXISTS "Authenticated can read active promos" ON public.promo_codes;
END $$;
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read active promos" ON public.promo_codes FOR SELECT TO authenticated USING (is_active = true);

-- FEATURE FLAGS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated can read flags" ON public.feature_flags;
  DROP POLICY IF EXISTS "Super admins can manage flags" ON public.feature_flags;
END $$;
CREATE POLICY "Authenticated can read flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage flags" ON public.feature_flags FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'))
  WITH CHECK (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- PLATFORM SETTINGS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated can read settings" ON public.platform_settings;
  DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;
END $$;
CREATE POLICY "Authenticated can read settings" ON public.platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.platform_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- BROADCASTS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can insert broadcasts" ON public.broadcasts;
  DROP POLICY IF EXISTS "Admins can view broadcasts" ON public.broadcasts;
END $$;
CREATE POLICY "Admins can insert broadcasts" ON public.broadcasts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view broadcasts" ON public.broadcasts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ADMIN PERMISSIONS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view own permissions" ON public.admin_permissions;
  DROP POLICY IF EXISTS "Manager can manage admin permissions" ON public.admin_permissions;
END $$;
CREATE POLICY "Admins can view own permissions" ON public.admin_permissions FOR SELECT TO authenticated USING (auth.uid() = admin_user_id);
CREATE POLICY "Manager can manage admin permissions" ON public.admin_permissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'manager')) WITH CHECK (has_role(auth.uid(), 'manager'));

-- AUDIT TRAIL
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated can insert audit entries" ON public.audit_trail;
  DROP POLICY IF EXISTS "Only manager can view audit trail" ON public.audit_trail;
END $$;
CREATE POLICY "Authenticated can insert audit entries" ON public.audit_trail FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Only manager can view audit trail" ON public.audit_trail FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'));

-- SURGE RULES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can read surge rules" ON public.surge_rules;
  DROP POLICY IF EXISTS "Admins can insert surge rules" ON public.surge_rules;
  DROP POLICY IF EXISTS "Admins can update surge rules" ON public.surge_rules;
  DROP POLICY IF EXISTS "Admins can delete surge rules" ON public.surge_rules;
END $$;
CREATE POLICY "Anyone can read surge rules" ON public.surge_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert surge rules" ON public.surge_rules FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update surge rules" ON public.surge_rules FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete surge rules" ON public.surge_rules FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- REGIONAL FARE TIERS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated can read fare tiers" ON public.regional_fare_tiers;
  DROP POLICY IF EXISTS "Managers can manage fare tiers" ON public.regional_fare_tiers;
END $$;
CREATE POLICY "Authenticated can read fare tiers" ON public.regional_fare_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage fare tiers" ON public.regional_fare_tiers FOR ALL TO authenticated USING (has_role(auth.uid(), 'manager')) WITH CHECK (has_role(auth.uid(), 'manager'));

-- DRIVER CANCELLATIONS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Drivers can insert own cancellations" ON public.driver_cancellations;
  DROP POLICY IF EXISTS "Drivers can view own cancellations" ON public.driver_cancellations;
  DROP POLICY IF EXISTS "Admins can view all cancellations" ON public.driver_cancellations;
END $$;
CREATE POLICY "Drivers can insert own cancellations" ON public.driver_cancellations FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can view own cancellations" ON public.driver_cancellations FOR SELECT TO authenticated USING (auth.uid() = driver_id);
CREATE POLICY "Admins can view all cancellations" ON public.driver_cancellations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- DRIVER COMMITMENT SCORES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Drivers can manage own score" ON public.driver_commitment_scores;
  DROP POLICY IF EXISTS "Drivers can view own score" ON public.driver_commitment_scores;
  DROP POLICY IF EXISTS "Admins can view all scores" ON public.driver_commitment_scores;
  DROP POLICY IF EXISTS "Managers can view all scores" ON public.driver_commitment_scores;
END $$;
CREATE POLICY "Drivers can manage own score" ON public.driver_commitment_scores FOR ALL TO authenticated USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can view own score" ON public.driver_commitment_scores FOR SELECT TO authenticated USING (auth.uid() = driver_id);
CREATE POLICY "Admins can view all scores" ON public.driver_commitment_scores FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers can view all scores" ON public.driver_commitment_scores FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'));

-- WAITLIST
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
  DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;
END $$;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view waitlist" ON public.waitlist FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));


-- ============================================================
-- 8. REALTIME (enable for key tables)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;


-- ============================================================
-- 9. PLATFORM SETTINGS SEED DATA
-- ============================================================

INSERT INTO platform_settings (key, value) VALUES
  ('company_name', 'eRide'),
  ('country', 'Kenya'),
  ('currency', 'KES'),
  ('timezone', 'Africa/Nairobi'),
  ('base_fare', '100'),
  ('per_km_price', '20'),
  ('per_minute_price', '5'),
  ('minimum_fare', '150'),
  ('commission_rate', '15'),
  ('driver_commission_percent', '15'),
  ('cash_payments_enabled', 'true'),
  ('mobile_money_enabled', 'true'),
  ('wallet_payments_enabled', 'true'),
  ('card_payments_enabled', 'false'),
  ('driver_verification_required', 'true'),
  ('driver_document_checks', 'true'),
  ('operating_hours_start', '05:00'),
  ('operating_hours_end', '23:00'),
  ('referral_inviter_reward', '100'),
  ('referral_invitee_reward', '50'),
  ('basic_plan_price', '0'),
  ('gold_plan_price', '1000'),
  ('gold_transaction_fee_discount', '50'),
  ('platform_initialized', 'true'),
  ('system_frozen', 'false')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON public.rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON public.rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_completed_at ON public.rides(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_online ON public.driver_locations(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ride ON public.ratings(ride_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_payouts_driver ON public.driver_payouts(driver_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON public.vehicles(driver_id);


-- ============================================================
-- DONE! Your eRide database is production-ready.
-- ============================================================
