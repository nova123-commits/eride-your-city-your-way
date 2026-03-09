
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS safety_terms_accepted_at timestamp with time zone DEFAULT NULL;
