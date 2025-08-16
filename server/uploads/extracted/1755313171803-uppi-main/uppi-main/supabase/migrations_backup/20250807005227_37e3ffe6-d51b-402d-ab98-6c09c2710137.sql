-- PHASE 0.1.1.4: Create user_permissions table (for future extensibility)
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

-- Enable RLS
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_permissions
CREATE POLICY "Users can view their own permissions"
ON user_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admin can manage all permissions"
ON user_permissions
FOR ALL
TO authenticated
USING ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]))
WITH CHECK ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Service role full access to user permissions"
ON user_permissions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- PHASE 0.1.1.5: Create test_results table for storing test outcomes
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL, -- unit, integration, e2e, performance
  status TEXT NOT NULL, -- passed, failed, skipped
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  project_id UUID REFERENCES mvp_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for test_results
CREATE POLICY "Users can manage their own test results"
ON test_results
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to test results"
ON test_results
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- PHASE 0.1.1.6: Create performance_metrics table for performance tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT, -- ms, mb, percentage, count
  page_url TEXT,
  user_agent TEXT,
  device_type TEXT, -- desktop, mobile, tablet
  project_id UUID REFERENCES mvp_projects(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for performance_metrics
CREATE POLICY "Users can manage their own performance metrics"
ON performance_metrics
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to performance metrics"
ON performance_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_name ON user_permissions(permission_name);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_project_id ON test_results(project_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_project_id ON performance_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);