-- Fix the syntax error and create a proper debug function
CREATE OR REPLACE FUNCTION debug_auth_context() 
RETURNS TABLE(
  current_user_id TEXT,
  current_role_name TEXT,
  is_authenticated BOOLEAN
) 
LANGUAGE SQL 
SECURITY DEFINER 
AS $$
  SELECT 
    COALESCE(auth.uid()::TEXT, 'NULL') as current_user_id,
    COALESCE(auth.role()::TEXT, 'NULL') as current_role_name,
    (auth.role() = 'authenticated') as is_authenticated;
$$;

-- Test this function
SELECT * FROM debug_auth_context();