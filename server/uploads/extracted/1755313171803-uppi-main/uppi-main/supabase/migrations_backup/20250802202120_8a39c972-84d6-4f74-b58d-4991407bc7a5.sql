-- Fix RLS policies for system_components table
DROP POLICY IF EXISTS "system_components_read_policy" ON public.system_components;
CREATE POLICY "system_components_read_policy" 
ON public.system_components 
FOR SELECT 
USING (true);

-- Fix RLS policies for api_keys table to allow edge functions to access
DROP POLICY IF EXISTS "api_keys_user_access" ON public.api_keys;
CREATE POLICY "api_keys_user_access" 
ON public.api_keys 
FOR ALL 
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role' OR
  current_setting('role') = 'service_role'
);

-- Ensure proper permissions for edge functions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create api_status_checks table if it doesn't exist (referenced in edge function)
CREATE TABLE IF NOT EXISTS public.api_status_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on api_status_checks
ALTER TABLE public.api_status_checks ENABLE ROW LEVEL SECURITY;

-- Create policy for api_status_checks
CREATE POLICY "api_status_checks_policy" 
ON public.api_status_checks 
FOR ALL 
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role' OR
  current_setting('role') = 'service_role'
);