-- Fix RLS policies for api_keys table to ensure users can read their own keys

-- First, drop existing conflicting policies if any
DROP POLICY IF EXISTS "Super admins have full access to api_keys" ON public.api_keys;

-- Ensure users can properly read their own API keys
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
CREATE POLICY "Users can view their own API keys" 
ON public.api_keys 
FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure users can insert their own API keys  
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.api_keys;
CREATE POLICY "Users can insert their own API keys" 
ON public.api_keys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure users can update their own API keys
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
CREATE POLICY "Users can update their own API keys" 
ON public.api_keys 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Ensure users can delete their own API keys
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
CREATE POLICY "Users can delete their own API keys" 
ON public.api_keys 
FOR DELETE 
USING (auth.uid() = user_id);

-- Keep service role access for edge functions
DROP POLICY IF EXISTS "Service role full access on API keys" ON public.api_keys;
CREATE POLICY "Service role full access on API keys" 
ON public.api_keys 
FOR ALL 
USING (auth.role() = 'service_role');

-- Keep super admin access
DROP POLICY IF EXISTS "Super admin can manage all API keys" ON public.api_keys;
CREATE POLICY "Super admin can manage all API keys" 
ON public.api_keys 
FOR ALL 
USING (((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR (get_user_role(auth.uid()) = 'super_admin'::text) OR (auth.role() = 'service_role'::text));