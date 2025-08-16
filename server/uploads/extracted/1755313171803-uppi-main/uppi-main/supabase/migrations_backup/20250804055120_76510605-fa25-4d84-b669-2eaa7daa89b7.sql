-- Set samdyer27@gmail.com as super admin by calling the edge function
-- First, let's add the super_admin role to the platform_roles table for the user

-- Find the user ID for samdyer27@gmail.com
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID from profiles table
    SELECT id INTO target_user_id 
    FROM profiles 
    WHERE email = 'samdyer27@gmail.com';
    
    -- Insert super_admin role if user found and doesn't already have it
    IF target_user_id IS NOT NULL THEN
        INSERT INTO platform_roles (user_id, role)
        VALUES (target_user_id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Also update the profile role to super_admin for consistency
        UPDATE profiles 
        SET role = 'super_admin', updated_at = now()
        WHERE id = target_user_id;
        
        RAISE NOTICE 'Successfully set samdyer27@gmail.com as super_admin';
    ELSE
        RAISE NOTICE 'User samdyer27@gmail.com not found in profiles table';
    END IF;
END $$;

-- Update RLS policies for master_company_profiles to only allow super_admin access
DROP POLICY IF EXISTS "Super admins can manage master company profiles" ON master_company_profiles;
DROP POLICY IF EXISTS "Users can view master company profiles" ON master_company_profiles;

-- Create new policy that only allows super_admin access
CREATE POLICY "Only super admins can access master company profiles"
ON master_company_profiles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
    OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Also secure related tables for super admin only
DROP POLICY IF EXISTS "Super admins can view merge history" ON company_profile_merges;
CREATE POLICY "Only super admins can view merge history"
ON company_profile_merges
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
    OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admins can view confidence history" ON confidence_history;
CREATE POLICY "Only super admins can view confidence history"
ON confidence_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
    OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

DROP POLICY IF EXISTS "Super admins can view all validation logs" ON data_validation_logs;
CREATE POLICY "Only super admins can view validation logs"
ON data_validation_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM platform_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
    OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Create a security definer function to check if user is super admin (to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
$$;