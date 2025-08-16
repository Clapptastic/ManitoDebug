-- Create proper auth trigger and function for automatic profile creation
-- This ensures every new user gets a profile automatically

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert into profiles table automatically
  INSERT INTO public.profiles (
    id,
    user_id, 
    email,
    full_name,
    role,
    created_at
  ) VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'user', -- Default role
    NOW()
  );
  
  -- Create default user role
  INSERT INTO public.user_roles (
    user_id,
    role,
    is_active
  ) VALUES (
    NEW.id,
    'user',
    true
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();

-- Create enhanced function for password reset with proper redirect
CREATE OR REPLACE FUNCTION public.reset_user_password(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = user_email
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Note: The actual password reset email sending is handled by Supabase Auth
  -- This function mainly serves as a validation layer
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Password reset instructions will be sent if the email exists'
  );
END;
$$;

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for profiles to ensure proper access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Allow users to view all profiles (for user lists, etc.)
CREATE POLICY "Public profiles are viewable" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow system to insert profiles (triggered by auth.users insert)
CREATE POLICY "System can insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
  auth.role() = 'service_role'
);