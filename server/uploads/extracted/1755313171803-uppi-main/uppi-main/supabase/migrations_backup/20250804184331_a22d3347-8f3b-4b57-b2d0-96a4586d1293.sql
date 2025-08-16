-- =================================================================
-- TARGETED ADMIN DATABASE MIGRATION
-- Create only missing tables and fix permission issues
-- =================================================================

-- Check and create missing tables only if they don't exist
-- =================================================================

-- Create type_coverage_metrics table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'type_coverage_metrics') THEN
    CREATE TABLE public.type_coverage_metrics (
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
    
    ALTER TABLE public.type_coverage_metrics ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create package_dependencies table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'package_dependencies') THEN
    CREATE TABLE public.package_dependencies (
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
    
    ALTER TABLE public.package_dependencies ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create user_chatbot_configs table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_chatbot_configs') THEN
    CREATE TABLE public.user_chatbot_configs (
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
    
    ALTER TABLE public.user_chatbot_configs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create user_model_configs table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_model_configs') THEN
    CREATE TABLE public.user_model_configs (
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
    
    ALTER TABLE public.user_model_configs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create system_components table if missing (only if microservices doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_components') THEN
    CREATE TABLE public.system_components (
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
    
    ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies only if they don't exist
-- =================================================================

-- Helper function to check if policy exists
CREATE OR REPLACE FUNCTION policy_exists(table_name text, policy_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = table_name 
    AND policyname = policy_name
  );
END;
$$ LANGUAGE plpgsql;

-- TYPE COVERAGE METRICS POLICIES
DO $$
BEGIN
  IF NOT policy_exists('type_coverage_metrics', 'Admins can manage all type coverage metrics') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all type coverage metrics" ON public.type_coverage_metrics FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''super_admin'')))';
  END IF;
  
  IF NOT policy_exists('type_coverage_metrics', 'Authenticated users can view type coverage metrics') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view type coverage metrics" ON public.type_coverage_metrics FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- PACKAGE DEPENDENCIES POLICIES  
DO $$
BEGIN
  IF NOT policy_exists('package_dependencies', 'Admins can manage all package dependencies') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all package dependencies" ON public.package_dependencies FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''super_admin'')))';
  END IF;
  
  IF NOT policy_exists('package_dependencies', 'Authenticated users can view package dependencies') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view package dependencies" ON public.package_dependencies FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- USER CHATBOT CONFIGS POLICIES
DO $$
BEGIN
  IF NOT policy_exists('user_chatbot_configs', 'Users can manage their own chatbot configs') THEN
    EXECUTE 'CREATE POLICY "Users can manage their own chatbot configs" ON public.user_chatbot_configs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  IF NOT policy_exists('user_chatbot_configs', 'Admins can view all chatbot configs') THEN
    EXECUTE 'CREATE POLICY "Admins can view all chatbot configs" ON public.user_chatbot_configs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''super_admin'')))';
  END IF;
END $$;

-- USER MODEL CONFIGS POLICIES
DO $$
BEGIN
  IF NOT policy_exists('user_model_configs', 'Users can manage their own model configs') THEN
    EXECUTE 'CREATE POLICY "Users can manage their own model configs" ON public.user_model_configs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  IF NOT policy_exists('user_model_configs', 'Admins can view all model configs') THEN
    EXECUTE 'CREATE POLICY "Admins can view all model configs" ON public.user_model_configs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''super_admin'')))';
  END IF;
END $$;

-- SYSTEM COMPONENTS POLICIES
DO $$
BEGIN
  IF NOT policy_exists('system_components', 'Admins can manage all system components') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all system components" ON public.system_components FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (''admin'', ''super_admin'')))';
  END IF;
  
  IF NOT policy_exists('system_components', 'Authenticated users can view system components') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view system components" ON public.system_components FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- Insert initial data only if tables are empty
-- =================================================================

-- Insert system components if table is empty
INSERT INTO public.system_components (name, display_name, description, component_type, status, is_critical) 
SELECT 'database', 'PostgreSQL Database', 'Main application database', 'database', 'healthy', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'database')
UNION ALL
SELECT 'auth', 'Authentication Service', 'Supabase Auth system', 'service', 'healthy', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'auth')
UNION ALL
SELECT 'storage', 'File Storage', 'Supabase Storage system', 'service', 'healthy', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'storage')
UNION ALL
SELECT 'edge_functions', 'Edge Functions', 'Serverless function runtime', 'service', 'healthy', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'edge_functions')
UNION ALL
SELECT 'competitor_analysis', 'Competitor Analysis API', 'AI-powered competitor analysis service', 'api', 'unknown', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'competitor_analysis')
UNION ALL
SELECT 'embedding_service', 'Code Embedding Service', 'Code analysis and embedding generation', 'service', 'unknown', false
WHERE NOT EXISTS (SELECT 1 FROM public.system_components WHERE name = 'embedding_service');

-- Insert package dependencies if table is empty
INSERT INTO public.package_dependencies (package_name, current_version, package_type, description)
SELECT 'react', '18.3.1', 'npm', 'A JavaScript library for building user interfaces'
WHERE NOT EXISTS (SELECT 1 FROM public.package_dependencies WHERE package_name = 'react')
UNION ALL
SELECT '@supabase/supabase-js', '2.49.4', 'npm', 'Supabase JavaScript client library'
WHERE NOT EXISTS (SELECT 1 FROM public.package_dependencies WHERE package_name = '@supabase/supabase-js')
UNION ALL
SELECT 'typescript', '5.0.0', 'npm', 'TypeScript language and compiler'
WHERE NOT EXISTS (SELECT 1 FROM public.package_dependencies WHERE package_name = 'typescript')
UNION ALL
SELECT '@types/node', '20.0.0', 'npm', 'TypeScript definitions for Node.js'
WHERE NOT EXISTS (SELECT 1 FROM public.package_dependencies WHERE package_name = '@types/node')
UNION ALL
SELECT 'tailwindcss', '3.4.0', 'npm', 'A utility-first CSS framework'
WHERE NOT EXISTS (SELECT 1 FROM public.package_dependencies WHERE package_name = 'tailwindcss')
UNION ALL
SELECT 'vite', '5.0.0', 'npm', 'Next generation frontend build tool'
WHERE NOT EXISTS (SELECT 1 FROM public.package_dependencies WHERE package_name = 'vite');

-- Clean up helper function
DROP FUNCTION IF EXISTS policy_exists(text, text);

-- Success message
SELECT 'Admin database infrastructure successfully created!' as status;