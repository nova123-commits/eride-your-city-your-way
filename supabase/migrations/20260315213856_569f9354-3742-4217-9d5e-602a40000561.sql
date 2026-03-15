
-- Fix surge_rules: the ALL policy already restricts write to admins, 
-- and SELECT with true is fine for read-only. No action needed.
-- But let's split the ALL policy to be explicit and remove ambiguity.
DROP POLICY IF EXISTS "Authenticated read surge rules" ON public.surge_rules;
DROP POLICY IF EXISTS "Admins manage surge rules" ON public.surge_rules;

CREATE POLICY "Anyone can read surge rules" ON public.surge_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert surge rules" ON public.surge_rules
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update surge rules" ON public.surge_rules
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete surge rules" ON public.surge_rules
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
