-- Admin Panel Service Database Schema
-- This script creates all necessary tables and functions for the admin panel microservice

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE api_status AS ENUM ('active', 'inactive', 'pending', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE log_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles table for additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  tenant_id TEXT DEFAULT 'default',
  metadata JSONB DEFAULT '{}',
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- API keys table for external integrations
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- System health metrics table
CREATE TABLE IF NOT EXISTS public.system_health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  cpu_usage NUMERIC,
  memory_usage NUMERIC,
  disk_usage NUMERIC,
  database_connections INTEGER,
  active_users INTEGER,
  api_response_time NUMERIC,
  error_rate NUMERIC,
  uptime_seconds BIGINT,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- API usage metrics table
CREATE TABLE IF NOT EXISTS public.api_usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  user_agent TEXT,
  ip_address INET,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Error logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  action TEXT,
  severity log_severity NOT NULL DEFAULT 'medium',
  environment TEXT NOT NULL DEFAULT 'production',
  user_agent TEXT,
  url TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Webhooks table for external integrations
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Audit logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users TEXT[] DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Package information table for tracking dependencies
CREATE TABLE IF NOT EXISTS public.package_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  latest_version TEXT,
  package_manager TEXT NOT NULL DEFAULT 'npm',
  is_dev_dependency BOOLEAN NOT NULL DEFAULT false,
  vulnerability_count INTEGER DEFAULT 0,
  license TEXT,
  description TEXT,
  homepage_url TEXT,
  repository_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name, package_manager)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_info ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (is_admin(auth.uid()));

-- API keys policies
CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT USING (
    user_id = auth.uid() OR 
    tenant_id = get_user_tenant(auth.uid())
  );

CREATE POLICY "Admins can manage API keys" ON public.api_keys
  FOR ALL USING (is_admin(auth.uid()));

-- System health metrics policies
CREATE POLICY "Admins can view system health" ON public.system_health_metrics
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert health metrics" ON public.system_health_metrics
  FOR INSERT WITH CHECK (true); -- Allow system to insert

-- API usage metrics policies
CREATE POLICY "Users can view their own API usage" ON public.api_usage_metrics
  FOR SELECT USING (
    user_id = auth.uid() OR 
    is_admin(auth.uid())
  );

CREATE POLICY "System can insert API metrics" ON public.api_usage_metrics
  FOR INSERT WITH CHECK (true);

-- Error logs policies
CREATE POLICY "Users can view their own errors" ON public.error_logs
  FOR SELECT USING (
    user_id = auth.uid() OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage error logs" ON public.error_logs
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "System can insert error logs" ON public.error_logs
  FOR INSERT WITH CHECK (true);

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (is_admin(auth.uid()));

-- Webhooks policies
CREATE POLICY "Admins can manage webhooks" ON public.webhooks
  FOR ALL USING (is_admin(auth.uid()));

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Feature flags policies
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view enabled feature flags" ON public.feature_flags
  FOR SELECT USING (is_enabled = true);

-- Package info policies
CREATE POLICY "Admins can manage package info" ON public.package_info
  FOR ALL USING (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_error_logs_updated_at
  BEFORE UPDATE ON public.error_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_package_info_updated_at
  BEFORE UPDATE ON public.package_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email = 'admin@localhost' THEN 'super_admin'::user_role
      ELSE 'user'::user_role
    END,
    COALESCE(NEW.raw_user_meta_data->>'tenant_id', 'default')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON public.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_system_health_tenant_recorded ON public.system_health_metrics(tenant_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_tenant_created ON public.api_usage_metrics(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON public.api_usage_metrics(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_tenant_created ON public.error_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON public.audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant_enabled ON public.feature_flags(tenant_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_package_info_tenant_name ON public.package_info(tenant_id, name);

-- Insert sample data for development
INSERT INTO public.system_health_metrics (
  cpu_usage, memory_usage, disk_usage, database_connections, 
  active_users, api_response_time, error_rate, uptime_seconds
) VALUES 
  (45.2, 67.8, 23.1, 15, 25, 150.5, 0.02, 86400),
  (52.1, 71.3, 25.6, 18, 30, 175.2, 0.01, 172800)
ON CONFLICT DO NOTHING;

-- Insert sample feature flags
INSERT INTO public.feature_flags (name, description, is_enabled, rollout_percentage) VALUES
  ('real_time_updates', 'Enable real-time WebSocket updates', true, 100),
  ('advanced_analytics', 'Enable advanced analytics dashboard', true, 50),
  ('api_rate_limiting', 'Enable API rate limiting', true, 100),
  ('beta_features', 'Enable beta features for testing', false, 0)
ON CONFLICT (tenant_id, name) DO NOTHING;