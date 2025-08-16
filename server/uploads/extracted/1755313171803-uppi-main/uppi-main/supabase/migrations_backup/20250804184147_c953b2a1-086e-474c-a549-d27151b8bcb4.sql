-- =================================================================
-- COMPREHENSIVE ADMIN DATABASE MIGRATION (FIXED)
-- Fix all permission issues and create missing admin tables
-- =================================================================

-- Create missing admin tables with proper structure
-- =================================================================

-- 1. TYPE COVERAGE METRICS TABLE
CREATE TABLE IF NOT EXISTS public.type_coverage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  user_id UUID NOT NULL,
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
  user_id UUID NOT NULL,
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

-- TYPE COVERAGE METRICS POLICIES (System-wide, admin managed)
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

CREATE POLICY "Authenticated users can view type coverage metrics"
ON public.type_coverage_metrics
FOR SELECT
USING (auth.uid() IS NOT NULL);

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
SELECT 'Admin database infrastructure successfully created and configured!' as message;