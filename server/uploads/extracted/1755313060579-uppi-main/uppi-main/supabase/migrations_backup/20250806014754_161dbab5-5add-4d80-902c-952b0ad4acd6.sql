-- Fix RLS policies for admin tables to allow super admin access

-- Update RLS policy for admin_api_keys to include super admin check
DROP POLICY IF EXISTS "Super admin can manage all admin API keys" ON admin_api_keys;
CREATE POLICY "Super admin can manage all admin API keys" ON admin_api_keys
FOR ALL USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

-- Update RLS policy for admin_api_usage_tracking to include super admin check  
DROP POLICY IF EXISTS "Super admin can manage all admin API usage" ON admin_api_usage_tracking;
CREATE POLICY "Super admin can manage all admin API usage" ON admin_api_usage_tracking
FOR ALL USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

-- Update RLS policy for edge_function_metrics to include super admin check
DROP POLICY IF EXISTS "Super admin can manage all function metrics" ON edge_function_metrics;
CREATE POLICY "Super admin can manage all function metrics" ON edge_function_metrics
FOR ALL USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);

-- Ensure service role can insert into edge_function_metrics for system logging
DROP POLICY IF EXISTS "Service role can insert function metrics" ON edge_function_metrics;
CREATE POLICY "Service role can insert function metrics" ON edge_function_metrics
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Update api_keys table to allow super admin access
DROP POLICY IF EXISTS "Super admin can manage all API keys" ON api_keys;
CREATE POLICY "Super admin can manage all API keys" ON api_keys
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);