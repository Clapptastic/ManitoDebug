-- Ensure the competitor_analyses table has proper structure and permissions
-- Add missing columns if they don't exist and fix any issues

-- First, ensure the table exists with all required fields
CREATE TABLE IF NOT EXISTS public.competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending'::text,
  analysis_data JSONB DEFAULT '{}'::jsonb,
  api_responses JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Additional fields for compatibility
  website_url TEXT,
  industry TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  employee_count INTEGER,
  business_model TEXT,
  target_market TEXT[],
  pricing_strategy JSONB DEFAULT '{}'::jsonb,
  funding_info JSONB DEFAULT '{}'::jsonb,
  revenue_estimate NUMERIC DEFAULT 0,
  market_position TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],
  threats TEXT[],
  competitive_advantages TEXT[],
  data_completeness_score NUMERIC DEFAULT 0,
  data_quality_score NUMERIC DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies to ensure they work correctly
DROP POLICY IF EXISTS "Users can view their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can insert their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can update their own competitor analyses" ON public.competitor_analyses;
DROP POLICY IF EXISTS "Users can delete their own competitor analyses" ON public.competitor_analyses;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own competitor analyses" 
ON public.competitor_analyses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competitor analyses" 
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

-- Create trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.update_competitor_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.data_completeness_score = calculate_data_completeness_score(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_competitor_analyses_updated_at ON public.competitor_analyses;
CREATE TRIGGER update_competitor_analyses_updated_at
  BEFORE UPDATE ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_competitor_analyses_updated_at();

-- Create trigger for setting data completeness score on insert
DROP TRIGGER IF EXISTS set_competitor_analyses_data_completeness ON public.competitor_analyses;
CREATE TRIGGER set_competitor_analyses_data_completeness
  BEFORE INSERT ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_competitor_analyses_updated_at();