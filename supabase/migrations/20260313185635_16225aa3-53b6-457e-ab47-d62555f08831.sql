ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_agent';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';