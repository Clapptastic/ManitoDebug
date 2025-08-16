-- Check if RLS policies exist and recreate them properly
-- First check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('competitor_analyses', 'api_keys', 'documents', 'company_profiles', 'business_plans');

-- Drop and recreate all problematic policies
DROP POLICY IF EXISTS "Users can manage their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Service role full access to API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can manage their own competitor analyses" ON competitor_analyses;
DROP POLICY IF EXISTS "Service role full access to competitor analyses" ON competitor_analyses;

-- Create working policies for api_keys
CREATE POLICY "Enable full access for users on their own api_keys" 
ON api_keys 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable service role access for api_keys" 
ON api_keys 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Create working policies for competitor_analyses  
CREATE POLICY "Enable full access for users on their own competitor_analyses" 
ON competitor_analyses 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable service role access for competitor_analyses" 
ON competitor_analyses 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Also fix other tables that are showing 403 errors
-- Documents table
DROP POLICY IF EXISTS "documents_user_access" ON documents;
DROP POLICY IF EXISTS "documents_service_access" ON documents;

CREATE POLICY "Enable full access for users on their own documents" 
ON documents 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable service role access for documents" 
ON documents 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Company profiles table
DROP POLICY IF EXISTS "authenticated_users_full_access_company_profiles" ON company_profiles;
DROP POLICY IF EXISTS "service_role_full_access_company_profiles" ON company_profiles;

CREATE POLICY "Enable full access for users on their own company_profiles" 
ON company_profiles 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable service role access for company_profiles" 
ON company_profiles 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Business plans table
DROP POLICY IF EXISTS "business_plans_user_access" ON business_plans;
DROP POLICY IF EXISTS "business_plans_service_access" ON business_plans;

CREATE POLICY "Enable full access for users on their own business_plans" 
ON business_plans 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable service role access for business_plans" 
ON business_plans 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);