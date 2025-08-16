-- Create frontend_permissions table to store what each user role can see/do
CREATE TABLE IF NOT EXISTS public.frontend_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name TEXT NOT NULL,
  component_path TEXT NOT NULL,
  description TEXT,
  user_role USER-DEFINED NOT NULL, -- references the user_role enum
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique combinations of component_path and user_role
  UNIQUE(component_path, user_role)
);

-- Enable RLS
ALTER TABLE public.frontend_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins only
CREATE POLICY "Only super admins can manage frontend permissions"
ON public.frontend_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_frontend_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_frontend_permissions_updated_at
  BEFORE UPDATE ON public.frontend_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_frontend_permissions_updated_at();

-- Insert default permissions for key features
INSERT INTO public.frontend_permissions (feature_name, component_path, description, user_role, is_visible, is_enabled) VALUES
-- Dashboard & Analytics
('Main Dashboard', '/dashboard', 'Primary dashboard with overview widgets', 'user', true, true),
('Main Dashboard', '/dashboard', 'Primary dashboard with overview widgets', 'admin', true, true),
('Main Dashboard', '/dashboard', 'Primary dashboard with overview widgets', 'super_admin', true, true),

('Analytics Page', '/analytics', 'Detailed analytics and reports', 'user', false, false),
('Analytics Page', '/analytics', 'Detailed analytics and reports', 'admin', true, true),
('Analytics Page', '/analytics', 'Detailed analytics and reports', 'super_admin', true, true),

-- Market Research
('Competitor Analysis', '/market-research/competitor-analysis', 'AI-powered competitor research', 'user', true, true),
('Competitor Analysis', '/market-research/competitor-analysis', 'AI-powered competitor research', 'admin', true, true),
('Competitor Analysis', '/market-research/competitor-analysis', 'AI-powered competitor research', 'super_admin', true, true),

('Master Company Profiles', '/admin/master-profiles', 'Consolidated company intelligence', 'user', false, false),
('Master Company Profiles', '/admin/master-profiles', 'Consolidated company intelligence', 'admin', false, false),
('Master Company Profiles', '/admin/master-profiles', 'Consolidated company intelligence', 'super_admin', true, true),

-- AI Tools
('AI Chatbot', '/ai-chatbot', 'Business guidance chatbot', 'user', true, true),
('AI Chatbot', '/ai-chatbot', 'Business guidance chatbot', 'admin', true, true),
('AI Chatbot', '/ai-chatbot', 'Business guidance chatbot', 'super_admin', true, true),

('Business Plan Generator', '/business-plan', 'AI-assisted business plan creation', 'user', true, true),
('Business Plan Generator', '/business-plan', 'AI-assisted business plan creation', 'admin', true, true),
('Business Plan Generator', '/business-plan', 'AI-assisted business plan creation', 'super_admin', true, true),

-- Admin Tools
('User Management', '/admin/user-management', 'Manage users and roles', 'user', false, false),
('User Management', '/admin/user-management', 'Manage users and roles', 'admin', true, true),
('User Management', '/admin/user-management', 'Manage users and roles', 'super_admin', true, true),

('API Management', '/admin/api-management', 'API keys and integrations', 'user', false, false),
('API Management', '/admin/api-management', 'API keys and integrations', 'admin', true, true),
('API Management', '/admin/api-management', 'API keys and integrations', 'super_admin', true, true),

('System Health', '/admin/system-health', 'System monitoring and health checks', 'user', false, false),
('System Health', '/admin/system-health', 'System monitoring and health checks', 'admin', true, false),
('System Health', '/admin/system-health', 'System monitoring and health checks', 'super_admin', true, true),

('Security Audit', '/admin/security', 'Security monitoring and audit logs', 'user', false, false),
('Security Audit', '/admin/security', 'Security monitoring and audit logs', 'admin', false, false),
('Security Audit', '/admin/security', 'Security monitoring and audit logs', 'super_admin', true, true),

('Permissions Management', '/admin/permissions', 'Manage user role permissions', 'user', false, false),
('Permissions Management', '/admin/permissions', 'Manage user role permissions', 'admin', false, false),
('Permissions Management', '/admin/permissions', 'Manage user role permissions', 'super_admin', true, true)

ON CONFLICT (component_path, user_role) DO NOTHING;