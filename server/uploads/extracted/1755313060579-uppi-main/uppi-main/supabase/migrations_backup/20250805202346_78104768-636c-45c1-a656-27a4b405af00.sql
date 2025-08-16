-- Comprehensive RLS audit and update for super admin access
-- This ensures super admins have full access to all admin panel data

-- First, let's check and update all admin-related tables

-- 1. Admin audit log - ensure super admins can manage all audit logs
DROP POLICY IF EXISTS "Super admin can manage audit logs" ON public.admin_audit_log;
CREATE POLICY "Super admin can manage audit logs"
ON public.admin_audit_log
FOR ALL
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 2. Admin permissions - ensure super admins can manage all permissions
DROP POLICY IF EXISTS "Super admin can manage admin permissions" ON public.admin_permissions;
CREATE POLICY "Super admin can manage admin permissions"
ON public.admin_permissions
FOR ALL
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 3. User roles - ensure super admins can manage all user roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can manage user roles" ON public.user_roles;
CREATE POLICY "Super admin can manage user roles"
ON public.user_roles
FOR ALL
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 4. Edge function metrics - ensure super admins can view all metrics
DROP POLICY IF EXISTS "Super admin can view all function metrics" ON public.edge_function_metrics;
CREATE POLICY "Super admin can view all function metrics"
ON public.edge_function_metrics
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 5. Feature flags - ensure super admins can manage all feature flags
DROP POLICY IF EXISTS "Admin can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Authenticated users can view feature flags" ON public.feature_flags;
CREATE POLICY "Super admin can manage feature flags"
ON public.feature_flags
FOR ALL
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

CREATE POLICY "Authenticated users can view feature flags"
ON public.feature_flags
FOR SELECT
USING (auth.role() = 'authenticated');

-- 6. API usage tracking - ensure super admins can view all tracking data
DROP POLICY IF EXISTS "Authenticated users can view api usage" ON public.api_usage_tracking;
CREATE POLICY "Super admin can view all api usage"
ON public.api_usage_tracking
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 7. Data exports - ensure super admins can view all exports
DROP POLICY IF EXISTS "Users can view their own data exports" ON public.data_exports;
DROP POLICY IF EXISTS "Users can update their own data exports" ON public.data_exports;
DROP POLICY IF EXISTS "Users can insert their own data exports" ON public.data_exports;

CREATE POLICY "Super admin can manage all data exports"
ON public.data_exports
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 8. Account deletion requests - ensure super admins can manage all requests
DROP POLICY IF EXISTS "Users can view their own deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Users can update their own deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Users can insert their own deletion requests" ON public.account_deletion_requests;

CREATE POLICY "Super admin can manage all deletion requests"
ON public.account_deletion_requests
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 9. Application settings - ensure super admins can view all user settings
DROP POLICY IF EXISTS "Users can view their own application settings" ON public.application_settings;
DROP POLICY IF EXISTS "Users can update their own application settings" ON public.application_settings;
DROP POLICY IF EXISTS "Users can insert their own application settings" ON public.application_settings;

CREATE POLICY "Super admin can manage all application settings"
ON public.application_settings
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 10. Integration settings - ensure super admins can view all integrations
DROP POLICY IF EXISTS "Users can view their own integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Users can update their own integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Users can insert their own integration settings" ON public.integration_settings;

CREATE POLICY "Super admin can manage all integration settings"
ON public.integration_settings
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 11. API keys - ensure super admins can view all API keys
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;

CREATE POLICY "Super admin can manage all API keys"
ON public.api_keys
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 12. AI validation logs - ensure super admins can view all logs
DROP POLICY IF EXISTS "Users can view their own validation logs" ON public.ai_validation_logs;
CREATE POLICY "Super admin can view all validation logs"
ON public.ai_validation_logs
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 13. Company profiles - ensure super admins can view all company profiles
DROP POLICY IF EXISTS "Users can view their own company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can update their own company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can insert their own company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can delete their own company profiles" ON public.company_profiles;

CREATE POLICY "Super admin can manage all company profiles"
ON public.company_profiles
FOR ALL
USING (
  (auth.uid() = user_id) OR
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- 14. Ensure affiliate programs policy allows super admin access
DROP POLICY IF EXISTS "Admins can manage affiliate programs" ON public.affiliate_programs;
CREATE POLICY "Super admin can manage affiliate programs"
ON public.affiliate_programs
FOR ALL
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- Keep existing view policy for affiliate programs
CREATE POLICY "Anyone can view affiliate programs"
ON public.affiliate_programs
FOR SELECT
USING (true);

-- 15. Ensure affiliate links policy allows super admin access
DROP POLICY IF EXISTS "Admins can manage affiliate links" ON public.affiliate_links;
CREATE POLICY "Super admin can manage affiliate links"
ON public.affiliate_links
FOR ALL
USING (
  (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'super_admin'::text])) OR
  (auth.role() = 'service_role')
);

-- Create updated_at trigger for user_roles if it doesn't exist
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();