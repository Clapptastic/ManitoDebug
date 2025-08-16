-- Phase 2: Enterprise Features Tables
-- Create SSO configurations table
CREATE TABLE IF NOT EXISTS public.sso_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  provider TEXT NOT NULL,
  provider_config JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table for compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing subscriptions table
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance reports table
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  report_type TEXT NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  generated_by UUID NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'generated',
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

-- SSO Configurations policies
CREATE POLICY "Org admins can manage SSO configs" 
ON public.sso_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.organization_members om ON o.id = om.organization_id
    WHERE o.id = sso_configurations.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin')
    AND om.is_active = true
  )
);

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

CREATE POLICY "Service role can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Billing subscriptions policies
CREATE POLICY "Users can view their own subscriptions" 
ON public.billing_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" 
ON public.billing_subscriptions 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

CREATE POLICY "Service role can manage subscriptions" 
ON public.billing_subscriptions 
FOR ALL 
USING (auth.role() = 'service_role');

-- Compliance reports policies
CREATE POLICY "Org members can view compliance reports" 
ON public.compliance_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.organization_members om ON o.id = om.organization_id
    WHERE o.id = compliance_reports.organization_id 
    AND om.user_id = auth.uid() 
    AND om.is_active = true
  )
);

CREATE POLICY "Org admins can manage compliance reports" 
ON public.compliance_reports 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.organization_members om ON o.id = om.organization_id
    WHERE o.id = compliance_reports.organization_id 
    AND om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin')
    AND om.is_active = true
  )
);

-- Add update triggers
CREATE TRIGGER update_sso_configurations_updated_at
  BEFORE UPDATE ON public.sso_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_subscriptions_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_reports_updated_at
  BEFORE UPDATE ON public.compliance_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();