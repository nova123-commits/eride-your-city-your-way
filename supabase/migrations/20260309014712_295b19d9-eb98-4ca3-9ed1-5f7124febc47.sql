
-- Driver commitment scores table
CREATE TABLE public.driver_commitment_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 100,
  total_accepts integer NOT NULL DEFAULT 0,
  total_cancels integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(driver_id)
);

ALTER TABLE public.driver_commitment_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own score" ON public.driver_commitment_scores
  FOR SELECT TO authenticated USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can manage own score" ON public.driver_commitment_scores
  FOR ALL TO authenticated USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Admins can view all scores" ON public.driver_commitment_scores
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view all scores" ON public.driver_commitment_scores
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));

-- Driver cancellation reasons log
CREATE TABLE public.driver_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  trip_id text,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can insert own cancellations" ON public.driver_cancellations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view own cancellations" ON public.driver_cancellations
  FOR SELECT TO authenticated USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all cancellations" ON public.driver_cancellations
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Locked fares table
CREATE TABLE public.locked_fares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id text NOT NULL,
  pickup text NOT NULL,
  destination text NOT NULL,
  fare_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  distance_km numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

ALTER TABLE public.locked_fares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own locked fares" ON public.locked_fares
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
