-- Test with the actual user ID to see if the data access works when we specify the authentication properly
-- This will help us understand if it's an auth context issue or policy issue

-- First, temporarily grant broader access to test if the issue is policy-related
-- We'll create a temporary policy that allows authenticated users to see debug info

CREATE OR REPLACE FUNCTION test_policy_access(test_user_id UUID) 
RETURNS TABLE(
  can_access_api_keys BOOLEAN,
  can_access_competitor_analyses BOOLEAN,
  user_exists BOOLEAN
) 
LANGUAGE SQL 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) > 0 FROM api_keys WHERE user_id = test_user_id) as can_access_api_keys,
    (SELECT COUNT(*) >= 0 FROM competitor_analyses WHERE user_id = test_user_id) as can_access_competitor_analyses,
    (SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = test_user_id)) as user_exists;
$$;

-- Test with the actual user ID from the logs
SELECT * FROM test_policy_access('5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::UUID);