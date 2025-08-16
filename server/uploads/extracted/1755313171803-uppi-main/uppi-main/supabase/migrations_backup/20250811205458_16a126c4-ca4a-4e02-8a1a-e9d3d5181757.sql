-- RLS fixes for prompts and prompt_versions to unblock edge function access
-- Enable Row Level Security on target tables
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Service role full access (read/write) policies
DROP POLICY IF EXISTS "prompts_service_role_all" ON public.prompts;
CREATE POLICY "prompts_service_role_all"
ON public.prompts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "prompt_versions_service_role_all" ON public.prompt_versions;
CREATE POLICY "prompt_versions_service_role_all"
ON public.prompt_versions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow SELECT for all authenticated users (read-only)
DROP POLICY IF EXISTS "prompts_select_authenticated" ON public.prompts;
CREATE POLICY "prompts_select_authenticated"
ON public.prompts
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "prompt_versions_select_authenticated" ON public.prompt_versions;
CREATE POLICY "prompt_versions_select_authenticated"
ON public.prompt_versions
FOR SELECT
TO authenticated
USING (true);

-- Admins (and super_admins) can manage prompts via application roles
DROP POLICY IF EXISTS "prompts_admin_manage" ON public.prompts;
CREATE POLICY "prompts_admin_manage"
ON public.prompts
FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']))
WITH CHECK (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']));

DROP POLICY IF EXISTS "prompt_versions_admin_manage" ON public.prompt_versions;
CREATE POLICY "prompt_versions_admin_manage"
ON public.prompt_versions
FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']))
WITH CHECK (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']));