-- Fix RLS policies for competitor_analyses table
-- First, ensure RLS is enabled
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can create their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON public.competitor_analyses;

-- Create comprehensive RLS policies for competitor_analyses
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

-- Fix RLS policies for documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for company_profiles table
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can create their own company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can update their own company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can delete their own company profiles" ON public.company_profiles;

CREATE POLICY "Users can view their own company profiles" 
ON public.company_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own company profiles" 
ON public.company_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company profiles" 
ON public.company_profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company profiles" 
ON public.company_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for business_plans table  
ALTER TABLE public.business_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own business plans" ON public.business_plans;
DROP POLICY IF EXISTS "Users can create their own business plans" ON public.business_plans;
DROP POLICY IF EXISTS "Users can update their own business plans" ON public.business_plans;
DROP POLICY IF EXISTS "Users can delete their own business plans" ON public.business_plans;

CREATE POLICY "Users can view their own business plans" 
ON public.business_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business plans" 
ON public.business_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business plans" 
ON public.business_plans 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business plans" 
ON public.business_plans 
FOR DELETE 
USING (auth.uid() = user_id);