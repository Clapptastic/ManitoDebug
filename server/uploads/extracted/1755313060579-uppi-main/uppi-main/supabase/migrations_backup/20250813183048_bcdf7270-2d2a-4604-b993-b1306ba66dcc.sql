-- Clean up duplicate RLS policies for prompts table to improve performance
DROP POLICY IF EXISTS "Admins can manage prompts" ON public.prompts;
DROP POLICY IF EXISTS "Authenticated read - prompts" ON public.prompts;
DROP POLICY IF EXISTS "Authenticated users can read prompts" ON public.prompts;
DROP POLICY IF EXISTS "Service role full access - prompts" ON public.prompts;
DROP POLICY IF EXISTS "prompts_admin_manage" ON public.prompts;
DROP POLICY IF EXISTS "prompts_delete_super_admin" ON public.prompts;
DROP POLICY IF EXISTS "prompts_insert_super_admin" ON public.prompts;
DROP POLICY IF EXISTS "prompts_select_authenticated" ON public.prompts;
DROP POLICY IF EXISTS "prompts_select_super_admin_or_service" ON public.prompts;
DROP POLICY IF EXISTS "prompts_service_role_all" ON public.prompts;
DROP POLICY IF EXISTS "prompts_update_super_admin" ON public.prompts;

-- Create simplified, efficient RLS policies
-- Super admin access (includes hardcoded user ID for current super admin)
CREATE POLICY "super_admin_full_access" ON public.prompts
FOR ALL
TO public
USING (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text 
  OR get_user_role(auth.uid()) = 'super_admin'::text
  OR auth.role() = 'service_role'::text
)
WITH CHECK (
  auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text 
  OR get_user_role(auth.uid()) = 'super_admin'::text
  OR auth.role() = 'service_role'::text
);

-- Admin read/write access
CREATE POLICY "admin_access" ON public.prompts
FOR ALL
TO public
USING (get_user_role(auth.uid()) = 'admin'::text)
WITH CHECK (get_user_role(auth.uid()) = 'admin'::text);

-- Authenticated users read-only access
CREATE POLICY "authenticated_read_only" ON public.prompts
FOR SELECT
TO authenticated
USING (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_domain_key ON public.prompts(domain, key);
CREATE INDEX IF NOT EXISTS idx_prompts_is_active ON public.prompts(is_active) WHERE is_active = true;