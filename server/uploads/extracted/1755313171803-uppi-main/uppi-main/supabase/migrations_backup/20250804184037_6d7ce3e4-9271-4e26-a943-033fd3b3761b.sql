-- =================================================================
-- COMPREHENSIVE ADMIN DATABASE MIGRATION
-- Fix all permission issues and create missing admin tables
-- =================================================================

-- Create missing admin tables with proper structure
-- =================================================================

-- 1. TYPE COVERAGE METRICS TABLE
CREATE TABLE IF NOT EXISTS public.type_coverage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL DEFAULT 'main',
  percentage NUMERIC NOT NULL DEFAULT 0,
  typed_lines INTEGER NOT NULL DEFAULT 0,
  total_lines INTEGER NOT NULL DEFAULT 0,
  typed_files INTEGER NOT NULL DEFAULT 0,
  total_files INTEGER NOT NULL DEFAULT 0,
  directory_breakdown JSONB DEFAULT '[]'::jsonb,
  worst_files JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PACKAGE DEPENDENCIES TABLE
CREATE TABLE IF NOT EXISTS public.package_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  latest_version TEXT,
  is_outdated BOOLEAN DEFAULT false,
  security_vulnerabilities INTEGER DEFAULT 0,
  update_available BOOLEAN DEFAULT false,
  package_type TEXT DEFAULT 'npm',
  description TEXT,
  homepage_url TEXT,
  repository_url TEXT,
  license TEXT,
  last_checked TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(package_name, package_type)
);

-- 3. USER CHATBOT CONFIGS TABLE
CREATE TABLE IF NOT EXISTS public.user_chatbot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  config_name TEXT NOT NULL DEFAULT 'default',
  system_prompt TEXT,
  model_preferences JSONB DEFAULT '{}'::jsonb,
  response_settings JSONB DEFAULT '{}'::jsonb,
  context_settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, config_name)
);

-- 4. USER MODEL CONFIGS TABLE
CREATE TABLE IF NOT EXISTS public.user_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  configuration JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider, model_name)
);

-- 5. SYSTEM COMPONENTS TABLE
CREATE TABLE IF NOT EXISTS public.system_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  component_type TEXT NOT NULL DEFAULT 'service',
  status TEXT NOT NULL DEFAULT 'unknown',
  health_score NUMERIC DEFAULT 100,
  last_check TIMESTAMPTZ DEFAULT now(),
  check_interval_minutes INTEGER DEFAULT 5,
  endpoint_url TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  configuration JSONB DEFAULT '{}'::jsonb,
  dependencies TEXT[] DEFAULT '{}',
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
-- =================================================================
ALTER TABLE public.type_coverage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for admin access
-- =================================================================

-- TYPE COVERAGE METRICS POLICIES
CREATE POLICY "Admins can manage all type coverage metrics"
ON public.type_coverage_metrics
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users can view their own type coverage metrics"
ON public.type_coverage_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own type coverage metrics"
ON public.type_coverage_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- PACKAGE DEPENDENCIES POLICIES
CREATE POLICY "Admins can manage all package dependencies"
ON public.package_dependencies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Authenticated users can view package dependencies"
ON public.package_dependencies
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- USER CHATBOT CONFIGS POLICIES
CREATE POLICY "Users can manage their own chatbot configs"
ON public.user_chatbot_configs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all chatbot configs"
ON public.user_chatbot_configs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- USER MODEL CONFIGS POLICIES
CREATE POLICY "Users can manage their own model configs"
ON public.user_model_configs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all model configs"
ON public.user_model_configs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- SYSTEM COMPONENTS POLICIES
CREATE POLICY "Admins can manage all system components"
ON public.system_components
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Authenticated users can view system components"
ON public.system_components
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create triggers for automatic timestamp updates
-- =================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all admin tables
CREATE TRIGGER update_type_coverage_metrics_updated_at
  BEFORE UPDATE ON public.type_coverage_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_dependencies_updated_at
  BEFORE UPDATE ON public.package_dependencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_chatbot_configs_updated_at
  BEFORE UPDATE ON public.user_chatbot_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_model_configs_updated_at
  BEFORE UPDATE ON public.user_model_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_components_updated_at
  BEFORE UPDATE ON public.system_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial system components for monitoring
-- =================================================================
INSERT INTO public.system_components (name, display_name, description, component_type, status, is_critical) VALUES
('database', 'PostgreSQL Database', 'Main application database', 'database', 'healthy', true),
('auth', 'Authentication Service', 'Supabase Auth system', 'service', 'healthy', true),
('storage', 'File Storage', 'Supabase Storage system', 'service', 'healthy', false),
('edge_functions', 'Edge Functions', 'Serverless function runtime', 'service', 'healthy', false),
('competitor_analysis', 'Competitor Analysis API', 'AI-powered competitor analysis service', 'api', 'unknown', false),
('embedding_service', 'Code Embedding Service', 'Code analysis and embedding generation', 'service', 'unknown', false)
ON CONFLICT (name) DO NOTHING;

-- Insert initial package dependencies (common ones for monitoring)
-- =================================================================
INSERT INTO public.package_dependencies (package_name, current_version, package_type, description) VALUES
('react', '18.3.1', 'npm', 'A JavaScript library for building user interfaces'),
('@supabase/supabase-js', '2.49.4', 'npm', 'Supabase JavaScript client library'),
('typescript', '5.0.0', 'npm', 'TypeScript language and compiler'),
('@types/node', '20.0.0', 'npm', 'TypeScript definitions for Node.js'),
('tailwindcss', '3.4.0', 'npm', 'A utility-first CSS framework'),
('vite', '5.0.0', 'npm', 'Next generation frontend build tool')
ON CONFLICT (package_name, package_type) DO NOTHING;

-- Grant necessary permissions to authenticated users
-- =================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure admin role can bypass RLS on critical admin tables
-- =================================================================
GRANT ALL ON public.type_coverage_metrics TO service_role;
GRANT ALL ON public.package_dependencies TO service_role;
GRANT ALL ON public.user_chatbot_configs TO service_role;
GRANT ALL ON public.user_model_configs TO service_role;
GRANT ALL ON public.system_components TO service_role;

-- Create indexes for better performance
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_type_coverage_user_id ON public.type_coverage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_type_coverage_updated_at ON public.type_coverage_metrics(updated_at);

CREATE INDEX IF NOT EXISTS idx_package_deps_outdated ON public.package_dependencies(is_outdated);
CREATE INDEX IF NOT EXISTS idx_package_deps_vulnerabilities ON public.package_dependencies(security_vulnerabilities);

CREATE INDEX IF NOT EXISTS idx_chatbot_configs_user_id ON public.user_chatbot_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_active ON public.user_chatbot_configs(is_active);

CREATE INDEX IF NOT EXISTS idx_model_configs_user_id ON public.user_model_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_model_configs_default ON public.user_model_configs(is_default);

CREATE INDEX IF NOT EXISTS idx_system_components_status ON public.system_components(status);
CREATE INDEX IF NOT EXISTS idx_system_components_critical ON public.system_components(is_critical);

-- Create admin utility functions
-- =================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- Function to check system health
CREATE OR REPLACE FUNCTION public.get_system_health_summary()
RETURNS TABLE(
  total_components INTEGER,
  healthy_components INTEGER,
  critical_issues INTEGER,
  overall_status TEXT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::INTEGER as total_components,
    COUNT(CASE WHEN status = 'healthy' THEN 1 END)::INTEGER as healthy_components,
    COUNT(CASE WHEN status != 'healthy' AND is_critical = true THEN 1 END)::INTEGER as critical_issues,
    CASE 
      WHEN COUNT(CASE WHEN status != 'healthy' AND is_critical = true THEN 1 END) > 0 THEN 'critical'
      WHEN COUNT(CASE WHEN status != 'healthy' THEN 1 END) > 0 THEN 'warning'
      ELSE 'healthy'
    END as overall_status
  FROM public.system_components;
$$;

-- Success message
SELECT 'Admin database infrastructure successfully created and configured!' as status;