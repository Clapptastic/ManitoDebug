-- Create feature_flag_audit table to track feature flag changes
CREATE TABLE IF NOT EXISTS public.feature_flag_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  flag_name text NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('global','organization','user')),
  scope_id uuid NULL,
  enabled boolean NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flag_audit ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'feature_flag_audit' AND policyname = 'feature_flag_audit_service_role_all'
  ) THEN
    CREATE POLICY "feature_flag_audit_service_role_all" ON public.feature_flag_audit
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'feature_flag_audit' AND policyname = 'feature_flag_audit_admin_manage'
  ) THEN
    CREATE POLICY "feature_flag_audit_admin_manage" ON public.feature_flag_audit
    FOR ALL
    USING (((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])))
    WITH CHECK (((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'feature_flag_audit' AND policyname = 'feature_flag_audit_admin_read'
  ) THEN
    CREATE POLICY "feature_flag_audit_admin_read" ON public.feature_flag_audit
    FOR SELECT
    USING (((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])));
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_created_at ON public.feature_flag_audit (created_at);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_flag_name ON public.feature_flag_audit (flag_name);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audit_scope ON public.feature_flag_audit (scope_type, scope_id);
