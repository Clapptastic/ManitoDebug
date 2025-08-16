-- Fix RLS policy for api_usage_costs table to allow proper user access
-- This addresses the "permission denied for table api_usage_costs" error

-- Update the existing user select policy to be more permissive
DROP POLICY IF EXISTS "api_usage_costs_user_select" ON public.api_usage_costs;

CREATE POLICY "api_usage_costs_user_select" 
ON public.api_usage_costs 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]) OR
  auth.role() = 'service_role'::text
);

-- Also ensure users can update their own usage records
CREATE POLICY "api_usage_costs_user_update" 
ON public.api_usage_costs 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.role() = 'service_role'::text)
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role'::text);