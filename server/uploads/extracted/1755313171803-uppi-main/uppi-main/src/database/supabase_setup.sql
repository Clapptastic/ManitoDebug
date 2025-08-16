
-- Full Database Setup for AI-Powered SaaS Platform
-- This file contains all the SQL commands to set up the database structure for the application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE competitor_growth_stage AS ENUM ('seed', 'early', 'growth', 'expansion', 'mature', 'decline');
CREATE TYPE market_position_type AS ENUM ('leader', 'challenger', 'follower', 'niche');
CREATE TYPE competitor_analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'draft', 'partial');
CREATE TYPE impact_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE api_status AS ENUM ('active', 'invalid', 'checking', 'valid', 'error', 'pending', 'working');

-- Utility function to set updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table (for user information)
CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}'::jsonb,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set updated_at trigger for user_preferences
CREATE TRIGGER set_timestamp_user_preferences
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL,
  api_key TEXT NOT NULL,
  status api_status DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  model_preference JSONB DEFAULT '{}'::jsonb,
  last_validated TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key_type, organization_id)
);

-- API status checks
CREATE TABLE api_status_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_type TEXT NOT NULL,
  status TEXT NOT NULL,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set updated_at trigger for api_keys
CREATE TRIGGER set_timestamp_api_keys
BEFORE UPDATE ON api_keys
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- API metrics for monitoring usage
CREATE TABLE api_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  endpoint TEXT,
  query_cost NUMERIC DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  confidence_score NUMERIC DEFAULT 0,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API request logs 
CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_timestamp TIMESTAMP WITH TIME ZONE,
  response_time_ms INTEGER,
  status INTEGER,
  error TEXT,
  cost NUMERIC DEFAULT 0,
  request_payload JSONB,
  response_data JSONB
);

-- API usage aggregation
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  provider TEXT NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 0,
  avg_latency NUMERIC,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Organization members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, user_id)
);

-- Competitor groups
CREATE TABLE competitor_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  notes JSONB[] DEFAULT ARRAY[]::jsonb[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor analyses
CREATE TABLE competitor_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  status competitor_analysis_status NOT NULL DEFAULT 'pending',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Analysis metadata
  estimated_cost NUMERIC,
  actual_cost NUMERIC NOT NULL DEFAULT 0,
  error_message TEXT,
  analysis_started_at TIMESTAMP WITH TIME ZONE,
  analysis_completed_at TIMESTAMP WITH TIME ZONE,
  analysis_attempt_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_analyzed TIMESTAMP WITH TIME ZONE,
  
  -- Company data
  company_overview TEXT,
  company_url TEXT,
  company_logo TEXT,
  url_verified BOOLEAN DEFAULT FALSE,
  business_model TEXT,
  value_proposition TEXT,
  growth_stage competitor_growth_stage,
  position_type market_position_type,
  
  -- Market data
  market_position JSONB,
  product_offerings JSONB,
  marketing_strategy JSONB,
  distribution_channels JSONB,
  swot_analysis JSONB,
  competitive_benchmarking JSONB,
  industry_classification JSONB,
  market_share NUMERIC DEFAULT 0,
  market_presence_score NUMERIC DEFAULT 0,
  data_quality_score NUMERIC DEFAULT 0,
  market_growth_rate NUMERIC DEFAULT 0,
  market_penetration_rate NUMERIC DEFAULT 0,
  customer_acquisition_cost NUMERIC DEFAULT 0,
  customer_lifetime_value NUMERIC DEFAULT 0,
  channel_effectiveness_score NUMERIC DEFAULT 0,
  
  -- Features, capabilities, and targets
  features TEXT[] DEFAULT ARRAY[]::text[],
  strengths TEXT[] DEFAULT ARRAY[]::text[],
  weaknesses TEXT[] DEFAULT ARRAY[]::text[],
  target_segments TEXT[] DEFAULT ARRAY[]::text[],
  target_audience TEXT[] DEFAULT ARRAY[]::text[],
  platforms TEXT[] DEFAULT ARRAY[]::text[],
  channels TEXT[] DEFAULT ARRAY[]::text[],
  coverage_areas TEXT[] DEFAULT ARRAY[]::text[],
  tech_stack TEXT[] DEFAULT ARRAY[]::text[],
  online_presence_platforms TEXT[] DEFAULT ARRAY[]::text[],
  promotional_efforts TEXT[] DEFAULT ARRAY[]::text[],
  
  -- API and source data
  api_provider_status JSONB DEFAULT '{}'::jsonb,
  api_provider_responses JSONB DEFAULT '{}'::jsonb,
  api_attribution_info JSONB DEFAULT '{}'::jsonb,
  api_sources JSONB DEFAULT '{}'::jsonb,
  
  -- Additional data
  industry_trends JSONB[] DEFAULT ARRAY[]::jsonb[],
  market_trends JSONB[] DEFAULT ARRAY[]::jsonb[],
  leadership JSONB[] DEFAULT ARRAY[]::jsonb[],
  funding_info JSONB DEFAULT '{}'::jsonb,
  competitor_notes JSONB[] DEFAULT ARRAY[]::jsonb[],
  performance_metrics JSONB,
  market_indicators JSONB,
  
  -- Computed data
  computed_similar_competitors JSONB[] DEFAULT ARRAY[]::jsonb[],
  similarity_score NUMERIC DEFAULT 0,
  
  -- Record management
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor group entries (mapping between competitors and groups)
CREATE TABLE competitor_group_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES competitor_groups(id) ON DELETE CASCADE,
  competitor_analysis_id UUID REFERENCES competitor_analyses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, competitor_analysis_id)
);

-- Competitor notes
CREATE TABLE competitor_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_analysis_id UUID REFERENCES competitor_analyses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  important BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitor analysis logs
CREATE TABLE competitor_analysis_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_analysis_id UUID NOT NULL REFERENCES competitor_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_provider TEXT NOT NULL,
  prompt TEXT,
  response JSONB,
  tokens_used INTEGER,
  cost NUMERIC,
  source_citations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market analyses
CREATE TABLE market_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market size analyses
CREATE TABLE market_size_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  region TEXT NOT NULL,
  target_customer TEXT NOT NULL,
  time_frame TEXT NOT NULL,
  additional_context TEXT,
  total_market_size NUMERIC,
  growth_rate NUMERIC,
  market_segments JSONB DEFAULT '[]'::jsonb,
  key_factors JSONB DEFAULT '[]'::jsonb,
  results JSONB,
  results_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  confidence_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Price testing analyses
CREATE TABLE price_testing_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  target_market TEXT NOT NULL,
  price_range_low NUMERIC NOT NULL,
  price_range_high NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  competitor_names TEXT[] DEFAULT '{}'::text[],
  pricing_strategies JSONB DEFAULT '[]'::jsonb,
  market_positioning JSONB DEFAULT '{}'::jsonb,
  additional_context TEXT,
  revenue_maximizing_price NUMERIC,
  profit_maximizing_price NUMERIC,
  price_elasticity NUMERIC,
  results JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Customer personas
CREATE TABLE customer_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_description TEXT NOT NULL,
  target_market TEXT NOT NULL,
  pain_points TEXT NOT NULL,
  additional_notes TEXT,
  include_demographics BOOLEAN DEFAULT TRUE,
  include_psychographics BOOLEAN DEFAULT TRUE,
  include_behavioral BOOLEAN DEFAULT TRUE,
  personas JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Trend analyses
CREATE TABLE trend_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  time_frame TEXT NOT NULL,
  specific_trends TEXT,
  additional_context TEXT,
  include_competitor_impact BOOLEAN DEFAULT TRUE,
  include_recommendations BOOLEAN DEFAULT TRUE,
  include_data_visualization BOOLEAN DEFAULT TRUE,
  trends JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Geographic analyses
CREATE TABLE geographic_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  industry TEXT NOT NULL,
  additional_context TEXT,
  include_demographics BOOLEAN NOT NULL DEFAULT TRUE,
  include_economic_indicators BOOLEAN NOT NULL DEFAULT TRUE,
  include_market_penetration BOOLEAN NOT NULL DEFAULT TRUE,
  demographic_data JSONB DEFAULT '{}'::jsonb,
  economic_indicators JSONB DEFAULT '{}'::jsonb,
  market_penetration JSONB DEFAULT '{}'::jsonb,
  business_confidence_index NUMERIC,
  results JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model versions
CREATE TABLE model_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  current_version VARCHAR(100) NOT NULL,
  latest_version VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'current',
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, model_name)
);

-- Microservices configuration
CREATE TABLE microservices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  service_description TEXT,
  base_url TEXT NOT NULL,
  version TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_external BOOLEAN NOT NULL DEFAULT FALSE,
  health_check_path TEXT,
  swagger_url TEXT,
  readme_url TEXT,
  documentation TEXT,
  api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Microservice endpoints
CREATE TABLE microservice_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  microservice_id UUID NOT NULL REFERENCES microservices(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  description TEXT,
  parameters JSONB,
  response_schema JSONB,
  auth_required BOOLEAN NOT NULL DEFAULT TRUE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  requires_auth BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System components status
CREATE TABLE system_components_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational',
  last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_incident TIMESTAMP WITH TIME ZONE,
  uptime_percentage NUMERIC DEFAULT 100,
  latency INTEGER
);

-- System alerts
CREATE TABLE system_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- System performance metrics
CREATE TABLE system_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  cpu_usage NUMERIC NOT NULL DEFAULT 0,
  memory_usage NUMERIC NOT NULL DEFAULT 0,
  disk_usage NUMERIC NOT NULL DEFAULT 0
);

-- Feature flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate link monitoring
CREATE TABLE affiliate_link_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_name TEXT NOT NULL,
  affiliate_id TEXT NOT NULL,
  link_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate program alerts
CREATE TABLE affiliate_program_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_name TEXT NOT NULL,
  message TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'info',
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI templates
CREATE TABLE ai_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL,
  prompt_template TEXT,
  fields JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Code embeddings for AI assistance
CREATE TABLE code_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  embedding_model TEXT,
  token_count INTEGER,
  processing_time_ms INTEGER,
  metadata JSONB,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Code embedding history
CREATE TABLE code_embedding_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  embedding_id UUID REFERENCES code_embeddings(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  commit_hash TEXT,
  commit_message TEXT,
  repository TEXT,
  branch TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Embeddings status
CREATE TABLE embeddings_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_embeddings INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  status TEXT,
  error_message TEXT,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Color theme accents
CREATE TABLE color_accents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================
-- VIEWS DEFINITION
-- ==================

-- View for competitor analyses
CREATE VIEW v_competitor_analyses AS
SELECT 
  id, 
  user_id, 
  competitor_name, 
  status, 
  data, 
  created_at, 
  updated_at,
  data_quality_score,
  market_presence_score,
  growth_stage,
  position_type,
  url_verified,
  channels,
  platforms,
  coverage_areas,
  online_presence_platforms,
  market_trends,
  industry_trends,
  industry_classification,
  value_proposition,
  notes,
  funding_info
FROM competitor_analyses
WHERE deleted_at IS NULL;

-- ==================
-- FUNCTIONS
-- ==================

-- Function to match code embeddings
CREATE OR REPLACE FUNCTION public.match_code_embeddings(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id uuid,
  file_path text,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.file_path,
    ce.content,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM code_embeddings ce
  WHERE
    ce.deleted_at IS NULL AND
    ce.user_id = p_user_id AND
    1 - (ce.embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Function to get competitor analysis by ID or name
CREATE OR REPLACE FUNCTION public.get_competitor_analysis_details_by_id_or_name(identifier text)
RETURNS SETOF competitor_analyses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_uuid BOOLEAN;
BEGIN
  -- Check if the identifier is a valid UUID
  is_uuid := identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  
  -- If it's a UUID, try to find by ID first
  IF is_uuid THEN
    RETURN QUERY
    SELECT *
    FROM competitor_analyses
    WHERE id = identifier::UUID
    AND deleted_at IS NULL;
    
    -- If no results, try to find by name
    IF NOT FOUND THEN
      RETURN QUERY
      SELECT *
      FROM competitor_analyses
      WHERE competitor_name ILIKE '%' || identifier || '%'
      AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;
  ELSE
    -- If not a UUID, search by name
    RETURN QUERY
    SELECT *
    FROM competitor_analyses
    WHERE competitor_name ILIKE '%' || identifier || '%'
    AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN;
END;
$$;

-- Function to increment analysis attempt counter
CREATE OR REPLACE FUNCTION public.increment_analysis_attempt(analysis_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get the current attempt count
  SELECT analysis_attempt_count INTO current_count
  FROM competitor_analyses
  WHERE id = analysis_id;
  
  -- Increment and update
  UPDATE competitor_analyses
  SET analysis_attempt_count = COALESCE(current_count, 0) + 1
  WHERE id = analysis_id;
  
  RETURN COALESCE(current_count, 0) + 1;
END;
$$;

-- Function to get system health report
CREATE OR REPLACE FUNCTION public.get_system_health_report()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  db_size BIGINT;
  table_counts JSONB;
  user_count INTEGER;
  active_connections INTEGER;
  system_uptime TEXT;
  result JSONB;
BEGIN
  -- Get database size
  SELECT pg_database_size(current_database()) INTO db_size;
  
  -- Get table counts
  SELECT jsonb_build_object(
    'users', (SELECT count(*) FROM auth.users),
    'competitor_analyses', (SELECT count(*) FROM competitor_analyses),
    'api_keys', (SELECT count(*) FROM api_keys),
    'market_analyses', (SELECT count(*) FROM market_analyses)
  ) INTO table_counts;
  
  -- Get user count
  SELECT count(*) FROM auth.users INTO user_count;
  
  -- Get active connections
  SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() INTO active_connections;
  
  -- Get system uptime
  SELECT pg_postmaster_start_time()::text INTO system_uptime;
  
  -- Build the result
  result := jsonb_build_object(
    'timestamp', now(),
    'database', jsonb_build_object(
      'size_bytes', db_size,
      'size_human', (db_size / (1024*1024))::text || ' MB',
      'active_connections', active_connections,
      'uptime', system_uptime
    ),
    'tables', table_counts,
    'users', jsonb_build_object(
      'total', user_count
    ),
    'status', 'healthy'
  );
  
  RETURN result;
END;
$$;

-- ==================
-- RLS POLICIES
-- ==================

-- RLS policy for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS policy for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policy for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policy for competitor_analyses
ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own analyses"
  ON competitor_analyses FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analyses"
  ON competitor_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analyses"
  ON competitor_analyses FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analyses"
  ON competitor_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policy for market_analyses
ALTER TABLE market_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own market analyses"
  ON market_analyses FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own market analyses"
  ON market_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own market analyses"
  ON market_analyses FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own market analyses"
  ON market_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policy for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chat messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policy for code_embeddings
ALTER TABLE code_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own code embeddings"
  ON code_embeddings FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own code embeddings"
  ON code_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own code embeddings"
  ON code_embeddings FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own code embeddings"
  ON code_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- ==================
-- TRIGGERS
-- ==================

-- Timestamp update trigger for competitor_analyses
CREATE TRIGGER set_timestamp_competitor_analyses
BEFORE UPDATE ON competitor_analyses
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Timestamp update trigger for market_analyses
CREATE TRIGGER set_timestamp_market_analyses
BEFORE UPDATE ON market_analyses
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Timestamp update trigger for chat_messages
CREATE TRIGGER set_timestamp_chat_messages
BEFORE UPDATE ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Timestamp update trigger for api_status_checks
CREATE TRIGGER set_timestamp_api_status_checks
BEFORE UPDATE ON api_status_checks
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ==================
-- INITIAL DATA
-- ==================

-- Insert initial model versions
INSERT INTO model_versions (provider, model_name, current_version, status)
VALUES
  ('openai', 'gpt-3.5-turbo', '0613', 'current'),
  ('openai', 'gpt-4', '0613', 'current'),
  ('anthropic', 'claude-instant-1', '1.0', 'current'),
  ('anthropic', 'claude-3-opus', '20240229', 'current'),
  ('anthropic', 'claude-3-sonnet', '20240229', 'current'),
  ('anthropic', 'claude-3-haiku', '20240307', 'current'),
  ('gemini', 'gemini-pro', '1.0', 'current'),
  ('perplexity', 'sonar-small-online', '1.0', 'current'),
  ('perplexity', 'sonar-medium-online', '1.0', 'current');

-- Insert initial system components status
INSERT INTO system_components_status (name, status)
VALUES
  ('Database', 'operational'),
  ('API Services', 'operational'),
  ('Authentication', 'operational'),
  ('File Storage', 'operational'),
  ('AI Services', 'operational');

-- Create a profile record for each user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = PUBLIC
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
