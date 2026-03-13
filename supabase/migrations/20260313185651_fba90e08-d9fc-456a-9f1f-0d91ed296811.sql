-- Create is_super_admin helper first
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('manager', 'super_admin')
  )
$$;

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  flag_label text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  description text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read flags" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage flags" ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));