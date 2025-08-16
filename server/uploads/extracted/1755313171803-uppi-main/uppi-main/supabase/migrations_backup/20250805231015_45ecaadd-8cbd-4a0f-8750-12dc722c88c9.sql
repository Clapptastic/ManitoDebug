-- Add missing ai_analysis_data column to company_profiles table
-- This column stores AI-generated analysis data for company profiles

ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS ai_analysis_data JSONB DEFAULT '{}';

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.company_profiles.ai_analysis_data IS 'Stores AI-generated analysis data including market insights, business model analysis, and other AI-powered assessments';