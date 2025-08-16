-- Create master company profiles system with enhanced AI validation

-- Master company profiles table
CREATE TABLE public.master_company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL, -- For fuzzy matching
  primary_domain TEXT,
  secondary_domains TEXT[],
  industry TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  employee_count INTEGER,
  revenue_estimate NUMERIC,
  business_model TEXT,
  description TEXT,
  
  -- Enhanced data fields
  official_company_data JSONB DEFAULT '{}',
  financial_data JSONB DEFAULT '{}',
  technology_stack JSONB DEFAULT '{}',
  market_position_data JSONB DEFAULT '{}',
  personnel_data JSONB DEFAULT '{}',
  
  -- Confidence and validation
  overall_confidence_score NUMERIC DEFAULT 0,
  data_completeness_score NUMERIC DEFAULT 0,
  validation_status TEXT DEFAULT 'pending',
  last_validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Source tracking
  primary_source_type TEXT, -- 'ai_analysis', 'external_api', 'manual_entry'
  source_analyses UUID[], -- References to competitor_analyses
  external_source_ids JSONB DEFAULT '{}', -- Store external API IDs
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  last_updated_by UUID
);

-- Trusted data sources registry
CREATE TABLE public.trusted_data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL, -- 'api', 'scraper', 'database'
  authority_weight NUMERIC NOT NULL DEFAULT 1.0, -- 0.0 to 1.0
  api_endpoint TEXT,
  api_key_required BOOLEAN DEFAULT false,
  rate_limit_per_hour INTEGER,
  data_categories TEXT[], -- ['financial', 'personnel', 'basic_info', etc.]
  
  -- Status tracking
  is_active BOOLEAN DEFAULT true,
  last_successful_call TIMESTAMP WITH TIME ZONE,
  error_rate NUMERIC DEFAULT 0,
  avg_response_time_ms INTEGER,
  
  -- Configuration
  request_config JSONB DEFAULT '{}',
  response_mapping JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data validation logs
CREATE TABLE public.data_validation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_profile_id UUID REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  data_field TEXT NOT NULL,
  original_value TEXT,
  validated_value TEXT,
  validation_source TEXT NOT NULL,
  validation_method TEXT NOT NULL, -- 'api_check', 'web_scrape', 'cross_reference'
  
  -- Validation results
  is_valid BOOLEAN,
  confidence_score NUMERIC,
  discrepancy_reason TEXT,
  correction_applied BOOLEAN DEFAULT false,
  
  -- Metadata
  validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validation_duration_ms INTEGER,
  external_source_response JSONB
);

-- Company profile merges audit
CREATE TABLE public.company_profile_merges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_profile_id UUID REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  source_analysis_id UUID REFERENCES public.competitor_analyses(id) ON DELETE SET NULL,
  
  -- Merge details
  merge_type TEXT NOT NULL, -- 'new_profile', 'data_update', 'duplicate_merge'
  fields_updated TEXT[],
  confidence_changes JSONB DEFAULT '{}',
  merge_algorithm TEXT DEFAULT 'weighted_average',
  
  -- Quality metrics
  data_quality_before NUMERIC,
  data_quality_after NUMERIC,
  conflicts_resolved INTEGER DEFAULT 0,
  
  -- Audit trail
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  performed_by UUID,
  merge_notes TEXT,
  rollback_data JSONB -- For potential rollbacks
);

-- Confidence history tracking
CREATE TABLE public.confidence_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_profile_id UUID REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  data_field TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  contributing_sources JSONB DEFAULT '{}',
  score_calculation_method TEXT,
  
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  triggered_by TEXT -- 'new_data', 'validation', 'manual_override'
);

-- Source authority weights (dynamic scoring)
CREATE TABLE public.source_authority_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  data_category TEXT NOT NULL, -- 'financial', 'personnel', 'basic_info', etc.
  authority_weight NUMERIC NOT NULL DEFAULT 1.0,
  accuracy_percentage NUMERIC DEFAULT 100,
  
  -- Performance metrics
  total_validations INTEGER DEFAULT 0,
  successful_validations INTEGER DEFAULT 0,
  avg_confidence_boost NUMERIC DEFAULT 0,
  
  -- Temporal tracking
  last_accuracy_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(source_name, data_category)
);

-- Enable RLS on all tables
ALTER TABLE public.master_company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profile_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confidence_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_authority_weights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Master company profiles - Super admins can manage all, users can view
CREATE POLICY "Super admins can manage master company profiles" 
ON public.master_company_profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users can view master company profiles" 
ON public.master_company_profiles 
FOR SELECT 
USING (true);

-- Trusted data sources - Only super admins
CREATE POLICY "Super admins can manage trusted data sources" 
ON public.trusted_data_sources 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Data validation logs - Super admins can view all, users can view related to their analyses
CREATE POLICY "Super admins can view all validation logs" 
ON public.data_validation_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Company profile merges - Super admins only
CREATE POLICY "Super admins can view merge history" 
ON public.company_profile_merges 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Confidence history - Super admins can view all
CREATE POLICY "Super admins can view confidence history" 
ON public.confidence_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Source authority weights - Super admins can manage
CREATE POLICY "Super admins can manage source authority weights" 
ON public.source_authority_weights 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create indexes for performance
CREATE INDEX idx_master_profiles_normalized_name ON public.master_company_profiles(normalized_name);
CREATE INDEX idx_master_profiles_domain ON public.master_company_profiles(primary_domain);
CREATE INDEX idx_master_profiles_industry ON public.master_company_profiles(industry);
CREATE INDEX idx_validation_logs_profile_field ON public.data_validation_logs(master_profile_id, data_field);
CREATE INDEX idx_confidence_history_profile_field ON public.confidence_history(master_profile_id, data_field);
CREATE INDEX idx_source_weights_category ON public.source_authority_weights(data_category);

-- Function to normalize company names for better matching
CREATE OR REPLACE FUNCTION normalize_company_name(company_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove common suffixes and normalize
  RETURN LOWER(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(company_name, '\s+(Inc\.?|LLC|Ltd\.?|Corporation|Corp\.?|Limited|Co\.?)$', '', 'i'),
          '\s+', ' ', 'g'
        ),
        '[^\w\s]', '', 'g'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate enhanced confidence score
CREATE OR REPLACE FUNCTION calculate_enhanced_confidence_score(profile_data JSONB, source_weights JSONB DEFAULT '{}')
RETURNS NUMERIC AS $$
DECLARE
  total_score NUMERIC := 0;
  field_count INTEGER := 0;
  weight_multiplier NUMERIC;
BEGIN
  -- Basic scoring with source weights
  IF profile_data ? 'company_name' AND profile_data->>'company_name' != '' THEN
    weight_multiplier := COALESCE((source_weights->>'basic_info')::NUMERIC, 1.0);
    total_score := total_score + (10 * weight_multiplier);
    field_count := field_count + 1;
  END IF;
  
  IF profile_data ? 'revenue_estimate' AND (profile_data->>'revenue_estimate')::NUMERIC > 0 THEN
    weight_multiplier := COALESCE((source_weights->>'financial')::NUMERIC, 0.8);
    total_score := total_score + (15 * weight_multiplier);
    field_count := field_count + 1;
  END IF;
  
  IF profile_data ? 'employee_count' AND (profile_data->>'employee_count')::INTEGER > 0 THEN
    weight_multiplier := COALESCE((source_weights->>'personnel')::NUMERIC, 0.9);
    total_score := total_score + (10 * weight_multiplier);
    field_count := field_count + 1;
  END IF;
  
  -- Add more field-specific scoring...
  
  IF field_count = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN LEAST(100, (total_score / field_count::NUMERIC));
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to update master profiles updated_at
CREATE OR REPLACE FUNCTION update_master_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.overall_confidence_score = calculate_enhanced_confidence_score(
    jsonb_build_object(
      'company_name', NEW.company_name,
      'revenue_estimate', NEW.revenue_estimate,
      'employee_count', NEW.employee_count,
      'description', NEW.description
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_master_profiles_updated_at
  BEFORE UPDATE ON public.master_company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_master_profile_updated_at();

-- Insert initial trusted data sources
INSERT INTO public.trusted_data_sources (source_name, source_type, authority_weight, data_categories, api_endpoint, api_key_required) VALUES
('crunchbase', 'api', 0.95, ARRAY['basic_info', 'financial', 'personnel'], 'https://api.crunchbase.com/api/v4', true),
('sec_edgar', 'api', 1.0, ARRAY['financial', 'basic_info'], 'https://data.sec.gov/api', false),
('linkedin_company', 'api', 0.85, ARRAY['personnel', 'basic_info'], 'https://api.linkedin.com/v2', true),
('company_website', 'scraper', 0.80, ARRAY['basic_info', 'technology'], null, false),
('openai_gpt4', 'ai_model', 0.70, ARRAY['market_analysis', 'competitive_intel'], null, true),
('anthropic_claude', 'ai_model', 0.75, ARRAY['market_analysis', 'strategic_analysis'], null, true);

-- Insert initial source authority weights
INSERT INTO public.source_authority_weights (source_name, data_category, authority_weight, accuracy_percentage) VALUES
('sec_edgar', 'financial', 1.0, 99),
('crunchbase', 'financial', 0.95, 95),
('crunchbase', 'basic_info', 0.90, 92),
('linkedin_company', 'personnel', 0.85, 88),
('company_website', 'basic_info', 0.80, 85),
('openai_gpt4', 'market_analysis', 0.70, 75),
('anthropic_claude', 'strategic_analysis', 0.75, 78);