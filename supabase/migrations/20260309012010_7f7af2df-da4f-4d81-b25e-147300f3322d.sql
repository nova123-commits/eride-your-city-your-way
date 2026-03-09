
-- Add managed_by column to profiles for admin tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS managed_by uuid;

-- Add system_frozen setting
INSERT INTO public.platform_settings (key, value) VALUES ('system_frozen', 'false') ON CONFLICT (key) DO NOTHING;
