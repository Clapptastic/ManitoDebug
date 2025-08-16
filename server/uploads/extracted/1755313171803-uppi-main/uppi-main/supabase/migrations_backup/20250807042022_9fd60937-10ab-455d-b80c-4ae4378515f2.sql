-- Phase 9: Legal & Compliance Database Tables

-- Legal Documents Management
CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL, -- privacy_policy, terms_of_service, cookie_policy
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Consent Tracking
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  document_id UUID NOT NULL REFERENCES legal_documents(id),
  consent_type TEXT NOT NULL, -- acceptance, marketing, analytics, cookies
  consent_given BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  consent_date TIMESTAMPTZ DEFAULT now(),
  withdrawal_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Cookie Consent Management
CREATE TABLE cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  necessary_cookies BOOLEAN DEFAULT true,
  analytics_cookies BOOLEAN DEFAULT false,
  marketing_cookies BOOLEAN DEFAULT false,
  functional_cookies BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 year')
);

-- Data Processing Activities (GDPR Article 30)
CREATE TABLE data_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL, -- consent, contract, legal_obligation, vital_interests, public_task, legitimate_interests
  data_categories TEXT[] NOT NULL, -- personal_data, sensitive_data, financial_data, etc.
  data_subjects TEXT[] NOT NULL, -- customers, employees, prospects, etc.
  recipients TEXT[] DEFAULT '{}',
  retention_period TEXT,
  security_measures JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data Subject Requests (GDPR)
CREATE TABLE data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  request_type TEXT NOT NULL, -- access, rectification, erasure, portability, restriction, objection
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, rejected
  request_details JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  response_data JSONB DEFAULT '{}',
  notes TEXT
);

-- Compliance Audit Trail
CREATE TABLE compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Data Retention Policies
CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  retention_period_days INTEGER NOT NULL,
  deletion_criteria JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_documents (public read for active documents, admin write)
CREATE POLICY "Public can view active legal documents" 
ON legal_documents FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage legal documents" 
ON legal_documents FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- RLS Policies for user_consents (users can view/manage their own)
CREATE POLICY "Users can view their own consents" 
ON user_consents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents" 
ON user_consents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" 
ON user_consents FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- RLS Policies for cookie_consents (users can manage their own)
CREATE POLICY "Users can manage their own cookie consents" 
ON cookie_consents FOR ALL 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all cookie consents" 
ON cookie_consents FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- RLS Policies for data_processing_activities (admin only)
CREATE POLICY "Admins can manage data processing activities" 
ON data_processing_activities FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- RLS Policies for data_subject_requests (users can manage their own)
CREATE POLICY "Users can manage their own data requests" 
ON data_subject_requests FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all data requests" 
ON data_subject_requests FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- RLS Policies for compliance_audit_logs (admin read only)
CREATE POLICY "Admins can view audit logs" 
ON compliance_audit_logs FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- RLS Policies for data_retention_policies (admin only)
CREATE POLICY "Admins can manage retention policies" 
ON data_retention_policies FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- Create indexes for performance
CREATE INDEX idx_legal_documents_type_active ON legal_documents(document_type, is_active);
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX idx_data_subject_requests_user_id ON data_subject_requests(user_id);
CREATE INDEX idx_compliance_audit_logs_user_id ON compliance_audit_logs(user_id);
CREATE INDEX idx_compliance_audit_logs_created_at ON compliance_audit_logs(created_at);

-- Create triggers for updated_at
CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cookie_consents_updated_at
  BEFORE UPDATE ON cookie_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_processing_activities_updated_at
  BEFORE UPDATE ON data_processing_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();