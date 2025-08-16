-- Fix RLS policies for profiles table to allow admins to update user roles
-- This is needed for the "Make Admin" button in user management

-- Add policy to allow admins to update other users' profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_user_admin(auth.uid()))
  WITH CHECK (public.is_user_admin(auth.uid()));

-- Add policy to allow admins to insert new profiles if needed
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_user_admin(auth.uid()));

-- Add policy to allow super admins to manage all profiles
CREATE POLICY "Super admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_platform_role(auth.uid(), 'super_admin'));

-- Also ensure super admins can manage platform roles
CREATE POLICY "Super admins can manage platform roles"
  ON public.platform_roles FOR ALL
  TO authenticated
  USING (public.has_platform_role(auth.uid(), 'super_admin'));