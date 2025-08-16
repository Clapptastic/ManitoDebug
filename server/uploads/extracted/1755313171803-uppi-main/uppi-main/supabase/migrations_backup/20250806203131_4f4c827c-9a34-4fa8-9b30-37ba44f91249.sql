-- Comprehensive fix for all RLS policies to ensure proper access
-- First, ensure RLS is enabled on all tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_function_metrics ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Enable all access for service role" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can view their own analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can insert their own analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON competitor_analyses;

DROP POLICY IF EXISTS "Enable all access for service role on progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON competitor_analysis_progress;
DROP POLICY IF EXISTS "Users can delete their own progress" ON competitor_analysis_progress;

-- API Keys policies
DROP POLICY IF EXISTS "Service role full access on API keys" ON api_keys;
DROP POLICY IF EXISTS "Super admin can manage all API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view their own API keys" ON api_keys;

-- Documents policies
DROP POLICY IF EXISTS "Service role full access to documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;

-- Company profiles policies
DROP POLICY IF EXISTS "Admins can manage all company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Users can insert their own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can update their own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can view their own company profile" ON company_profiles;

-- Business plans policies
DROP POLICY IF EXISTS "Users can delete their own business plans" ON business_plans;
DROP POLICY IF EXISTS "Users can manage their own business plans" ON business_plans;

-- Edge function metrics policies
DROP POLICY IF EXISTS "Admins can view edge function metrics" ON edge_function_metrics;

-- Create simplified, working policies for competitor_analyses
CREATE POLICY "authenticated_users_full_access_competitor_analyses" ON competitor_analyses
  FOR ALL USING (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  ) WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  );

CREATE POLICY "service_role_full_access_competitor_analyses" ON competitor_analyses
  FOR ALL USING (auth.role() = 'service_role');

-- Create simplified, working policies for competitor_analysis_progress
CREATE POLICY "authenticated_users_full_access_progress" ON competitor_analysis_progress
  FOR ALL USING (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  ) WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  );

CREATE POLICY "service_role_full_access_progress" ON competitor_analysis_progress
  FOR ALL USING (auth.role() = 'service_role');

-- Create simplified, working policies for api_keys
CREATE POLICY "authenticated_users_full_access_api_keys" ON api_keys
  FOR ALL USING (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  ) WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  );

CREATE POLICY "service_role_full_access_api_keys" ON api_keys
  FOR ALL USING (auth.role() = 'service_role');

-- Create simplified, working policies for documents
CREATE POLICY "authenticated_users_full_access_documents" ON documents
  FOR ALL USING (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  ) WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  );

CREATE POLICY "service_role_full_access_documents" ON documents
  FOR ALL USING (auth.role() = 'service_role');

-- Create simplified, working policies for company_profiles
CREATE POLICY "authenticated_users_full_access_company_profiles" ON company_profiles
  FOR ALL USING (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  ) WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  );

CREATE POLICY "service_role_full_access_company_profiles" ON company_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Create simplified, working policies for business_plans
CREATE POLICY "authenticated_users_full_access_business_plans" ON business_plans
  FOR ALL USING (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  ) WITH CHECK (
    auth.role() = 'authenticated' AND auth.uid() = user_id
  );

CREATE POLICY "service_role_full_access_business_plans" ON business_plans
  FOR ALL USING (auth.role() = 'service_role');

-- Create simplified, working policies for edge_function_metrics
CREATE POLICY "authenticated_users_insert_edge_metrics" ON edge_function_metrics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "service_role_full_access_edge_metrics" ON edge_function_metrics
  FOR ALL USING (auth.role() = 'service_role');