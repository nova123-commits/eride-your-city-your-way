
-- Add subscription_plan to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'basic';

-- Create regional_fare_tiers table
CREATE TABLE IF NOT EXISTS public.regional_fare_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name text NOT NULL,
  region_type text NOT NULL DEFAULT 'city', -- city | rural
  base_fare_basic numeric NOT NULL DEFAULT 100,
  base_fare_xtra numeric NOT NULL DEFAULT 250,
  base_fare_boda numeric NOT NULL DEFAULT 50,
  per_km_rate numeric NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.regional_fare_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read fare tiers
CREATE POLICY "Authenticated can read fare tiers" ON public.regional_fare_tiers
  FOR SELECT TO authenticated USING (true);

-- Only managers can manage fare tiers
CREATE POLICY "Managers can manage fare tiers" ON public.regional_fare_tiers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

-- Seed default platform_settings for subscriptions and rewards
INSERT INTO public.platform_settings (key, value) VALUES
  ('gold_plan_price', '1000'),
  ('basic_plan_price', '0'),
  ('referral_inviter_reward', '100'),
  ('referral_invitee_reward', '50'),
  ('gold_transaction_fee_discount', '50'),
  ('operational_hours_start', '05:00'),
  ('operational_hours_end', '23:00')
ON CONFLICT (key) DO NOTHING;

-- Seed default regional fare tiers
INSERT INTO public.regional_fare_tiers (region_name, region_type, base_fare_basic, base_fare_xtra, base_fare_boda, per_km_rate) VALUES
  ('Nairobi', 'city', 100, 250, 50, 20),
  ('Mombasa', 'city', 90, 230, 45, 18),
  ('Kisumu', 'city', 80, 200, 40, 15),
  ('Rural Kenya', 'rural', 70, 180, 35, 12);
