-- Fix RLS policies for competitor analysis tables to allow authenticated users to access their own data

-- Drop existing policies if they exist and recreate with proper permissions
DROP POLICY IF EXISTS "Enable full access for users on their own competitor_analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Enable service role access for competitor_analyses" ON public.competitor_analyses;

-- Create comprehensive policies for competitor_analyses
CREATE POLICY "Users can manage their own competitor analyses"
ON public.competitor_analyses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to competitor analyses"
ON public.competitor_analyses
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix company_profiles policies
DROP POLICY IF EXISTS "Enable full access for users on their own company_profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Enable service role access for company_profiles" ON public.company_profiles;

CREATE POLICY "Users can manage their own company profiles"
ON public.company_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to company profiles"
ON public.company_profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix business_plans policies
DROP POLICY IF EXISTS "Enable full access for users on their own business_plans" ON public.business_plans;
DROP POLICY IF EXISTS "Enable service role access for business_plans" ON public.business_plans;

CREATE POLICY "Users can manage their own business plans"
ON public.business_plans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to business plans"
ON public.business_plans
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');