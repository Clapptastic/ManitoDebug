-- Create feature_flags with non-reserved column name flag_key
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  description text,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_feature_flags_updated_at'
  ) THEN
    CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feature_flags' AND policyname = 'feature_flags_read'
  ) THEN
    CREATE POLICY "feature_flags_read"
    ON public.feature_flags
    FOR SELECT
    USING (auth.role() = 'authenticated'::text OR (auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feature_flags' AND policyname = 'feature_flags_insert_admin_service'
  ) THEN
    CREATE POLICY "feature_flags_insert_admin_service"
    ON public.feature_flags
    FOR INSERT
    WITH CHECK ((auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feature_flags' AND policyname = 'feature_flags_update_admin_service'
  ) THEN
    CREATE POLICY "feature_flags_update_admin_service"
    ON public.feature_flags
    FOR UPDATE
    USING ((auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()))
    WITH CHECK ((auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feature_flags' AND policyname = 'feature_flags_delete_admin_service'
  ) THEN
    CREATE POLICY "feature_flags_delete_admin_service"
    ON public.feature_flags
    FOR DELETE
    USING ((auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()));
  END IF;
END $$;

INSERT INTO public.feature_flags (flag_key, description, value, is_enabled)
VALUES ('competitor_analysis', 'Global enable/disable for Competitor Analysis feature', '{"version":"v1"}', true)
ON CONFLICT (flag_key) DO NOTHING;

-- Per-user feature gate table
CREATE TABLE IF NOT EXISTS public.user_feature_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  unlocked boolean NOT NULL DEFAULT false,
  version text,
  last_checked timestamptz DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_feature_gates_unique UNIQUE (user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_user_feature_gates_user ON public.user_feature_gates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_gates_feature ON public.user_feature_gates(feature_key);

ALTER TABLE public.user_feature_gates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_feature_gates_updated_at'
  ) THEN
    CREATE TRIGGER update_user_feature_gates_updated_at
    BEFORE UPDATE ON public.user_feature_gates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_gates' AND policyname = 'ufg_select_own'
  ) THEN
    CREATE POLICY "ufg_select_own"
    ON public.user_feature_gates
    FOR SELECT
    USING (auth.uid() = user_id OR (auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_gates' AND policyname = 'ufg_insert_own'
  ) THEN
    CREATE POLICY "ufg_insert_own"
    ON public.user_feature_gates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_gates' AND policyname = 'ufg_update_own'
  ) THEN
    CREATE POLICY "ufg_update_own"
    ON public.user_feature_gates
    FOR UPDATE
    USING (auth.uid() = user_id OR (auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()))
    WITH CHECK (auth.uid() = user_id OR (auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_gates' AND policyname = 'ufg_delete_own'
  ) THEN
    CREATE POLICY "ufg_delete_own"
    ON public.user_feature_gates
    FOR DELETE
    USING (auth.uid() = user_id OR (auth.role() = 'service_role'::text) OR public.is_admin_user(auth.uid()));
  END IF;
END $$;