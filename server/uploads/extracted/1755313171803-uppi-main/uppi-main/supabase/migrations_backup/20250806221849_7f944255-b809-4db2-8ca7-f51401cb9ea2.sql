-- Create a simple test function to verify authentication is working correctly
-- This will be used to test if the auth context flows properly through API calls

CREATE OR REPLACE FUNCTION test_auth_and_permissions()
RETURNS TABLE(
  auth_user_id TEXT,
  auth_role TEXT,
  can_read_api_keys BOOLEAN,
  api_key_count INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(auth.uid()::TEXT, 'NULL') as auth_user_id,
    COALESCE(auth.role()::TEXT, 'NULL') as auth_role,
    (SELECT COUNT(*) > 0 FROM api_keys WHERE user_id = auth.uid()) as can_read_api_keys,
    (SELECT COUNT(*)::INTEGER FROM api_keys WHERE user_id = auth.uid()) as api_key_count;
$$;