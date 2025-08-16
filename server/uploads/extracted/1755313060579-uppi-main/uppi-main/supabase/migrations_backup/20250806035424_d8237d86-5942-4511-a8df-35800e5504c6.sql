-- Create missing tables that frontend is trying to access and fix RLS policies

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for profiles updated_at
CREATE OR REPLACE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix company_profiles RLS policies (already exists but may have issues)
DROP POLICY IF EXISTS "Users can view their own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can update their own company profile" ON company_profiles;
DROP POLICY IF EXISTS "Users can insert their own company profile" ON company_profiles;

CREATE POLICY "Users can view their own company profile" 
ON public.company_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own company profile" 
ON public.company_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company profile" 
ON public.company_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix competitor_analyses RLS policies to allow proper access
DROP POLICY IF EXISTS "Users can view their own analyses" ON competitor_analyses;
CREATE POLICY "Users can view their own analyses" 
ON public.competitor_analyses FOR SELECT 
USING (auth.uid() = user_id);

-- Fix documents RLS policies to allow proper access  
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents" 
ON public.documents FOR SELECT 
USING (auth.uid() = user_id);

-- Fix documentation RLS policies
DROP POLICY IF EXISTS "Users can view their own documentation" ON documentation;
CREATE POLICY "Users can view their own documentation" 
ON public.documentation FOR SELECT 
USING (auth.uid() = user_id);