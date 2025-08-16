-- Comprehensive Database Schema Audit Fix
-- Fix missing RLS policies for core tables causing permission denied errors

-- Fix documents table - missing proper RLS policies
DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;
DROP POLICY IF EXISTS "Service role access for documents" ON documents;

CREATE POLICY "Users can manage their own documents" ON documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role access for documents" ON documents FOR ALL USING (auth.role() = 'service_role');

-- Fix competitor_analyses table - add missing policies  
DROP POLICY IF EXISTS "Users can manage their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Service role access for competitor analyses" ON competitor_analyses;

CREATE POLICY "Users can manage their own competitor analyses" ON competitor_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role access for competitor analyses" ON competitor_analyses FOR ALL USING (auth.role() = 'service_role');

-- Fix company_profiles table - add missing policies
DROP POLICY IF EXISTS "Users can manage their own company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Service role access for company profiles" ON company_profiles;

CREATE POLICY "Users can manage their own company profiles" ON company_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role access for company profiles" ON company_profiles FOR ALL USING (auth.role() = 'service_role');

-- Fix edge_function_metrics table - missing policies causing insert failures
DROP POLICY IF EXISTS "Service role can manage edge function metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "Users can view their own edge function metrics" ON edge_function_metrics;

CREATE POLICY "Service role can manage edge function metrics" ON edge_function_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view their own edge function metrics" ON edge_function_metrics FOR SELECT USING (auth.uid() = user_id OR get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- Ensure all critical tables have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_id ON competitor_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_status ON competitor_analyses(status);
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_function_metrics_user_id ON edge_function_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_edge_function_metrics_created_at ON edge_function_metrics(created_at);

-- Ensure proper permissions for super admin user
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;