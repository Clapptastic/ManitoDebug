-- Create remaining tables and functions for master profiles system

-- Create profile field contributions table  
CREATE TABLE IF NOT EXISTS public.profile_field_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.competitor_analyses(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  provider TEXT,
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  confidence_score NUMERIC,
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profile quality metrics table
CREATE TABLE IF NOT EXISTS public.profile_quality_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  completeness_score NUMERIC NOT NULL,
  accuracy_score NUMERIC NOT NULL,
  freshness_score NUMERIC NOT NULL,
  consensus_score NUMERIC NOT NULL,
  field_quality_scores JSONB DEFAULT '{}',
  field_confidence_scores JSONB DEFAULT '{}',
  field_last_updated JSONB DEFAULT '{}',
  source_diversity_score NUMERIC,
  temporal_consistency_score NUMERIC,
  ai_improvement_score NUMERIC DEFAULT 0,
  ai_suggestions JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  calculation_version TEXT DEFAULT '1.0'
);

-- Enable RLS for new tables
ALTER TABLE public.profile_field_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_field_contributions
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

-- Create policies for profile_quality_metrics
CREATE POLICY "Anyone can read quality metrics" 
ON public.profile_quality_metrics 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage quality metrics" 
ON public.profile_quality_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_field_contributions_profile_id ON public.profile_field_contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_field_contributions_analysis_id ON public.profile_field_contributions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_field_contributions_field_name ON public.profile_field_contributions(field_name);

CREATE INDEX IF NOT EXISTS idx_quality_metrics_profile_id ON public.profile_quality_metrics(profile_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_calculated_at ON public.profile_quality_metrics(calculated_at);

-- Ensure fuzzy matching extension is available
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

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