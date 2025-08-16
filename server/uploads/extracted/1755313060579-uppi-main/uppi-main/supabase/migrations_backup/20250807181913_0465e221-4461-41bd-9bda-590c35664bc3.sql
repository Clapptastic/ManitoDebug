-- Phase 15: Data Management Tables (missing tables)
-- Backup Jobs
CREATE TABLE backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- full, incremental, differential
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  backup_location TEXT,
  size_bytes BIGINT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 16: Marketing & Growth Tables (missing tables)
-- User Segments
CREATE TABLE user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  user_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Marketing Campaigns  
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- email, push, in_app
  target_segment_id UUID REFERENCES user_segments(id),
  status TEXT DEFAULT 'draft', -- draft, scheduled, running, completed, cancelled
  scheduled_at TIMESTAMPTZ,
  content JSONB NOT NULL,
  metrics JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 17: API Rate Limiting Tables
-- Rate Limits
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL,
  limit_per_minute INTEGER NOT NULL,
  limit_per_hour INTEGER NOT NULL,
  limit_per_day INTEGER NOT NULL,
  current_usage JSONB DEFAULT '{"minute": 0, "hour": 0, "day": 0}',
  reset_minute TIMESTAMPTZ,
  reset_hour TIMESTAMPTZ,
  reset_day TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usage Quotas
CREATE TABLE usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  service_type TEXT NOT NULL, -- ai_api, storage, bandwidth
  quota_limit BIGINT NOT NULL,
  current_usage BIGINT DEFAULT 0,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  overage_allowed BOOLEAN DEFAULT false,
  overage_rate DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 18: Advanced Search Tables
-- Search Indexes
CREATE TABLE search_indexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_name TEXT NOT NULL UNIQUE,
  table_name TEXT NOT NULL,
  columns TEXT[] NOT NULL,
  search_config TEXT DEFAULT 'english',
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved Searches
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  sort_order JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 19: Workflow Automation Tables
-- Workflow Executions
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id),
  trigger_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  execution_log JSONB DEFAULT '[]',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 20: Mobile App Support Tables
-- Device Registrations
CREATE TABLE device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  device_token TEXT NOT NULL,
  device_type TEXT NOT NULL, -- ios, android, web
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Push Notifications
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  device_registration_id UUID REFERENCES device_registrations(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 21: Data Import/Export Tables
-- Import Jobs
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  import_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  status TEXT DEFAULT 'pending', -- pending, validating, processing, completed, failed
  validation_errors JSONB DEFAULT '[]',
  processed_rows INTEGER DEFAULT 0,
  total_rows INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 22: Multi-Tenant Architecture Tables
-- Tenant Configurations
CREATE TABLE tenant_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  tenant_name TEXT NOT NULL,
  domain TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  resource_limits JSONB DEFAULT '{}',
  billing_plan TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tenant Users
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenant_configurations(tenant_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'user',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Phase 23: Performance Optimization Tables
-- Cache Configurations
CREATE TABLE cache_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  cache_type TEXT NOT NULL, -- redis, memory, database
  ttl_seconds INTEGER NOT NULL,
  eviction_policy TEXT DEFAULT 'lru',
  max_size_mb INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Phase 24: Content Management Tables
-- Content Items
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL, -- article, page, snippet
  body TEXT,
  excerpt TEXT,
  status TEXT DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id),
  editor_id UUID REFERENCES auth.users(id),
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content Categories
CREATE TABLE content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES content_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content Item Categories (many-to-many)
CREATE TABLE content_item_categories (
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  category_id UUID REFERENCES content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_item_id, category_id)
);

-- Phase 25: Transactional Email Tables
-- Email Events
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES email_queue(id),
  event_type TEXT NOT NULL, -- sent, delivered, opened, clicked, bounced, complained
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email Preferences
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'subscribed', -- subscribed, unsubscribed, bounced
  categories JSONB DEFAULT '{}', -- preferences per email category
  frequency TEXT DEFAULT 'immediate', -- immediate, daily, weekly, never
  unsubscribe_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, email_address)
);

-- Enable RLS on all new tables
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user-specific tables
CREATE POLICY "Users can manage their own saved searches" ON saved_searches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own device registrations" ON device_registrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own push notifications" ON push_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own import jobs" ON import_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own email preferences" ON email_preferences FOR ALL USING (auth.uid() = user_id);

-- Admin-only policies
CREATE POLICY "Admins can view backup jobs" ON backup_jobs FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage marketing campaigns" ON marketing_campaigns FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage user segments" ON user_segments FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage rate limits" ON rate_limits FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage usage quotas" ON usage_quotas FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage search indexes" ON search_indexes FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage tenant configurations" ON tenant_configurations FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage cache configurations" ON cache_configurations FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Admins can manage content items" ON content_items FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Anyone can view published content" ON content_items FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage content categories" ON content_categories FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Anyone can view active categories" ON content_categories FOR SELECT USING (is_active = true);

-- Service role policies for background operations
CREATE POLICY "Service role full access on workflow executions" ON workflow_executions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on push notifications" ON push_notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on email events" ON email_events FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_user_segments_created_by ON user_segments(created_by);
CREATE INDEX idx_marketing_campaigns_target_segment ON marketing_campaigns(target_segment_id);
CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX idx_usage_quotas_user_service ON usage_quotas(user_id, service_type);
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_device_registrations_user_id ON device_registrations(user_id);
CREATE INDEX idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_content_items_slug ON content_items(slug);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_categories_parent_id ON content_categories(parent_id);
CREATE INDEX idx_email_events_queue_id ON email_events(queue_id);
CREATE INDEX idx_email_preferences_user_id ON email_preferences(user_id);