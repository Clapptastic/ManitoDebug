-- Fix Critical Issue #2: RLS Policy Conflicts
-- Remove conflicting policies and create unified ones

-- Drop conflicting API key policies
DROP POLICY IF EXISTS "API keys service operations only" ON public.api_keys;
DROP POLICY IF EXISTS "Users insert own api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users update own api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users view own api_keys" ON public.api_keys;

-- Create unified API key policy
CREATE POLICY "api_keys_unified_access" ON public.api_keys
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    can_access_api_key(user_id, auth.uid())
  )
  WITH CHECK (
    auth.role() = 'service_role' OR 
    auth.uid() = user_id
  );

-- Fix Critical Issue #4: Remove hardcoded admin dependencies
-- Create admin_users table for dynamic admin management
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    role text NOT NULL DEFAULT 'admin',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users policy
CREATE POLICY "super_admin_manage_admin_users" ON public.admin_users
  FOR ALL USING (
    auth.role() = 'service_role' OR
    is_super_admin((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Insert existing super admins
INSERT INTO public.admin_users (email, role, is_active) VALUES
  ('akclapp@gmail.com', 'super_admin', true),
  ('samdyer27@gmail.com', 'super_admin', true),
  ('perryrjohnson7@gmail.com', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;