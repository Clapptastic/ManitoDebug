-- Create only the missing tables since user_preferences already exists

-- Create translations table (internationalization)
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  locale TEXT NOT NULL,
  value TEXT NOT NULL,
  namespace TEXT DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(key, locale, namespace)
);

-- Enable RLS and create policies for translations
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can read translations" 
ON translations FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage translations" 
ON translations FOR ALL 
USING (((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])) OR (auth.role() = 'service_role'::text));

-- Create business intelligence and reporting tables
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  query_config JSONB NOT NULL,
  chart_config JSONB DEFAULT '{}',
  schedule_config JSONB DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and create policies for custom reports
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage their own reports" 
ON custom_reports FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view shared reports" 
ON custom_reports FOR SELECT 
USING (is_shared = true OR auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL, -- daily, weekly, monthly
  recipients TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and create policies for report schedules
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage schedules for their reports" 
ON report_schedules FOR ALL 
USING (EXISTS (SELECT 1 FROM custom_reports WHERE id = report_id AND user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM custom_reports WHERE id = report_id AND user_id = auth.uid()));

-- Create enterprise features tables
CREATE TABLE IF NOT EXISTS sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  provider TEXT NOT NULL, -- saml, oidc, google, microsoft
  domain TEXT NOT NULL,
  metadata JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and create policies for SSO configurations
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can manage SSO configurations" 
ON sso_configurations FOR ALL 
USING (((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])) OR (auth.role() = 'service_role'::text));

-- Create marketing and growth tables
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, running, paused, completed
  variants JSONB NOT NULL DEFAULT '[]',
  traffic_split JSONB DEFAULT '{"control": 50, "variant": 50}',
  target_metric TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and create policies for AB tests
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can manage AB tests" 
ON ab_tests FOR ALL 
USING (((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])) OR (auth.role() = 'service_role'::text));

-- Add update triggers for all new tables
CREATE OR REPLACE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_custom_reports_updated_at
  BEFORE UPDATE ON custom_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_sso_configurations_updated_at
  BEFORE UPDATE ON sso_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON ab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();