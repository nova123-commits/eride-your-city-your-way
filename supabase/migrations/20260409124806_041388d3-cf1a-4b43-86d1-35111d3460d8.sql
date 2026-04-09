
CREATE TABLE public.safe_pickup_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'landmark',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT NOT NULL DEFAULT 'Nairobi',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.safe_pickup_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read active pickup points"
  ON public.safe_pickup_points FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage pickup points"
  ON public.safe_pickup_points FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed real Nairobi pickup points
INSERT INTO public.safe_pickup_points (name, address, type, latitude, longitude, city) VALUES
  ('Total Energies - Kenyatta Ave', 'Kenyatta Avenue, Nairobi CBD', 'fuel', -1.2864, 36.8172, 'Nairobi'),
  ('Shell Station - Uhuru Highway', 'Uhuru Highway near Nyayo Stadium', 'fuel', -1.3028, 36.8219, 'Nairobi'),
  ('Rubis - Ngong Road', 'Ngong Road, Adams Arcade', 'fuel', -1.3005, 36.7876, 'Nairobi'),
  ('Sarit Centre', 'Karuna Rd, Westlands', 'mall', -1.2588, 36.8030, 'Nairobi'),
  ('The Junction Mall', 'Ngong Road, Dagoretti', 'mall', -1.3102, 36.7820, 'Nairobi'),
  ('Westgate Shopping Mall', 'Mwanzi Rd, Westlands', 'mall', -1.2567, 36.8037, 'Nairobi'),
  ('Two Rivers Mall', 'Limuru Rd, Runda', 'mall', -1.2284, 36.8048, 'Nairobi'),
  ('KICC', 'City Hall Way, Nairobi CBD', 'landmark', -1.2865, 36.8174, 'Nairobi'),
  ('Kenyatta International Convention Centre', 'Harambee Avenue', 'landmark', -1.2862, 36.8219, 'Nairobi'),
  ('University of Nairobi Main Campus', 'University Way', 'landmark', -1.2793, 36.8172, 'Nairobi'),
  ('Kenya National Theatre', 'Harry Thuku Rd', 'landmark', -1.2763, 36.8177, 'Nairobi'),
  ('Nairobi Railway Station', 'Haile Selassie Avenue', 'landmark', -1.2912, 36.8260, 'Nairobi'),
  ('Kenol Kobil - Mombasa Road', 'Mombasa Road near JKIA turnoff', 'fuel', -1.3192, 36.8920, 'Nairobi'),
  ('Garden City Mall', 'Thika Road, Kasarani', 'mall', -1.2280, 36.8770, 'Nairobi'),
  ('Village Market', 'Limuru Rd, Gigiri', 'mall', -1.2340, 36.8020, 'Nairobi');

CREATE INDEX idx_safe_pickup_points_location ON public.safe_pickup_points (latitude, longitude);
CREATE INDEX idx_safe_pickup_points_city ON public.safe_pickup_points (city);
