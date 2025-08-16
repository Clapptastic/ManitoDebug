-- Fix RLS policies for business_tools_usage table
-- First, let's check current policies and fix them

-- Drop existing policies that might be problematic
DROP POLICY IF EXISTS "Service role full access to business tools usage" ON business_tools_usage;
DROP POLICY IF EXISTS "Users can manage their own business tools usage" ON business_tools_usage;

-- Create comprehensive RLS policies for business_tools_usage
CREATE POLICY "business_tools_usage_user_access" 
ON business_tools_usage 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "business_tools_usage_service_access" 
ON business_tools_usage 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

-- Fix RLS policies for api_usage_costs table
DROP POLICY IF EXISTS "Super admin and service role can view all api costs" ON api_usage_costs;
DROP POLICY IF EXISTS "Users can insert their own API costs" ON api_usage_costs;
DROP POLICY IF EXISTS "Users can view their own API costs" ON api_usage_costs;

CREATE POLICY "api_usage_costs_user_access" 
ON api_usage_costs 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_usage_costs_service_access" 
ON api_usage_costs 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "api_usage_costs_admin_access" 
ON api_usage_costs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Fix RLS policies for competitor_analyses table  
DROP POLICY IF EXISTS "Service role full access to competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can manage their own competitor analyses" ON competitor_analyses;

CREATE POLICY "competitor_analyses_user_access" 
ON competitor_analyses 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competitor_analyses_service_access" 
ON competitor_analyses 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

-- Ensure we have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_tools_usage_user_id ON business_tools_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_business_tools_usage_tool_name ON business_tools_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_user_id ON api_usage_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_id ON competitor_analyses(user_id);