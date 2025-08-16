-- Phase 25: Transactional Email System - Missing Core Tables
-- Email Templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}',
  category TEXT DEFAULT 'transactional',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email Queue
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, sent, failed, retrying
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for email templates
CREATE POLICY "Admins can manage email templates" ON email_templates FOR ALL USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));
CREATE POLICY "Service role full access on email templates" ON email_templates FOR ALL USING (auth.role() = 'service_role');

-- RLS policies for email queue
CREATE POLICY "Service role full access on email queue" ON email_queue FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can view email queue" ON email_queue FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- Create indexes
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);