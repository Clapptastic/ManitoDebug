-- Create missing tables for Phase 0
-- First create business_tools_usage if it doesn't exist
CREATE TABLE IF NOT EXISTS business_tools_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create scale_metrics if it doesn't exist (without project_id reference for now)
CREATE TABLE IF NOT EXISTS scale_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID, -- Will add foreign key reference later
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL, -- performance, user, revenue, growth
  measurement_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_name TEXT NOT NULL,
  resource_type TEXT, -- table, function, page, feature
  resource_id TEXT,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission_name, resource_type, resource_id)
);

-- Create test_results table (without project_id reference for now)
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL, -- unit, integration, e2e, performance
  status TEXT NOT NULL, -- passed, failed, skipped
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  project_id UUID, -- Will add foreign key reference later
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE business_tools_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE scale_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_tools_usage_user_id ON business_tools_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_business_tools_usage_tool_name ON business_tools_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_scale_metrics_user_id ON scale_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_scale_metrics_metric_type ON scale_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_name ON user_permissions(permission_name);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);