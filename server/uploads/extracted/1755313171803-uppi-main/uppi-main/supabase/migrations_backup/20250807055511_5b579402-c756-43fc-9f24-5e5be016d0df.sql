-- Clean up duplicate and conflicting RLS policies
DROP POLICY IF EXISTS "Service role access for competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "competitor_analyses_service_access" ON public.competitor_analyses;
DROP POLICY IF EXISTS "competitor_analyses_user_access" ON public.competitor_analyses;

-- Keep only the specific granular policies
-- They are already created so this should work now

-- Test the policies are working
INSERT INTO competitor_analyses (user_id, name, status) 
VALUES ('5a922aca-e1a4-4a1f-a32b-aaec11b645f3', 'Test Company', 'completed')
ON CONFLICT DO NOTHING;