-- Create missing tables for existing functionality

-- 1. Create profiles table for user profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Create competitor_analyses table
CREATE TABLE IF NOT EXISTS public.competitor_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  website_url TEXT,
  industry TEXT,
  description TEXT,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  opportunities TEXT[] DEFAULT '{}',
  threats TEXT[] DEFAULT '{}',
  business_model TEXT,
  target_market TEXT[] DEFAULT '{}',
  pricing_strategy JSONB DEFAULT '{}',
  market_position TEXT,
  funding_info JSONB DEFAULT '{}',
  employee_count INTEGER,
  founded_year INTEGER,
  headquarters TEXT,
  data_quality_score NUMERIC DEFAULT 0,
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create website_analytics table  
CREATE TABLE IF NOT EXISTS public.website_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  unique_visitors INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  bounce_rate NUMERIC DEFAULT 0,
  session_duration INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  traffic_sources JSONB DEFAULT '{}',
  top_pages JSONB DEFAULT '{}',
  device_types JSONB DEFAULT '{}',
  geographic_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 4. Create master_company_profiles table
CREATE TABLE IF NOT EXISTS public.master_company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  website_url TEXT,
  industry TEXT,
  description TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  employee_count INTEGER,
  revenue_estimate BIGINT,
  market_cap BIGINT,
  business_model TEXT,
  key_products TEXT[] DEFAULT '{}',
  target_markets TEXT[] DEFAULT '{}',
  competitive_advantages TEXT[] DEFAULT '{}',
  funding_rounds JSONB DEFAULT '{}',
  key_executives JSONB DEFAULT '{}',
  financial_metrics JSONB DEFAULT '{}',
  social_media_profiles JSONB DEFAULT '{}',
  technology_stack JSONB DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  partnerships TEXT[] DEFAULT '{}',
  data_sources JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_quality_score NUMERIC DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_name, website_url)
);

-- 5. Create system_components table for admin dashboard
CREATE TABLE IF NOT EXISTS public.system_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'operational',
  uptime_percentage NUMERIC DEFAULT 100,
  response_time INTEGER,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for competitor_analyses
CREATE POLICY "Users can view their own analyses" ON public.competitor_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON public.competitor_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON public.competitor_analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" ON public.competitor_analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for website_analytics
CREATE POLICY "Users can view their own analytics" ON public.website_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON public.website_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" ON public.website_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for master_company_profiles
CREATE POLICY "Anyone can view master company profiles" ON public.master_company_profiles
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert master profiles" ON public.master_company_profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update master profiles" ON public.master_company_profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for system_components
CREATE POLICY "Authenticated users can view system components" ON public.system_components
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_id ON public.competitor_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_status ON public.competitor_analyses(status);
CREATE INDEX IF NOT EXISTS idx_website_analytics_user_id ON public.website_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_website_analytics_date ON public.website_analytics(date);
CREATE INDEX IF NOT EXISTS idx_master_company_profiles_name ON public.master_company_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_master_company_profiles_industry ON public.master_company_profiles(industry);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_competitor_analyses_updated_at
  BEFORE UPDATE ON public.competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_website_analytics_updated_at
  BEFORE UPDATE ON public.website_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_master_company_profiles_updated_at
  BEFORE UPDATE ON public.master_company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_system_components_updated_at
  BEFORE UPDATE ON public.system_components
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample data for system_components
INSERT INTO public.system_components (name, description, status, uptime_percentage, response_time) VALUES
  ('API Gateway', 'Main API gateway service', 'operational', 99.9, 120),
  ('Database', 'Primary PostgreSQL database', 'operational', 99.8, 50),
  ('Authentication Service', 'User authentication and authorization', 'operational', 99.5, 200),
  ('File Storage', 'Document and media storage service', 'operational', 99.7, 300),
  ('AI Analysis Engine', 'Competitor analysis AI service', 'operational', 98.9, 2500)
ON CONFLICT DO NOTHING;