-- Drop all existing conflicting policies on profiles table
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin and service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create secure and clear RLS policies for profiles table
-- Allow service role full access (for system operations)
CREATE POLICY "Service role full access on profiles"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role'::text);

-- Allow super admins to manage all profiles (for user management)
CREATE POLICY "Super admin can manage all profiles"
ON public.profiles
FOR ALL
USING (
  (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR
  get_user_role(auth.uid()) = 'super_admin'::text OR
  auth.role() = 'service_role'::text
);

-- Allow regular admins to view all profiles but only update non-super-admin profiles
CREATE POLICY "Admin can view all profiles"
ON public.profiles
FOR SELECT
USING (
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text]) OR
  auth.uid() = user_id OR
  auth.role() = 'service_role'::text
);

CREATE POLICY "Admin can update non-super-admin profiles"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR
  (get_user_role(auth.uid()) = 'admin'::text AND role != 'super_admin') OR
  get_user_role(auth.uid()) = 'super_admin'::text OR
  auth.role() = 'service_role'::text
);

-- Allow users to manage their own profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);