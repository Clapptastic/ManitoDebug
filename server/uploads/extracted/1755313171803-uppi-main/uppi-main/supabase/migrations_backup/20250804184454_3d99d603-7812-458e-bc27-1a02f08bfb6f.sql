-- =================================================================
-- MINIMAL ADMIN DATABASE MIGRATION
-- Create only the missing admin tables needed for functionality
-- =================================================================

-- 1. Create type_coverage_metrics table (if not exists)
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

-- 2. Create package_dependencies table (if not exists)
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

-- 3. Create user_chatbot_configs table (if not exists)
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

-- 4. Create user_model_configs table (if not exists)
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

-- Enable RLS on all new tables
ALTER TABLE public.type_coverage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_model_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access (using DROP IF EXISTS to avoid conflicts)
-- =================================================================

-- TYPE COVERAGE METRICS POLICIES
DROP POLICY IF EXISTS "Admins can manage all type coverage metrics" ON public.type_coverage_metrics;
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

DROP POLICY IF EXISTS "Authenticated users can view type coverage metrics" ON public.type_coverage_metrics;
CREATE POLICY "Authenticated users can view type coverage metrics"
ON public.type_coverage_metrics
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- PACKAGE DEPENDENCIES POLICIES
DROP POLICY IF EXISTS "Admins can manage all package dependencies" ON public.package_dependencies;
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

DROP POLICY IF EXISTS "Authenticated users can view package dependencies" ON public.package_dependencies;
CREATE POLICY "Authenticated users can view package dependencies"
ON public.package_dependencies
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- USER CHATBOT CONFIGS POLICIES
DROP POLICY IF EXISTS "Users can manage their own chatbot configs" ON public.user_chatbot_configs;
CREATE POLICY "Users can manage their own chatbot configs"
ON public.user_chatbot_configs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all chatbot configs" ON public.user_chatbot_configs;
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
DROP POLICY IF EXISTS "Users can manage their own model configs" ON public.user_model_configs;
CREATE POLICY "Users can manage their own model configs"
ON public.user_model_configs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all model configs" ON public.user_model_configs;
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

-- Insert initial package dependencies
INSERT INTO public.package_dependencies (package_name, current_version, package_type, description) VALUES
('react', '18.3.1', 'npm', 'A JavaScript library for building user interfaces'),
('@supabase/supabase-js', '2.49.4', 'npm', 'Supabase JavaScript client library'),
('typescript', '5.0.0', 'npm', 'TypeScript language and compiler'),
('@types/node', '20.0.0', 'npm', 'TypeScript definitions for Node.js'),
('tailwindcss', '3.4.0', 'npm', 'A utility-first CSS framework'),
('vite', '5.0.0', 'npm', 'Next generation frontend build tool')
ON CONFLICT (package_name, package_type) DO NOTHING;

-- Create admin helper functions
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

-- Success message
SELECT 'Essential admin tables created successfully!' as status;