-- Create business tools usage tracking table
CREATE TABLE IF NOT EXISTS business_tools_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create MVP projects table
CREATE TABLE IF NOT EXISTS mvp_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  project_data JSONB DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  timeline TEXT,
  budget NUMERIC,
  target_market TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create scale metrics table for scaling tools
CREATE TABLE IF NOT EXISTS scale_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES mvp_projects(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create business plans table (if not exists)
CREATE TABLE IF NOT EXISTS business_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  industry TEXT,
  business_model TEXT,
  plan_data JSONB,
  status TEXT DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create market research table (if not exists)
CREATE TABLE IF NOT EXISTS market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  industry TEXT NOT NULL,
  region TEXT DEFAULT 'Global',
  target_market TEXT,
  research_data JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create AI analytics table (if not exists)
CREATE TABLE IF NOT EXISTS ai_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL,
  analytics_data JSONB,
  raw_metrics JSONB,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE business_tools_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scale_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_tools_usage
CREATE POLICY "Users can manage their own business tools usage" ON business_tools_usage
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for mvp_projects
CREATE POLICY "Users can manage their own MVP projects" ON mvp_projects
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for scale_metrics
CREATE POLICY "Users can manage their own scale metrics" ON scale_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for business_plans
CREATE POLICY "Users can manage their own business plans" ON business_plans
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for market_research
CREATE POLICY "Users can manage their own market research" ON market_research
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for ai_analytics
CREATE POLICY "Users can manage their own AI analytics" ON ai_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_tools_usage_updated_at
  BEFORE UPDATE ON business_tools_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mvp_projects_updated_at
  BEFORE UPDATE ON mvp_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_plans_updated_at
  BEFORE UPDATE ON business_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_research_updated_at
  BEFORE UPDATE ON market_research
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_tools_usage_user_id ON business_tools_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_business_tools_usage_tool_name ON business_tools_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_mvp_projects_user_id ON mvp_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_mvp_projects_status ON mvp_projects(status);
CREATE INDEX IF NOT EXISTS idx_scale_metrics_user_id ON scale_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_scale_metrics_project_id ON scale_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_business_plans_user_id ON business_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_market_research_user_id ON market_research(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_user_id ON ai_analytics(user_id);