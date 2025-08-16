-- Fix RLS policies for current authentication system

-- Update competitor_analyses policies
DROP POLICY IF EXISTS "Users can manage their own competitor analyses" ON competitor_analyses;
CREATE POLICY "Users can manage their own competitor analyses" 
ON competitor_analyses 
FOR ALL 
USING (auth.uid() = user_id);

-- Update api_keys policies  
DROP POLICY IF EXISTS "Users can manage their own API keys" ON api_keys;
CREATE POLICY "Users can manage their own API keys" 
ON api_keys 
FOR ALL 
USING (auth.uid() = user_id);

-- Create profiles table policies if missing
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
ON profiles 
FOR ALL 
USING (auth.uid() = id);

-- Create public read policy for system_components
DROP POLICY IF EXISTS "Everyone can view system components" ON system_components;
CREATE POLICY "Everyone can view system components" 
ON system_components 
FOR SELECT 
USING (true);

-- Create admin policies for system management
CREATE POLICY "Super admins can manage system components" 
ON system_components 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);