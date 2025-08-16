-- Create all missing tables that components are trying to access

-- Documentation/Documents table
CREATE TABLE IF NOT EXISTS public.documentation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  version TEXT DEFAULT '1.0',
  created_by UUID NOT NULL,
  is_published BOOLEAN DEFAULT false,
  file_path TEXT,
  file_size BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company profiles table
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  website_url TEXT,
  description TEXT,
  industry TEXT,
  employee_count INTEGER,
  founded_year INTEGER,
  headquarters TEXT,
  business_model TEXT,
  funding_stage TEXT,
  revenue_estimate BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User chatbot configs table
CREATE TABLE IF NOT EXISTS public.user_chatbot_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assigned_provider TEXT DEFAULT 'openai',
  assigned_model TEXT DEFAULT 'gpt-4',
  fallback_providers TEXT[] DEFAULT '{}',
  max_tokens INTEGER DEFAULT 4000,
  temperature NUMERIC DEFAULT 0.7,
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User model configs table
CREATE TABLE IF NOT EXISTS public.user_model_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Model versions table
CREATE TABLE IF NOT EXISTS public.model_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  current_version TEXT,
  latest_version TEXT,
  deprecation_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Code embeddings table
CREATE TABLE IF NOT EXISTS public.code_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Embeddings status table
CREATE TABLE IF NOT EXISTS public.embeddings_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_files INTEGER DEFAULT 0,
  processed_files INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Microservices table
CREATE TABLE IF NOT EXISTS public.microservices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  endpoint_url TEXT,
  status TEXT DEFAULT 'active',
  version TEXT DEFAULT '1.0.0',
  health_check_url TEXT,
  last_health_check TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- System metrics table
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpu_usage NUMERIC DEFAULT 0,
  memory_usage NUMERIC DEFAULT 0,
  disk_usage NUMERIC DEFAULT 0,
  network_latency NUMERIC DEFAULT 0,
  active_connections INTEGER DEFAULT 0,
  error_rate NUMERIC DEFAULT 0,
  uptime NUMERIC DEFAULT 100,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  overall_status TEXT DEFAULT 'operational',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Platform roles table
CREATE TABLE IF NOT EXISTS public.platform_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  permissions JSONB DEFAULT '{}'::jsonb,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Competitor groups table
CREATE TABLE IF NOT EXISTS public.competitor_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  competitors JSONB DEFAULT '[]'::jsonb,
  analysis_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Frontend permissions table
CREATE TABLE IF NOT EXISTS public.frontend_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  component_name TEXT NOT NULL,
  permission_level TEXT DEFAULT 'read',
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Edge function metrics table
CREATE TABLE IF NOT EXISTS public.edge_function_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  execution_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing columns to API keys table
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'openai',
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS masked_key TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS last_validated TIMESTAMP WITH TIME ZONE;

-- Add missing columns to competitor_analyses table
ALTER TABLE public.competitor_analyses 
ADD COLUMN IF NOT EXISTS social_media_presence JSONB DEFAULT '{}'::jsonb;

-- Enable RLS on all new tables
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microservices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontend_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_function_metrics ENABLE ROW LEVEL SECURITY;