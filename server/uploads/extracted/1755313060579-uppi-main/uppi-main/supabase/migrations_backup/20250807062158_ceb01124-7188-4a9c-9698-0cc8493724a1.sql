-- Create internationalization and localization tables
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  locale TEXT NOT NULL,
  value TEXT NOT NULL,
  namespace TEXT DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(key, locale, namespace)
);

-- Enable RLS
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Create policies for translations
CREATE POLICY "Anyone can read translations" 
ON translations FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage translations" 
ON translations FOR ALL 
USING (((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])) OR (auth.role() = 'service_role'::text));

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  time_format TEXT DEFAULT '12h',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user preferences
CREATE POLICY "Users can manage their own preferences" 
ON user_preferences FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create business intelligence and reporting tables
CREATE TABLE custom_reports (
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

-- Enable RLS
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for custom reports
CREATE POLICY "Users can manage their own reports" 
ON custom_reports FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view shared reports" 
ON custom_reports FOR SELECT 
USING (is_shared = true OR auth.uid() = user_id);

CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL, -- daily, weekly, monthly
  recipients TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for report schedules
CREATE POLICY "Users can manage schedules for their reports" 
ON report_schedules FOR ALL 
USING (EXISTS (SELECT 1 FROM custom_reports WHERE id = report_id AND user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM custom_reports WHERE id = report_id AND user_id = auth.uid()));

-- Create enterprise features tables
CREATE TABLE sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  provider TEXT NOT NULL, -- saml, oidc, google, microsoft
  domain TEXT NOT NULL,
  metadata JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for SSO configurations
CREATE POLICY "Admins can manage SSO configurations" 
ON sso_configurations FOR ALL 
USING (((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])) OR (auth.role() = 'service_role'::text));

-- Add update triggers for all new tables
CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_reports_updated_at
  BEFORE UPDATE ON custom_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_configurations_updated_at
  BEFORE UPDATE ON sso_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();