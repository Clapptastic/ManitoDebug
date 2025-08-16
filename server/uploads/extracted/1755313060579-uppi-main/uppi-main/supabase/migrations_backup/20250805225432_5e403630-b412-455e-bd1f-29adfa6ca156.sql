-- Fix RLS policies for API keys functionality

-- Drop and recreate policies for api_keys table with proper access
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role and admin can manage all API keys" ON public.api_keys;

-- Create comprehensive policies for api_keys access
CREATE POLICY "Users can view their own API keys" 
ON public.api_keys FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
ON public.api_keys FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
ON public.api_keys FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
ON public.api_keys FOR DELETE 
USING (auth.uid() = user_id);

-- Service role policy for edge functions
CREATE POLICY "Service role can manage all API keys" 
ON public.api_keys FOR ALL 
USING (auth.role() = 'service_role');

-- Admin access policy
CREATE POLICY "Admins can manage all API keys" 
ON public.api_keys FOR ALL 
USING (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin'])
);

-- Fix edge_function_metrics policies
DROP POLICY IF EXISTS "Users can view their own function metrics" ON public.edge_function_metrics;
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.edge_function_metrics;
DROP POLICY IF EXISTS "Super admin can view all function metrics" ON public.edge_function_metrics;
DROP POLICY IF EXISTS "Service role can manage function metrics" ON public.edge_function_metrics;
DROP POLICY IF EXISTS "System can insert function metrics" ON public.edge_function_metrics;

-- Recreate edge function metrics policies
CREATE POLICY "Users can view their own function metrics" 
ON public.edge_function_metrics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all function metrics" 
ON public.edge_function_metrics FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "System can insert function metrics" 
ON public.edge_function_metrics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Super admin can manage all function metrics" 
ON public.edge_function_metrics FOR ALL 
USING (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR 
  get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin'])
);

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider ON public.api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON public.api_keys(status, is_active);
CREATE INDEX IF NOT EXISTS idx_edge_function_metrics_user_function ON public.edge_function_metrics(user_id, function_name);
CREATE INDEX IF NOT EXISTS idx_edge_function_metrics_created ON public.edge_function_metrics(created_at);