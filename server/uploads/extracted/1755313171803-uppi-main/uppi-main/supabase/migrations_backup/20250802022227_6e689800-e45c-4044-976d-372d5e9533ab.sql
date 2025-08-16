-- Fix database permissions and RLS policies
-- Enable RLS on api_keys table if not already enabled
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate with proper permissions
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;

-- Create comprehensive RLS policy for api_keys
CREATE POLICY "Users can manage their own API keys" 
ON public.api_keys 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Ensure user_id column is not nullable to prevent RLS bypass
ALTER TABLE public.api_keys ALTER COLUMN user_id SET NOT NULL;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- Ensure other tables also have proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_roles TO authenticated;

-- Enable RLS on other critical tables if not enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;