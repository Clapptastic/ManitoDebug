-- Create company profiles table
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  company_name TEXT NOT NULL,
  logo_url TEXT,
  tagline TEXT,
  founded_year INTEGER,
  legal_structure TEXT,
  description TEXT,
  
  -- Contact & Location
  website_url TEXT,
  email TEXT,
  phone TEXT,
  headquarters TEXT,
  additional_locations JSONB DEFAULT '[]',
  
  -- Business Model & Strategy
  business_model TEXT,
  value_proposition TEXT,
  revenue_streams JSONB DEFAULT '[]',
  target_market JSONB DEFAULT '[]',
  customer_segments JSONB DEFAULT '[]',
  
  -- Financial & Growth
  revenue_estimate NUMERIC,
  employee_count INTEGER,
  funding_stage TEXT,
  funding_amount NUMERIC,
  growth_metrics JSONB DEFAULT '{}',
  
  -- Market & Competition
  industry TEXT,
  market_position TEXT,
  competitive_advantages TEXT[],
  key_differentiators TEXT[],
  
  -- Products & Services
  product_portfolio JSONB DEFAULT '{}',
  pricing_strategy JSONB DEFAULT '{}',
  key_products TEXT[],
  
  -- Technology & Operations
  technology_stack JSONB DEFAULT '{}',
  operational_metrics JSONB DEFAULT '{}',
  key_processes TEXT[],
  partnerships TEXT[],
  
  -- Marketing & Sales
  marketing_channels TEXT[],
  sales_strategy TEXT,
  customer_acquisition_cost NUMERIC,
  customer_lifetime_value NUMERIC,
  
  -- Team & Culture
  key_personnel JSONB DEFAULT '{}',
  company_culture TEXT,
  values TEXT[],
  organizational_structure TEXT,
  
  -- Automation & AI Analysis
  profile_completeness_score NUMERIC DEFAULT 0,
  last_ai_analysis TIMESTAMP WITH TIME ZONE,
  ai_analysis_data JSONB DEFAULT '{}',
  data_sources JSONB DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}',
  
  -- Integration flags
  sync_with_business_plan BOOLEAN DEFAULT true,
  sync_with_market_research BOOLEAN DEFAULT true,
  auto_update_from_analysis BOOLEAN DEFAULT true,
  
  -- Metadata
  is_public BOOLEAN DEFAULT false,
  profile_status TEXT DEFAULT 'draft' CHECK (profile_status IN ('draft', 'active', 'archived')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own company profile" 
ON company_profiles 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX idx_company_profiles_company_name ON company_profiles(company_name);
CREATE INDEX idx_company_profiles_industry ON company_profiles(industry);
CREATE INDEX idx_company_profiles_updated_at ON company_profiles(updated_at);

-- Create trigger for updated_at
CREATE TRIGGER update_company_profiles_updated_at
BEFORE UPDATE ON company_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(profile_data company_profiles)
RETURNS NUMERIC AS $$
DECLARE
  total_fields INTEGER := 25; -- Total number of key fields to check
  filled_fields INTEGER := 0;
  completeness_score NUMERIC;
BEGIN
  -- Check basic information fields
  IF profile_data.company_name IS NOT NULL AND profile_data.company_name != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.description IS NOT NULL AND profile_data.description != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.website_url IS NOT NULL AND profile_data.website_url != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.industry IS NOT NULL AND profile_data.industry != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.headquarters IS NOT NULL AND profile_data.headquarters != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.founded_year IS NOT NULL THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.employee_count IS NOT NULL THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.business_model IS NOT NULL AND profile_data.business_model != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.value_proposition IS NOT NULL AND profile_data.value_proposition != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.revenue_estimate IS NOT NULL THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.target_market IS NOT NULL AND jsonb_array_length(profile_data.target_market) > 0 THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.competitive_advantages IS NOT NULL AND array_length(profile_data.competitive_advantages, 1) > 0 THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.key_products IS NOT NULL AND array_length(profile_data.key_products, 1) > 0 THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.marketing_channels IS NOT NULL AND array_length(profile_data.marketing_channels, 1) > 0 THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.funding_stage IS NOT NULL AND profile_data.funding_stage != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  -- Add more field checks for remaining fields...
  -- For brevity, I'll add a few more key ones
  
  IF profile_data.email IS NOT NULL AND profile_data.email != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.tagline IS NOT NULL AND profile_data.tagline != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.market_position IS NOT NULL AND profile_data.market_position != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.sales_strategy IS NOT NULL AND profile_data.sales_strategy != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.company_culture IS NOT NULL AND profile_data.company_culture != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.values IS NOT NULL AND array_length(profile_data.values, 1) > 0 THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.key_personnel IS NOT NULL AND profile_data.key_personnel != '{}' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.technology_stack IS NOT NULL AND profile_data.technology_stack != '{}' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.partnerships IS NOT NULL AND array_length(profile_data.partnerships, 1) > 0 THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_data.customer_acquisition_cost IS NOT NULL THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  -- Calculate percentage
  completeness_score := (filled_fields::NUMERIC / total_fields::NUMERIC) * 100;
  
  RETURN ROUND(completeness_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update completeness score
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completeness_score := calculate_profile_completeness(NEW);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_profile_completeness
BEFORE INSERT OR UPDATE ON company_profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completeness();