
-- Trusted contacts (max 3 per user)
CREATE TABLE public.trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contacts" ON public.trusted_contacts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SOS alerts table
CREATE TABLE public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_text text,
  status text NOT NULL DEFAULT 'active',
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own SOS" ON public.sos_alerts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own SOS" ON public.sos_alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all SOS" ON public.sos_alerts
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update SOS" ON public.sos_alerts
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Manager can view all SOS" ON public.sos_alerts
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Manager can update SOS" ON public.sos_alerts
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role));

-- Add mpesa_phone to profiles for identity lock
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mpesa_phone text;

-- Enable realtime for SOS alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
