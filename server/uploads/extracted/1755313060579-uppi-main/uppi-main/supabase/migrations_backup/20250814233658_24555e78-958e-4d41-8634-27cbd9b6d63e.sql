-- Master Company Profiles System - Step by step creation
CREATE TABLE IF NOT EXISTS public.master_company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  website_url TEXT,
  domain TEXT,
  industry TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  employee_count INTEGER,
  business_model TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],
  threats TEXT[],
  market_position TEXT,
  target_market TEXT[],
  customer_segments TEXT[],
  geographic_presence TEXT[],
  market_share_estimate NUMERIC,
  competitive_advantages TEXT[],
  revenue_estimate NUMERIC,
  funding_info JSONB DEFAULT '{}',
  pricing_strategy JSONB DEFAULT '{}',
  technology_stack TEXT[],
  patent_count INTEGER,
  innovation_score NUMERIC,
  social_media_presence JSONB DEFAULT '{}',
  key_personnel JSONB DEFAULT '{}',
  esg_data JSONB DEFAULT '{}',
  total_analyses INTEGER DEFAULT 0,
  last_analysis_date TIMESTAMP WITH TIME ZONE,
  data_quality_score NUMERIC DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  completeness_score NUMERIC DEFAULT 0,
  ai_enhancement_count INTEGER DEFAULT 0,
  last_ai_enhancement TIMESTAMP WITH TIME ZONE,
  ai_confidence_scores JSONB DEFAULT '{}',
  contributing_users UUID[],
  source_analyses UUID[],
  verification_status TEXT DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_master_profiles_normalized_name ON public.master_company_profiles(normalized_name);
CREATE INDEX IF NOT EXISTS idx_master_profiles_domain ON public.master_company_profiles(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_master_profiles_industry ON public.master_company_profiles(industry);

-- Enable RLS
ALTER TABLE public.master_company_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Helper functions
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

CREATE OR REPLACE FUNCTION public.extract_domain(url TEXT)
RETURNS TEXT AS $$
BEGIN
    IF url IS NULL THEN
        RETURN NULL;
    END IF;
    url := regexp_replace(url, '^https?://(www\.)?', '', 'i');
    url := split_part(split_part(url, '/', 1), '?', 1);
    RETURN lower(url);
END;
$$ LANGUAGE plpgsql;