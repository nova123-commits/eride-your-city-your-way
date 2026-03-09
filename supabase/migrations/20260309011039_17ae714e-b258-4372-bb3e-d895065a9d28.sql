
-- Create admin_permissions table for manager to toggle admin powers
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL UNIQUE,
  can_approve_drivers boolean NOT NULL DEFAULT true,
  can_view_revenue boolean NOT NULL DEFAULT true,
  can_issue_refunds boolean NOT NULL DEFAULT false,
  can_delete_users boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manager can manage admin permissions"
  ON public.admin_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can view own permissions"
  ON public.admin_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = admin_user_id);

-- Create audit_trail table for logging admin actions
CREATE TABLE public.audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only manager can view audit trail"
  ON public.audit_trail FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Authenticated can insert audit entries"
  ON public.audit_trail FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);
