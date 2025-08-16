-- Fix the critical RLS policy issue - corrected version without IF NOT EXISTS
-- The function is using service role key but policies are not allowing access

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Super admin can manage all API keys" ON api_keys;
DROP POLICY IF EXISTS "Service role and admin can manage all API keys" ON api_keys;

-- Create comprehensive RLS policies for api_keys table
-- Users can view their own API keys
CREATE POLICY "Users can view their own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can insert their own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update their own API keys" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Service role and admin access - CRITICAL: This allows edge functions to work
CREATE POLICY "Service role and admin can manage all API keys" ON api_keys
    FOR ALL USING (
        (auth.role() = 'service_role'::text) OR 
        ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR 
        (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]))
    );

-- Ensure RLS is enabled
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider ON api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

-- Fix edge_function_metrics table policies
DROP POLICY IF EXISTS "Service role can manage function metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "Users can view their own metrics" ON edge_function_metrics;

-- Ensure RLS is enabled on edge_function_metrics
ALTER TABLE edge_function_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for edge_function_metrics to allow service role access
CREATE POLICY "Service role can manage function metrics" ON edge_function_metrics
    FOR ALL USING (auth.role() = 'service_role'::text);

-- Create policy for users to view their own metrics
CREATE POLICY "Users can view their own metrics" ON edge_function_metrics
    FOR SELECT USING (auth.uid() = user_id);