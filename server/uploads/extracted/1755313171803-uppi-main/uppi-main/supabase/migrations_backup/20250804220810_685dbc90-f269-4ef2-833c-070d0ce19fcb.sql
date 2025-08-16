-- CRITICAL SECURITY FIX: Fix documents table RLS policies

-- Drop all existing documents policies to rebuild them properly
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Super admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Create comprehensive documents policies that work correctly
CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_super_admin_user()
);

CREATE POLICY "Users can insert their own documents"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON documents
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_super_admin_user()
)
WITH CHECK (
  auth.uid() = user_id OR 
  is_super_admin_user()
);

CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_super_admin_user()
);

-- Fix API usage costs table RLS
DROP POLICY IF EXISTS "Users can view their own API usage costs" ON api_usage_costs;
DROP POLICY IF EXISTS "Users can insert their own API usage costs" ON api_usage_costs;
DROP POLICY IF EXISTS "Service role can manage api usage costs" ON api_usage_costs;
DROP POLICY IF EXISTS "Admins can view all API usage costs" ON api_usage_costs;

CREATE POLICY "Users can view their own API usage costs"
ON api_usage_costs
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_super_admin_user()
);

CREATE POLICY "Users can insert their own API usage costs"
ON api_usage_costs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role and admins can manage API usage costs"
ON api_usage_costs
FOR ALL
TO authenticated
USING (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR 
  (current_setting('role'::text) = 'service_role'::text) OR
  is_super_admin_user()
)
WITH CHECK (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR 
  (current_setting('role'::text) = 'service_role'::text) OR
  is_super_admin_user()
);

-- Add security trigger for profiles to prevent unauthorized role changes
CREATE OR REPLACE FUNCTION prevent_unauthorized_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  -- Only super admins can change roles
  IF OLD.role != NEW.role AND NOT is_super_admin_user() THEN
    RAISE EXCEPTION 'Only super admins can modify user roles';
  END IF;
  
  -- Prevent users from changing their own role to super_admin
  IF NEW.role = 'super_admin' AND auth.uid() = NEW.id AND OLD.role != 'super_admin' THEN
    RAISE EXCEPTION 'Users cannot grant themselves super admin privileges';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce role change security
DROP TRIGGER IF EXISTS enforce_role_security ON profiles;
CREATE TRIGGER enforce_role_security
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unauthorized_role_changes();