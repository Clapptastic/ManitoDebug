-- Fix RLS policies for competitor_analyses table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can create their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON public.competitor_analyses;

-- Enable RLS on competitor_analyses table
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for competitor_analyses
CREATE POLICY "Users can view their own competitor analyses" 
ON public.competitor_analyses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitor analyses" 
ON public.competitor_analyses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitor analyses" 
ON public.competitor_analyses 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitor analyses" 
ON public.competitor_analyses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role access for all operations
CREATE POLICY "Service role full access to competitor_analyses" 
ON public.competitor_analyses 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Also fix profiles table RLS if it doesn't exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role access for all operations
CREATE POLICY "Service role full access to profiles" 
ON public.profiles 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');