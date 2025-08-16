-- Fix RLS policies for company_profiles table to allow super_admin access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can insert their own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can update their own company profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can delete their own company profile" ON public.company_profiles;

-- Create new policies that allow super_admin access and user access
CREATE POLICY "Users and super admins can view company profiles" 
ON public.company_profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  is_super_admin_user()
);

CREATE POLICY "Users and super admins can insert company profiles" 
ON public.company_profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  is_super_admin_user()
);

CREATE POLICY "Users and super admins can update company profiles" 
ON public.company_profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  is_super_admin_user()
)
WITH CHECK (
  auth.uid() = user_id OR 
  is_super_admin_user()
);

CREATE POLICY "Users and super admins can delete company profiles" 
ON public.company_profiles 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  is_super_admin_user()
);