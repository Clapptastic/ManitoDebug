-- Fix permission issues for edge_function_metrics table
GRANT ALL ON public.edge_function_metrics TO service_role;

-- Add unique constraint for api_keys table to fix ON CONFLICT issues
-- This constraint allows one API key per user per provider
ALTER TABLE public.api_keys 
ADD CONSTRAINT api_keys_user_provider_unique 
UNIQUE (user_id, provider);

-- Update RLS policy for edge_function_metrics to allow service role access
DROP POLICY IF EXISTS "edge_function_metrics_service_access" ON public.edge_function_metrics;
CREATE POLICY "edge_function_metrics_service_access" 
ON public.edge_function_metrics 
FOR ALL 
USING (
  auth.uid() = user_id OR 
  auth.jwt() ->> 'role' = 'service_role' OR
  current_setting('role') = 'service_role'
);

-- Grant realtime permissions for better channel connectivity
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT ALL ON realtime.messages TO authenticated;