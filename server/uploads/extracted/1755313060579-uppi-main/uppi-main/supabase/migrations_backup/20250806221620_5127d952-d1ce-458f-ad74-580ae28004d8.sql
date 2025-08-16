-- The issue might be that the frontend queries are not properly authenticated
-- Let's check if there are any session/auth issues by testing with a fresh policy
-- First, let's see if we can identify the exact issue

-- Check current auth context in policies
CREATE OR REPLACE FUNCTION debug_auth_context() 
RETURNS TABLE(
  current_user_id TEXT,
  current_role TEXT,
  is_authenticated BOOLEAN
) 
LANGUAGE SQL 
SECURITY DEFINER 
AS $$
  SELECT 
    COALESCE(auth.uid()::TEXT, 'NULL') as current_user_id,
    COALESCE(auth.role()::TEXT, 'NULL') as current_role,
    (auth.role() = 'authenticated') as is_authenticated;
$$;

-- Test this function to see what the auth context looks like
SELECT * FROM debug_auth_context();