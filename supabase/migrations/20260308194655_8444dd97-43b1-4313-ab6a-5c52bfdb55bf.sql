
-- Saved addresses for riders
CREATE TABLE public.saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Home',
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses" ON public.saved_addresses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON public.saved_addresses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.saved_addresses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.saved_addresses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Scheduled trips
CREATE TABLE public.scheduled_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pickup TEXT NOT NULL,
  destination TEXT NOT NULL,
  stops JSONB DEFAULT '[]'::jsonb,
  category_id TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled trips" ON public.scheduled_trips
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create scheduled trips" ON public.scheduled_trips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled trips" ON public.scheduled_trips
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Live trip sharing
CREATE TABLE public.shared_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  pickup TEXT NOT NULL,
  destination TEXT NOT NULL,
  driver_name TEXT,
  vehicle TEXT,
  plate TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create shared trips" ON public.shared_trips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own shared trips" ON public.shared_trips
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active shared trips by token" ON public.shared_trips
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Users can update own shared trips" ON public.shared_trips
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
