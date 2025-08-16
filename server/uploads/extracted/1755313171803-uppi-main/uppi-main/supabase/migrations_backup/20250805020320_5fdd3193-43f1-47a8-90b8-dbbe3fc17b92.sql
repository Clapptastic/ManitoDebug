-- Create feature flags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  target_audience TEXT DEFAULT 'all',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Only enable RLS and create policies if table was just created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feature_flags' AND schemaname = 'public'
  ) THEN
    ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Super admins can manage feature flags" 
    ON public.feature_flags 
    FOR ALL 
    USING (is_super_admin_user()) 
    WITH CHECK (is_super_admin_user());

    CREATE POLICY "All users can read feature flags" 
    ON public.feature_flags 
    FOR SELECT 
    USING (true);
  END IF;
END $$;

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

-- Enable RLS for analytics
ALTER TABLE public.master_profile_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'master_profile_analytics' AND schemaname = 'public'
  ) THEN
    CREATE POLICY "Super admins can manage master profile analytics" 
    ON public.master_profile_analytics 
    FOR ALL 
    USING (is_super_admin_user()) 
    WITH CHECK (is_super_admin_user());
  END IF;
END $$;

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_name, is_enabled, description, target_audience) VALUES
('master_profiles_enabled', true, 'Enable master company profiles feature', 'all'),
('master_profiles_auto_contribution', true, 'Auto-contribute to master profiles from competitive analysis', 'all'),
('master_profiles_ai_validation', false, 'Enable AI-powered validation for master profiles', 'super_admin'),
('master_profiles_confidence_scoring', true, 'Enable confidence scoring for master profile data', 'all'),
('master_profiles_admin_dashboard', true, 'Enable admin dashboard for master profiles management', 'admin')
ON CONFLICT (flag_name) DO NOTHING;