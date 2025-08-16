-- Fix RLS policies for company_profiles table
-- Drop existing policy and recreate with proper permissions

DROP POLICY IF EXISTS "Users can manage their own company profile" ON public.company_profiles;

-- Create separate policies for better clarity and debugging
CREATE POLICY "Users can view their own company profile" 
ON public.company_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company profile" 
ON public.company_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company profile" 
ON public.company_profiles 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company profile" 
ON public.company_profiles 
FOR DELETE 
USING (auth.uid() = user_id);