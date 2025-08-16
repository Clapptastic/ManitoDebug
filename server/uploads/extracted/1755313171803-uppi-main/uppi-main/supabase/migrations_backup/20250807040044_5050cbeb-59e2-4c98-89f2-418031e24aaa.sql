-- Fix remaining RLS policy issues for multiple tables

-- Fix business_plans RLS policies
DROP POLICY IF EXISTS "Service role full access to business plans" ON business_plans;
DROP POLICY IF EXISTS "Users can manage their own business plans" ON business_plans;

CREATE POLICY "Users can manage their own business plans" 
ON business_plans 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to business plans" 
ON business_plans 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix company_profiles RLS policies
DROP POLICY IF EXISTS "Service role full access to company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Users can manage their own company profiles" ON company_profiles;

CREATE POLICY "Users can manage their own company profiles" 
ON company_profiles 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to company profiles" 
ON company_profiles 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix documents RLS policies  
DROP POLICY IF EXISTS "Enable full access for users on their own documents" ON documents;
DROP POLICY IF EXISTS "Enable service role access for documents" ON documents;

CREATE POLICY "Users can manage their own documents" 
ON documents 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to documents" 
ON documents 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix edge_function_metrics RLS policies
DROP POLICY IF EXISTS "Service role can manage edge function metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "authenticated_users_insert_edge_metrics" ON edge_function_metrics;
DROP POLICY IF EXISTS "service_role_full_access_edge_metrics" ON edge_function_metrics;

CREATE POLICY "Users can manage their own edge function metrics" 
ON edge_function_metrics 
FOR ALL 
USING (auth.uid() = user_id OR auth.role() = 'service_role')
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role full access to edge function metrics" 
ON edge_function_metrics 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');