-- ============================================================
-- eRide Platform — Complete Database Schema (init.sql)
-- Run against a fresh Postgres instance with Supabase extensions
-- ============================================================

-- ==================== ENUMS ====================

CREATE TYPE public.app_role AS ENUM ('rider', 'driver', 'admin', 'manager');

-- ==================== TABLES ====================

-- Profiles (linked to auth.users via id)
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY,  -- matches auth.users.id
  full_name     text,
  phone         text,
  mpesa_phone   text,
  avatar_url    text,
  managed_by    uuid,
  safety_terms_accepted_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- User Roles (separate table — never store role on profiles)
CREATE TABLE public.user_roles (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL,  -- references auth.users(id) at app level
  role     app_role NOT NULL DEFAULT 'rider',
  UNIQUE (user_id, role)
);

-- Wallets
CREATE TABLE public.wallets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  balance    numeric NOT NULL DEFAULT 0,
  currency   text NOT NULL DEFAULT 'KES',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wallet Transactions
CREATE TABLE public.wallet_transactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  amount     numeric NOT NULL,
  fee        numeric NOT NULL DEFAULT 0,
  type       text NOT NULL,           -- 'credit' | 'debit'
  label      text NOT NULL,
  phone      text,
  status     text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trusted Contacts
CREATE TABLE public.trusted_contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  name       text NOT NULL,
  phone      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Driver Commitment Scores
CREATE TABLE public.driver_commitment_scores (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id     uuid NOT NULL,
  score         integer NOT NULL DEFAULT 100,
  total_accepts integer NOT NULL DEFAULT 0,
  total_cancels integer NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Driver Cancellations
CREATE TABLE public.driver_cancellations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id  uuid NOT NULL,
  trip_id    text,
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Locked Fares (fare freeze for 30 min)
CREATE TABLE public.locked_fares (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  pickup       text NOT NULL,
  destination  text NOT NULL,
  distance_km  numeric NOT NULL,
  fare_amount  numeric NOT NULL,
  currency     text NOT NULL DEFAULT 'KES',
  category_id  text NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  locked_at    timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Saved Addresses
CREATE TABLE public.saved_addresses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  label      text NOT NULL DEFAULT 'Home',
  address    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scheduled Trips
CREATE TABLE public.scheduled_trips (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  pickup       text NOT NULL,
  destination  text NOT NULL,
  category_id  text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status       text NOT NULL DEFAULT 'scheduled',
  stops        jsonb DEFAULT '[]'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Shared Trips (live trip sharing)
CREATE TABLE public.shared_trips (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  share_token  text NOT NULL,
  pickup       text NOT NULL,
  destination  text NOT NULL,
  driver_name  text,
  vehicle      text,
  plate        text,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- SOS Alerts
CREATE TABLE public.sos_alerts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  status        text NOT NULL DEFAULT 'active',
  location_text text,
  resolved_at   timestamptz,
  resolved_by   uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Support Tickets
CREATE TABLE public.support_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL,
  subject        text NOT NULL,
  description    text NOT NULL,
  category       text NOT NULL DEFAULT 'general',
  status         text NOT NULL DEFAULT 'open',
  admin_response text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Support Messages
CREATE TABLE public.support_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  ticket_id   uuid REFERENCES public.support_tickets(id),
  content     text NOT NULL,
  sender_role text NOT NULL DEFAULT 'user',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Lost Items
CREATE TABLE public.lost_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  description text NOT NULL,
  trip_date   text,
  status      text NOT NULL DEFAULT 'reported',
  admin_notes text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Referrals
CREATE TABLE public.referrals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     uuid NOT NULL,
  referred_id     uuid,
  referral_code   text NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  trips_completed integer NOT NULL DEFAULT 0,
  bonus_paid      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Promo Codes
CREATE TABLE public.promo_codes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL,
  created_by       uuid NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  discount_amount  numeric NOT NULL DEFAULT 0,
  max_uses         integer NOT NULL DEFAULT 500,
  current_uses     integer NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  expires_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Broadcasts
CREATE TABLE public.broadcasts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL,
  title       text NOT NULL,
  message     text NOT NULL,
  target_role text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Admin Permissions
CREATE TABLE public.admin_permissions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id       uuid NOT NULL,
  can_view_revenue    boolean NOT NULL DEFAULT true,
  can_approve_drivers boolean NOT NULL DEFAULT true,
  can_issue_refunds   boolean NOT NULL DEFAULT false,
  can_delete_users    boolean NOT NULL DEFAULT false,
  updated_by          uuid,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Audit Trail
CREATE TABLE public.audit_trail (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid NOT NULL,
  actor_role   text NOT NULL,
  action       text NOT NULL,
  target_table text,
  target_id    text,
  details      jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Platform Settings (key-value)
CREATE TABLE public.platform_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Waitlist
CREATE TABLE public.waitlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      text NOT NULL,
  city       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==================== SECURITY DEFINER FUNCTIONS ====================

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

-- ==================== AUTH TRIGGER ====================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  _role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', '')::app_role, 'rider');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  INSERT INTO public.wallets (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (only works in Supabase environment)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== REFERRAL BONUS FUNCTION ====================

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

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_commitment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locked_fares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ---- user_roles ----
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ---- wallets ----
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert wallets" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ---- wallet_transactions ----
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ---- trusted_contacts ----
CREATE POLICY "Users can manage own contacts" ON public.trusted_contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---- driver_commitment_scores ----
CREATE POLICY "Drivers can view own score" ON public.driver_commitment_scores FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can manage own score" ON public.driver_commitment_scores FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Admins can view all scores" ON public.driver_commitment_scores FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Managers can view all scores" ON public.driver_commitment_scores FOR SELECT USING (has_role(auth.uid(), 'manager'));

-- ---- driver_cancellations ----
CREATE POLICY "Drivers can insert own cancellations" ON public.driver_cancellations FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can view own cancellations" ON public.driver_cancellations FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Admins can view all cancellations" ON public.driver_cancellations FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ---- locked_fares ----
CREATE POLICY "Users can manage own locked fares" ON public.locked_fares FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---- saved_addresses ----
CREATE POLICY "Users can view own addresses" ON public.saved_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.saved_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.saved_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.saved_addresses FOR DELETE USING (auth.uid() = user_id);

-- ---- scheduled_trips ----
CREATE POLICY "Users can view own scheduled trips" ON public.scheduled_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create scheduled trips" ON public.scheduled_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scheduled trips" ON public.scheduled_trips FOR UPDATE USING (auth.uid() = user_id);

-- ---- shared_trips ----
CREATE POLICY "Users can view own shared trips" ON public.shared_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create shared trips" ON public.shared_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shared trips" ON public.shared_trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active shared trips by token" ON public.shared_trips FOR SELECT USING (is_active = true);

-- ---- sos_alerts ----
CREATE POLICY "Users can insert own SOS" ON public.sos_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own SOS" ON public.sos_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all SOS" ON public.sos_alerts FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update SOS" ON public.sos_alerts FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Manager can view all SOS" ON public.sos_alerts FOR SELECT USING (has_role(auth.uid(), 'manager'));
CREATE POLICY "Manager can update SOS" ON public.sos_alerts FOR UPDATE USING (has_role(auth.uid(), 'manager'));

-- ---- support_tickets ----
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tickets" ON public.support_tickets FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- ---- support_messages ----
CREATE POLICY "Users can send messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own messages" ON public.support_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can send messages" ON public.support_messages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all messages" ON public.support_messages FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ---- lost_items ----
CREATE POLICY "Users can report lost items" ON public.lost_items FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own lost items" ON public.lost_items FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all lost items" ON public.lost_items FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lost items" ON public.lost_items FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- ---- referrals ----
CREATE POLICY "Authenticated users can insert referrals" ON public.referrals FOR INSERT WITH CHECK (referrer_id = auth.uid());
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "System can update referrals" ON public.referrals FOR UPDATE USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "Admins can view all referrals" ON public.referrals FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ---- promo_codes ----
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read active promos" ON public.promo_codes FOR SELECT USING (is_active = true);

-- ---- broadcasts ----
CREATE POLICY "Admins can insert broadcasts" ON public.broadcasts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view broadcasts" ON public.broadcasts FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ---- admin_permissions ----
CREATE POLICY "Admins can view own permissions" ON public.admin_permissions FOR SELECT USING (auth.uid() = admin_user_id);
CREATE POLICY "Manager can manage admin permissions" ON public.admin_permissions FOR ALL USING (has_role(auth.uid(), 'manager')) WITH CHECK (has_role(auth.uid(), 'manager'));

-- ---- audit_trail ----
CREATE POLICY "Authenticated can insert audit entries" ON public.audit_trail FOR INSERT WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Only manager can view audit trail" ON public.audit_trail FOR SELECT USING (has_role(auth.uid(), 'manager'));

-- ---- platform_settings ----
CREATE POLICY "Authenticated can read settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.platform_settings FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ---- waitlist ----
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view waitlist" ON public.waitlist FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ==================== END ====================
