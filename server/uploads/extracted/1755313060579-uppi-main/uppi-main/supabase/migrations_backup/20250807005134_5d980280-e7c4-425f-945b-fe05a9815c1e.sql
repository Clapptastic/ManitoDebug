-- PHASE 0.1.1.1: Create business_tools_usage table with RLS policies
CREATE TABLE IF NOT EXISTS business_tools_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE business_tools_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_tools_usage
CREATE POLICY "Users can manage their own business tools usage"
ON business_tools_usage
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to business tools usage"
ON business_tools_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- PHASE 0.1.1.2: Create mvp_projects table with RLS policies
CREATE TABLE IF NOT EXISTS mvp_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE mvp_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for mvp_projects
CREATE POLICY "Users can manage their own MVP projects"
ON mvp_projects
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to MVP projects"
ON mvp_projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- PHASE 0.1.1.3: Create scale_metrics table with RLS policies
CREATE TABLE IF NOT EXISTS scale_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES mvp_projects(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL, -- performance, user, revenue, growth
  measurement_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE scale_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for scale_metrics
CREATE POLICY "Users can manage their own scale metrics"
ON scale_metrics
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to scale metrics"
ON scale_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_tools_usage_user_id ON business_tools_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_business_tools_usage_tool_name ON business_tools_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_mvp_projects_user_id ON mvp_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_mvp_projects_status ON mvp_projects(status);
CREATE INDEX IF NOT EXISTS idx_scale_metrics_user_id ON scale_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_scale_metrics_project_id ON scale_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_scale_metrics_metric_type ON scale_metrics(metric_type);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_tools_usage_updated_at
  BEFORE UPDATE ON business_tools_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mvp_projects_updated_at
  BEFORE UPDATE ON mvp_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scale_metrics_updated_at
  BEFORE UPDATE ON scale_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();