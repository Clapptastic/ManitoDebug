-- Fix RLS policies for competitor analysis system
-- This migration addresses permission denied errors by ensuring proper RLS policies

-- First, let's ensure the get_user_competitor_analyses function works correctly
CREATE OR REPLACE FUNCTION public.get_user_competitor_analyses(user_id_param uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  website_url text,
  industry text,
  description text,
  employee_count integer,
  founded_year integer,
  headquarters text,
  business_model text,
  target_market text[],
  strengths text[],
  weaknesses text[],
  opportunities text[],
  threats text[],
  pricing_strategy jsonb,
  funding_info jsonb,
  social_media_presence jsonb,
  market_position text,
  analysis_data jsonb,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  completed_at timestamp with time zone,
  data_quality_score numeric,
  data_completeness_score numeric,
  market_sentiment_score numeric,
  actual_cost numeric,
  session_id text,
  analysis_id text
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user
  current_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Return empty if no user
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return user's competitor analyses
  RETURN QUERY
  SELECT 
    ca.id,
    ca.user_id,
    ca.name,
    ca.website_url,
    ca.industry,
    ca.description,
    ca.employee_count,
    ca.founded_year,
    ca.headquarters,
    ca.business_model,
    ca.target_market,
    ca.strengths,
    ca.weaknesses,
    ca.opportunities,
    ca.threats,
    ca.pricing_strategy,
    ca.funding_info,
    ca.social_media_presence,
    ca.market_position,
    ca.analysis_data,
    ca.status,
    ca.created_at,
    ca.updated_at,
    ca.completed_at,
    ca.data_quality_score,
    ca.data_completeness_score,
    ca.market_sentiment_score,
    ca.actual_cost,
    ca.session_id,
    ca.analysis_id
  FROM public.competitor_analyses ca
  WHERE ca.user_id = current_user_id
  ORDER BY ca.created_at DESC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_competitor_analyses(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_competitor_analyses(uuid) TO anon;

-- Ensure RLS is enabled on competitor_analyses
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;

-- Update the select policy for competitor_analyses to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can view their own competitor analyses" ON public.competitor_analyses;
CREATE POLICY "Users can view their own competitor analyses" 
ON public.competitor_analyses 
FOR SELECT 
TO authenticated, anon
USING (
  auth.uid() = user_id OR 
  auth.role() = 'service_role'::text
);

-- Update insert policy
DROP POLICY IF EXISTS "Users can create their own competitor analyses" ON public.competitor_analyses;
CREATE POLICY "Users can create their own competitor analyses" 
ON public.competitor_analyses 
FOR INSERT 
TO authenticated, anon, service_role
WITH CHECK (
  auth.uid() = user_id OR 
  auth.role() = 'service_role'::text
);

-- Update update policy
DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON public.competitor_analyses;
CREATE POLICY "Users can update their own competitor analyses" 
ON public.competitor_analyses 
FOR UPDATE 
TO authenticated, anon, service_role
USING (
  auth.uid() = user_id OR 
  auth.role() = 'service_role'::text
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.role() = 'service_role'::text
);

-- Update delete policy
DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON public.competitor_analyses;
CREATE POLICY "Users can delete their own competitor analyses" 
ON public.competitor_analyses 
FOR DELETE 
TO authenticated, anon, service_role
USING (
  auth.uid() = user_id OR 
  auth.role() = 'service_role'::text
);

-- Add service role policy for full access
CREATE POLICY "Service role full access to competitor analyses" 
ON public.competitor_analyses 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Fix api_usage_costs table permissions
ALTER TABLE public.api_usage_costs ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles access - this table seems to be missing basic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated, anon
USING (auth.uid() = user_id);

-- Create policy for profiles insert
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated, anon
WITH CHECK (auth.uid() = user_id);

-- Create policy for profiles update
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated, anon
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add service role access to profiles
CREATE POLICY "Service role full access to profiles" 
ON public.profiles 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);