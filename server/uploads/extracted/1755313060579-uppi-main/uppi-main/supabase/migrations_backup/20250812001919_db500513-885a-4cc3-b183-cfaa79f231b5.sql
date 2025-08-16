-- Fix Supabase permission errors and missing relations observed in logs
-- 1) api_keys: ensure grants, RLS, and owner-scoped policies

-- Enable RLS (safe if already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_keys'
  ) THEN
    -- If the table doesn't exist, skip silently
    RAISE NOTICE 'api_keys table not found; skipping grants and policies';
  ELSE
    EXECUTE 'ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY';

    -- Grants (effective only with RLS)
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.api_keys TO authenticated';

    -- Policies
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users view own api_keys'
    ) THEN
      EXECUTE 'CREATE POLICY "Users view own api_keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users insert own api_keys'
    ) THEN
      EXECUTE 'CREATE POLICY "Users insert own api_keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'api_keys' AND policyname = 'Users update own api_keys'
    ) THEN
      EXECUTE 'CREATE POLICY "Users update own api_keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id)';
    END IF;
  END IF;
END$$;

-- 2) audit_logs: allow authenticated inserts (logs show permission denied on inserts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs'
  ) THEN
    RAISE NOTICE 'audit_logs table not found; skipping policies (no structural assumptions)';
  ELSE
    EXECUTE 'ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT INSERT ON public.audit_logs TO authenticated';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'Authenticated can insert audit logs'
    ) THEN
      -- Keep permissive insert to avoid noisy failures; auditing table is write-only for clients
      EXECUTE 'CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true)';
    END IF;
  END IF;
END$$;

-- 3) feature_flags.flag_key missing in logs; add it safely and backfill when possible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feature_flags'
  ) THEN
    -- Add column if missing
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'feature_flags' AND column_name = 'flag_key'
    ) THEN
      EXECUTE 'ALTER TABLE public.feature_flags ADD COLUMN flag_key TEXT';
    END IF;

    -- Best-effort backfill from name or id
    EXECUTE $$
      UPDATE public.feature_flags
         SET flag_key = COALESCE(flag_key,
                                  lower(regexp_replace(COALESCE(name, id::text), '[^a-z0-9]+','-', 'g')))
       WHERE flag_key IS NULL
    $$;

    -- Add non-unique index to support lookups without risking failure due to duplicates
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'idx_feature_flags_flag_key' AND n.nspname = 'public'
    ) THEN
      EXECUTE 'CREATE INDEX idx_feature_flags_flag_key ON public.feature_flags (flag_key)';
    END IF;

    -- Allow read access to authenticated users if RLS is already protecting sensitive data
    EXECUTE 'GRANT SELECT ON public.feature_flags TO authenticated';
  ELSE
    RAISE NOTICE 'feature_flags table not found; skipping column addition';
  END IF;
END$$;

-- 4) Create user_feature_gates table expected by code (relation missing), with owner-scoped RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_feature_gates'
  ) THEN
    EXECUTE $$
      CREATE TABLE public.user_feature_gates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        flag_key TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT user_feature_gates_flag_fkey FOREIGN KEY (flag_key)
          REFERENCES public.feature_flags(flag_key) ON UPDATE CASCADE ON DELETE CASCADE
      )
    $$;

    EXECUTE 'CREATE UNIQUE INDEX user_feature_gates_user_flag_uniq ON public.user_feature_gates (user_id, flag_key)';

    EXECUTE 'ALTER TABLE public.user_feature_gates ENABLE ROW LEVEL SECURITY';

    -- Grants
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON public.user_feature_gates TO authenticated';

    -- Policies
    EXECUTE 'CREATE POLICY "Users view own feature gates" ON public.user_feature_gates FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users insert own feature gates" ON public.user_feature_gates FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users update own feature gates" ON public.user_feature_gates FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
END$$;