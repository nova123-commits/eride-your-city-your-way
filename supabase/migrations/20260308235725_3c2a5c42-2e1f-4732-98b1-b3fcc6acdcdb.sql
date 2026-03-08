
-- Broadcasts table for system-wide notifications
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  target_role text NOT NULL CHECK (target_role IN ('rider', 'driver', 'all')),
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert broadcasts" ON public.broadcasts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view broadcasts" ON public.broadcasts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Platform settings table for commission rate etc
CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read settings" ON public.platform_settings
  FOR SELECT TO authenticated
  USING (true);

-- Seed default commission
INSERT INTO public.platform_settings (key, value) VALUES ('commission_rate', '15');
