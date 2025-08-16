-- Master Company Profiles System - Fixed
-- This system aggregates and improves company data from all competitor analyses

-- Master company profiles table
CREATE TABLE IF NOT EXISTS public.master_company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core Identity
  company_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL, -- For matching
  website_url TEXT,
  domain TEXT, -- Extracted domain for matching
  
  -- Company Information (aggregated from all analyses)
  industry TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  employee_count INTEGER,
  business_model TEXT,
  
  -- SWOT Analysis (consensus from multiple analyses)
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],
  threats TEXT[],
  
  -- Market & Strategy
  market_position TEXT,
  target_market TEXT[],
  customer_segments TEXT[],
  geographic_presence TEXT[],
  market_share_estimate NUMERIC,
  competitive_advantages TEXT[],
  
  -- Financial Data
  revenue_estimate NUMERIC,
  funding_info JSONB DEFAULT '{}',
  pricing_strategy JSONB DEFAULT '{}',
  
  -- Technology & Innovation
  technology_stack TEXT[],
  patent_count INTEGER,
  innovation_score NUMERIC,
  
  -- Social & Governance
  social_media_presence JSONB DEFAULT '{}',
  key_personnel JSONB DEFAULT '{}',
  esg_data JSONB DEFAULT '{}',
  
  -- Aggregation Metrics
  total_analyses INTEGER DEFAULT 0,
  last_analysis_date TIMESTAMP WITH TIME ZONE,
  data_quality_score NUMERIC DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  completeness_score NUMERIC DEFAULT 0,
  
  -- AI Enhancement Tracking
  ai_enhancement_count INTEGER DEFAULT 0,
  last_ai_enhancement TIMESTAMP WITH TIME ZONE,
  ai_confidence_scores JSONB DEFAULT '{}',
  
  -- Source Attribution
  contributing_users UUID[],
  source_analyses UUID[],
  verification_status TEXT DEFAULT 'unverified',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint separately
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_profiles_unique_company 
ON public.master_company_profiles(normalized_name) 
WHERE domain IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_master_profiles_unique_domain 
ON public.master_company_profiles(domain) 
WHERE domain IS NOT NULL;

-- Profile field contributions - tracks individual field updates
CREATE TABLE IF NOT EXISTS public.profile_field_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  
  -- Source Information
  analysis_id UUID REFERENCES public.competitor_analyses(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  provider TEXT, -- AI provider that generated this data
  
  -- Field Information
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  confidence_score NUMERIC,
  
  -- Validation
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT,
  verification_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profile quality metrics - tracks data quality over time
CREATE TABLE IF NOT EXISTS public.profile_quality_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  
  -- Quality Scores
  completeness_score NUMERIC NOT NULL,
  accuracy_score NUMERIC NOT NULL,
  freshness_score NUMERIC NOT NULL,
  consensus_score NUMERIC NOT NULL,
  
  -- Field-level Quality
  field_quality_scores JSONB DEFAULT '{}',
  field_confidence_scores JSONB DEFAULT '{}',
  field_last_updated JSONB DEFAULT '{}',
  
  -- Source Analysis
  source_diversity_score NUMERIC, -- How many different sources/users contributed
  temporal_consistency_score NUMERIC, -- How consistent data is across time
  
  -- AI Enhancement Impact
  ai_improvement_score NUMERIC DEFAULT 0,
  ai_suggestions JSONB DEFAULT '{}',
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  calculation_version TEXT DEFAULT '1.0'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_profiles_normalized_name ON public.master_company_profiles(normalized_name);
CREATE INDEX IF NOT EXISTS idx_master_profiles_domain ON public.master_company_profiles(domain);
CREATE INDEX IF NOT EXISTS idx_master_profiles_industry ON public.master_company_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_master_profiles_updated_at ON public.master_company_profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_master_profiles_quality_score ON public.master_company_profiles(data_quality_score);

CREATE INDEX IF NOT EXISTS idx_field_contributions_profile_id ON public.profile_field_contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_field_contributions_analysis_id ON public.profile_field_contributions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_field_contributions_field_name ON public.profile_field_contributions(field_name);

CREATE INDEX IF NOT EXISTS idx_quality_metrics_profile_id ON public.profile_quality_metrics(profile_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_calculated_at ON public.profile_quality_metrics(calculated_at);

-- Enable Row Level Security
ALTER TABLE public.master_company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_field_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_quality_metrics ENABLE ROW LEVEL SECURITY;