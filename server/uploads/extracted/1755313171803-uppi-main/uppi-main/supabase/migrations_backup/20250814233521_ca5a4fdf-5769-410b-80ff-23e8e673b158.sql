-- Master Company Profiles System
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
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(normalized_name, domain)
);

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

-- RLS Policies for master_company_profiles
CREATE POLICY "Anyone can read master company profiles" 
ON public.master_company_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "System and admins can manage master profiles" 
ON public.master_company_profiles 
FOR ALL 
USING (
  auth.role() = 'service_role' OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
);

-- RLS Policies for profile_field_contributions
CREATE POLICY "Users can view field contributions" 
ON public.profile_field_contributions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create field contributions" 
ON public.profile_field_contributions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "System and admins can manage field contributions" 
ON public.profile_field_contributions 
FOR ALL 
USING (
  auth.role() = 'service_role' OR 
  get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
);

-- RLS Policies for profile_quality_metrics
CREATE POLICY "Anyone can read quality metrics" 
ON public.profile_quality_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage quality metrics" 
ON public.profile_quality_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_master_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_master_profiles_updated_at
    BEFORE UPDATE ON public.master_company_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_master_profiles_updated_at();

-- Function to normalize company names for matching
CREATE OR REPLACE FUNCTION public.normalize_company_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(
        regexp_replace(
            regexp_replace(name, '\s*(inc|llc|corp|ltd|co)\s*\.?\s*$', '', 'i'),
            '[^a-zA-Z0-9]', '', 'g'
        ),
        '\s+', '', 'g'
    ));
END;
$$ LANGUAGE plpgsql;

-- Function to extract domain from URL
CREATE OR REPLACE FUNCTION public.extract_domain(url TEXT)
RETURNS TEXT AS $$
BEGIN
    IF url IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove protocol and www
    url := regexp_replace(url, '^https?://(www\.)?', '', 'i');
    -- Extract domain part (everything before first slash or query)
    url := split_part(split_part(url, '/', 1), '?', 1);
    -- Convert to lowercase
    RETURN lower(url);
END;
$$ LANGUAGE plpgsql;

-- Function to find matching master profile
CREATE OR REPLACE FUNCTION public.find_master_profile_match(
    company_name_param TEXT,
    website_url_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
    normalized_name TEXT;
    domain TEXT;
BEGIN
    -- Normalize inputs
    normalized_name := normalize_company_name(company_name_param);
    domain := extract_domain(website_url_param);
    
    -- Try exact match on normalized name first
    SELECT id INTO profile_id
    FROM public.master_company_profiles
    WHERE normalized_name = normalized_name
    LIMIT 1;
    
    -- If no match and we have a domain, try domain match
    IF profile_id IS NULL AND domain IS NOT NULL THEN
        SELECT id INTO profile_id
        FROM public.master_company_profiles
        WHERE domain = domain
        LIMIT 1;
    END IF;
    
    -- Try fuzzy match on similar names (within edit distance)
    IF profile_id IS NULL THEN
        SELECT id INTO profile_id
        FROM public.master_company_profiles
        WHERE levenshtein(normalized_name, company_name_param) <= 2
        AND length(normalized_name) > 3
        ORDER BY levenshtein(normalized_name, company_name_param)
        LIMIT 1;
    END IF;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql;

-- Add extension for fuzzy matching if not exists
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;