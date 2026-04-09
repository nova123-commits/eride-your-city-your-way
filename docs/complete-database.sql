-- ============================================================
-- eRide Production Database — Complete SQL Reference
-- ============================================================
-- This file documents ALL tables, functions, triggers, RLS
-- policies, and seed data required for the eRide platform.
--
-- The database is ALREADY fully provisioned via Lovable Cloud.
-- This file serves as a reference / disaster-recovery script.
-- ============================================================

-- ========================
-- 1. ENUM TYPES
-- ========================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'rider','driver','admin','manager',
    'super_admin','operations_manager','support_agent','finance'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================
-- 2. CORE TABLES
-- ========================

-- profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  mpesa_phone text,
  avatar_url text,
  safety_terms_accepted_at timestamptz,
  managed_by uuid,
  subscription_plan text NOT NULL DEFAULT 'basic',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'rider',
  UNIQUE(user_id, role)
);

-- wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- wallet_transactions
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

-- rides
CREATE TABLE IF NOT EXISTS public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL,
  driver_id uuid,
  pickup_address text NOT NULL,
  destination_address text NOT NULL,
  pickup_lat double precision,
  pickup_lng double precision,
  destination_lat double precision,
  destination_lng double precision,
  category text NOT NULL DEFAULT 'basic',
  status text NOT NULL DEFAULT 'requested',
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

-- ride_status_history
CREATE TABLE IF NOT EXISTS public.ride_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id),
  from_status text,
  to_status text NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- payments
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

-- driver_payouts
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

-- driver_locations (realtime tracking)
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

-- vehicles
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

-- driver_documents
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expiry_date date,
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- driver_commitment_scores
CREATE TABLE IF NOT EXISTS public.driver_commitment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 100,
  total_accepts integer NOT NULL DEFAULT 0,
  total_cancels integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- driver_cancellations
CREATE TABLE IF NOT EXISTS public.driver_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  trip_id text,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id),
  rater_id uuid NOT NULL,
  rated_id uuid NOT NULL,
  rater_role text NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- saved_addresses
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  address text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- trusted_contacts
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- locked_fares
CREATE TABLE IF NOT EXISTS public.locked_fares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pickup text NOT NULL,
  destination text NOT NULL,
  fare_amount numeric NOT NULL,
  distance_km numeric NOT NULL,
  category_id text NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  is_active boolean NOT NULL DEFAULT true,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- scheduled_trips
CREATE TABLE IF NOT EXISTS public.scheduled_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pickup text NOT NULL,
  destination text NOT NULL,
  category_id text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  stops jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- shared_trips
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

-- sos_alerts
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  location_text text,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- support_tickets
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

-- support_messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ticket_id uuid REFERENCES public.support_tickets(id),
  content text NOT NULL,
  sender_role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- lost_items
CREATE TABLE IF NOT EXISTS public.lost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  description text NOT NULL,
  trip_date text,
  status text NOT NULL DEFAULT 'reported',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- referrals
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

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  is_read boolean NOT NULL DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- platform_settings (key-value config)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- surge_rules
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

-- regional_fare_tiers
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

-- promo_codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  max_uses integer NOT NULL DEFAULT 500,
  current_uses integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- broadcasts
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  target_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- admin_permissions
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  can_approve_drivers boolean NOT NULL DEFAULT true,
  can_view_revenue boolean NOT NULL DEFAULT true,
  can_issue_refunds boolean NOT NULL DEFAULT false,
  can_delete_users boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- feature_flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  flag_label text NOT NULL DEFAULT '',
  description text DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- audit_trail
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- waitlist
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  city text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ========================
-- 3. SECURITY DEFINER FUNCTIONS
-- ========================

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
    WHERE user_id = _user_id AND role IN ('manager','super_admin')
  )
$$;

-- ========================
-- 4. AUTO-SIGNUP TRIGGER
-- ========================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  _role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', '')::app_role,
    'rider'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger (on auth.users)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================
-- 5. REFERRAL BONUS FUNCTION
-- ========================

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


-- ========================
-- 6. REALTIME
-- ========================

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;


-- ========================
-- 7. PLATFORM SEED DATA
-- ========================
-- (Already seeded via platform_settings table)
-- Key defaults:
--   base_fare = 100
--   per_km_price = 20
--   per_minute_price = 5
--   minimum_fare = 150
--   driver_commission_percent = 15
--   currency = KES
--   platform_initialized = false  (set to true after admin setup)


-- ========================
-- 8. PERFORMANCE INDEXES
-- ========================

CREATE INDEX IF NOT EXISTS idx_rides_rider ON public.rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created ON public.rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_online ON public.driver_locations(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON public.driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_ride ON public.payments(ride_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer ON public.payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ride ON public.ratings(ride_id);
CREATE INDEX IF NOT EXISTS idx_driver_docs_driver ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON public.vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_sos_status ON public.sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_trail(actor_id);


-- ========================
-- END OF FILE
-- ========================
-- All RLS policies are managed via Lovable Cloud migrations.
-- See the Supabase dashboard for the complete policy list.
