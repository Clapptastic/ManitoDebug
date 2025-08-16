-- Add missing columns to competitor_analyses table
ALTER TABLE public.competitor_analyses 
ADD COLUMN IF NOT EXISTS market_sentiment_score NUMERIC DEFAULT 0;

-- Add missing columns to master_company_profiles table  
ALTER TABLE public.master_company_profiles 
ADD COLUMN IF NOT EXISTS normalized_name TEXT,
ADD COLUMN IF NOT EXISTS overall_confidence_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_completeness_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS source_analyses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_validation_date TIMESTAMP WITH TIME ZONE DEFAULT now();