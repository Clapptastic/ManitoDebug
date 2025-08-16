-- Retry migration with proper quoting

-- 1) api_keys grants and policies (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_keys'
  ) THEN
    EXECUTE 'ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.api_keys TO authenticated';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = ''Users view own api_keys''
    ) THEN
      EXECUTE 'CREATE POLICY "Users view own api_keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id)';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = ''Users insert own api_keys''
    ) THEN
      EXECUTE 'CREATE POLICY "Users insert own api_keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = ''Users update own api_keys''
    ) THEN
      EXECUTE 'CREATE POLICY "Users update own api_keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id)';
    END IF;
  END IF;
END$$;

-- 2) audit_logs insert policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs'
  ) THEN
    EXECUTE 'ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT INSERT ON public.audit_logs TO authenticated';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = ''Authenticated can insert audit logs''
    ) THEN
      EXECUTE 'CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true)';
    END IF;
  END IF;
END$$;

-- 3) feature_flags.flag_key + backfill + index + grant
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''feature_flags''
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''feature_flags'' AND column_name = ''flag_key''
    ) THEN
      EXECUTE 'ALTER TABLE public.feature_flags ADD COLUMN flag_key TEXT';
    END IF;

    EXECUTE 'UPDATE public.feature_flags SET flag_key = COALESCE(flag_key, lower(regexp_replace(COALESCE(name, id::text), ''[^a-z0-9]+'',''-'',''g''))) WHERE flag_key IS NULL';

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = ''idx_feature_flags_flag_key'' AND n.nspname = ''public''
    ) THEN
      EXECUTE 'CREATE INDEX idx_feature_flags_flag_key ON public.feature_flags (flag_key)';
    END IF;

    EXECUTE 'GRANT SELECT ON public.feature_flags TO authenticated';
  END IF;
END$$;

-- 4) user_feature_gates table + RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = ''public'' AND tablename = ''user_feature_gates''
  ) THEN
    EXECUTE 'CREATE TABLE public.user_feature_gates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      flag_key TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT user_feature_gates_flag_fkey FOREIGN KEY (flag_key)
        REFERENCES public.feature_flags(flag_key) ON UPDATE CASCADE ON DELETE CASCADE
    )';

    EXECUTE 'CREATE UNIQUE INDEX user_feature_gates_user_flag_uniq ON public.user_feature_gates (user_id, flag_key)';
    EXECUTE 'ALTER TABLE public.user_feature_gates ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.user_feature_gates TO authenticated';

    EXECUTE 'CREATE POLICY "Users view own feature gates" ON public.user_feature_gates FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users insert own feature gates" ON public.user_feature_gates FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users update own feature gates" ON public.user_feature_gates FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
END$$;