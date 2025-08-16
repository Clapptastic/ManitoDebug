-- Update admin-api edge function to properly use service role for admin queries
-- Also add missing platform_roles table and update RLS policies

-- Create platform_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on platform_roles
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Update RLS policies to allow service role access for admin operations
-- This is needed for the admin-api edge function to work properly

-- Update profiles table policy for admin access
DROP POLICY IF EXISTS "Super admin and users can manage profiles" ON public.profiles;
CREATE POLICY "Super admin and service role can manage profiles" 
ON public.profiles
FOR ALL
USING (
  (auth.uid() = user_id) OR 
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- Update competitor_analyses table policy for admin access
DROP POLICY IF EXISTS "Super admin and users can manage analyses" ON public.competitor_analyses;
CREATE POLICY "Super admin and service role can manage analyses" 
ON public.competitor_analyses
FOR ALL
USING (
  (auth.uid() = user_id) OR 
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = 'super_admin') OR
  (auth.role() = 'service_role')
);

-- Update api_metrics table policy for admin access
DROP POLICY IF EXISTS "Super admin can view all api metrics" ON public.api_metrics;
CREATE POLICY "Super admin and service role can view all api metrics" 
ON public.api_metrics
FOR ALL
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- Update api_usage_costs table policy for admin access
DROP POLICY IF EXISTS "Super admin can view all api costs" ON public.api_usage_costs;
CREATE POLICY "Super admin and service role can view all api costs" 
ON public.api_usage_costs
FOR ALL
USING (
  (auth.uid() = user_id) OR 
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- Add platform_roles policies
CREATE POLICY "Service role can manage platform roles" 
ON public.platform_roles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Super admin can manage platform roles" 
ON public.platform_roles
FOR ALL
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = 'super_admin')
);

-- Create updated_at trigger for platform_roles
CREATE TRIGGER update_platform_roles_updated_at
  BEFORE UPDATE ON public.platform_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();