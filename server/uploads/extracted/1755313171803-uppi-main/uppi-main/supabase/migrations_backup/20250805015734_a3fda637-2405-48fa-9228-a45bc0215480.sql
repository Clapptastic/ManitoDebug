-- Create feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  target_audience TEXT DEFAULT 'all', -- 'all', 'super_admin', 'admin', 'user'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies for feature flags
CREATE POLICY "Super admins can manage feature flags" 
ON public.feature_flags 
FOR ALL 
USING (is_super_admin_user()) 
WITH CHECK (is_super_admin_user());

CREATE POLICY "All users can read feature flags" 
ON public.feature_flags 
FOR SELECT 
USING (true);

-- Create master profile analytics table
CREATE TABLE IF NOT EXISTS public.master_profile_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_profile_id UUID REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  accuracy_score NUMERIC DEFAULT 0,
  data_freshness_score NUMERIC DEFAULT 0,
  source_reliability_score NUMERIC DEFAULT 0,
  completeness_percentage NUMERIC DEFAULT 0,
  last_validation_check TIMESTAMP WITH TIME ZONE,
  validation_errors JSONB DEFAULT '[]',
  confidence_breakdown JSONB DEFAULT '{}',
  data_sources_count INTEGER DEFAULT 0,
  conflicting_data_points INTEGER DEFAULT 0,
  verified_data_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_profile_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for master profile analytics
CREATE POLICY "Super admins can manage master profile analytics" 
ON public.master_profile_analytics 
FOR ALL 
USING (is_super_admin_user()) 
WITH CHECK (is_super_admin_user());

-- Create master profile contributions table
CREATE TABLE IF NOT EXISTS public.master_profile_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_profile_id UUID REFERENCES public.master_company_profiles(id) ON DELETE CASCADE,
  contributor_user_id UUID REFERENCES auth.users(id),
  source_analysis_id UUID REFERENCES public.competitor_analyses(id),
  contribution_type TEXT NOT NULL, -- 'data_addition', 'data_update', 'data_correction', 'verification'
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  confidence_score NUMERIC DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  contribution_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_profile_contributions ENABLE ROW LEVEL SECURITY;

-- Policies for contributions
CREATE POLICY "Users can view their own contributions" 
ON public.master_profile_contributions 
FOR SELECT 
USING (auth.uid() = contributor_user_id OR is_super_admin_user());

CREATE POLICY "Users can create contributions" 
ON public.master_profile_contributions 
FOR INSERT 
WITH CHECK (auth.uid() = contributor_user_id);

CREATE POLICY "Super admins can manage all contributions" 
ON public.master_profile_contributions 
FOR ALL 
USING (is_super_admin_user()) 
WITH CHECK (is_super_admin_user());

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_name, is_enabled, description, target_audience) VALUES
('master_profiles_enabled', true, 'Enable master company profiles feature', 'all'),
('master_profiles_auto_contribution', true, 'Auto-contribute to master profiles from competitive analysis', 'all'),
('master_profiles_ai_validation', false, 'Enable AI-powered validation for master profiles', 'super_admin'),
('master_profiles_confidence_scoring', true, 'Enable confidence scoring for master profile data', 'all'),
('master_profiles_admin_dashboard', true, 'Enable admin dashboard for master profiles management', 'admin')
ON CONFLICT (flag_name) DO NOTHING;

-- Create trigger for updating analytics
CREATE OR REPLACE FUNCTION update_master_profile_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert analytics record
  INSERT INTO public.master_profile_analytics (
    master_profile_id,
    completeness_percentage,
    data_sources_count,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.data_completeness_score,
    COALESCE(array_length(NEW.source_analyses, 1), 0),
    now()
  )
  ON CONFLICT (master_profile_id) 
  DO UPDATE SET
    completeness_percentage = NEW.data_completeness_score,
    data_sources_count = COALESCE(array_length(NEW.source_analyses, 1), 0),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_master_profile_analytics_trigger
  AFTER INSERT OR UPDATE ON public.master_company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_master_profile_analytics();

-- Create function to calculate confidence score
CREATE OR REPLACE FUNCTION calculate_master_profile_confidence(profile_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  base_score NUMERIC := 0;
  source_count INTEGER := 0;
  verified_count INTEGER := 0;
  conflict_count INTEGER := 0;
  freshness_score NUMERIC := 0;
  final_score NUMERIC := 0;
BEGIN
  -- Get basic metrics
  SELECT 
    COALESCE(array_length(source_analyses, 1), 0),
    data_completeness_score
  INTO source_count, base_score
  FROM master_company_profiles 
  WHERE id = profile_id;
  
  -- Get verified contributions count
  SELECT COUNT(*) INTO verified_count
  FROM master_profile_contributions
  WHERE master_profile_id = profile_id AND is_verified = true;
  
  -- Calculate freshness (data updated in last 30 days gets bonus)
  SELECT CASE 
    WHEN updated_at > now() - interval '30 days' THEN 10
    WHEN updated_at > now() - interval '90 days' THEN 5
    ELSE 0
  END INTO freshness_score
  FROM master_company_profiles 
  WHERE id = profile_id;
  
  -- Calculate final confidence score
  final_score := LEAST(100, 
    base_score + 
    (source_count * 2) + 
    (verified_count * 5) + 
    freshness_score - 
    (conflict_count * 3)
  );
  
  RETURN GREATEST(0, final_score);
END;
$$ LANGUAGE plpgsql;

-- Update master profiles with confidence trigger
CREATE OR REPLACE FUNCTION update_master_profile_confidence_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.overall_confidence_score := calculate_master_profile_confidence(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_master_profile_confidence
  BEFORE UPDATE ON public.master_company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_master_profile_confidence_trigger();