-- Fix RLS for prompts and prompt_versions so super admins and service role can read/write
-- Ensures /admin/prompts loads real application data

-- Enable RLS (idempotent)
ALTER TABLE IF EXISTS public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Policy for prompts: super_admin/admin and service_role full access
DO $$ BEGIN
  CREATE POLICY "Super admin can manage prompts"
  ON public.prompts
  FOR ALL
  USING ( ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR (auth.role() = 'service_role') )
  WITH CHECK ( ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR (auth.role() = 'service_role') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policy for prompt_versions: super_admin/admin and service_role full access
DO $$ BEGIN
  CREATE POLICY "Super admin can manage prompt versions"
  ON public.prompt_versions
  FOR ALL
  USING ( ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR (auth.role() = 'service_role') )
  WITH CHECK ( ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR (auth.role() = 'service_role') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
