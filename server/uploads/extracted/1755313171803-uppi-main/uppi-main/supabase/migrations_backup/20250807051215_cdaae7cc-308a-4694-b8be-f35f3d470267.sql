-- Phase 0: Foundation Database Migrations
-- Creating missing foundational tables

-- 0.1.1.8: Customer Support System Tables
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT CHECK (category IN ('billing', 'technical', 'feature_request', 'bug_report')),
  assigned_to UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 0.1.1.9: Internationalization and Localization Tables
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

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  time_format TEXT DEFAULT '12h',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 0.1.1.10: Business Intelligence and Reporting Tables
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

CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  recipients TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 0.1.1.11: Enterprise Features Tables
CREATE TABLE IF NOT EXISTS sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  provider TEXT NOT NULL CHECK (provider IN ('saml', 'oidc', 'google', 'microsoft')),
  domain TEXT NOT NULL,
  metadata JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Support System
CREATE POLICY "Users can view their own support tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own support tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own support tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all support tickets" ON support_tickets FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR auth.role() = 'service_role');

-- RLS Policies for Support Messages
CREATE POLICY "Users can view messages for their tickets" ON support_ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create messages for their tickets" ON support_ticket_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all ticket messages" ON support_ticket_messages FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR auth.role() = 'service_role');

-- RLS Policies for Knowledge Base
CREATE POLICY "Anyone can view published knowledge base articles" ON knowledge_base_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all knowledge base articles" ON knowledge_base_articles FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR auth.role() = 'service_role');

-- RLS Policies for Translations
CREATE POLICY "Anyone can view translations" ON translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage translations" ON translations FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR auth.role() = 'service_role');

-- RLS Policies for User Preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all preferences" ON user_preferences FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for Custom Reports
CREATE POLICY "Users can manage their own reports" ON custom_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view shared reports" ON custom_reports FOR SELECT USING (is_shared = true);
CREATE POLICY "Admins can manage all reports" ON custom_reports FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR auth.role() = 'service_role');

-- RLS Policies for Report Schedules
CREATE POLICY "Users can manage schedules for their reports" ON report_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM custom_reports WHERE id = report_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all report schedules" ON report_schedules FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR auth.role() = 'service_role');

-- RLS Policies for SSO Configurations
CREATE POLICY "Admins can manage SSO configurations" ON sso_configurations FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR auth.role() = 'service_role');

-- Add updated_at triggers
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_base_articles_updated_at BEFORE UPDATE ON knowledge_base_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sso_configurations_updated_at BEFORE UPDATE ON sso_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();