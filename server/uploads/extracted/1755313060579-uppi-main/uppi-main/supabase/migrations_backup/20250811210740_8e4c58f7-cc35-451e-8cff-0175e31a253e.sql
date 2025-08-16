-- Ensure RLS and privileges for prompts and prompt_versions to align with admin architecture/data flow
-- 1) Enable RLS on both tables (safe if already enabled)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'prompts'
  ) THEN
    EXECUTE 'ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'prompt_versions'
  ) THEN
    EXECUTE 'ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 2) Explicit GRANTs for service_role to avoid permission issues seen in edge function logs
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'prompts'
  ) THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prompts TO service_role';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'prompt_versions'
  ) THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prompt_versions TO service_role';
  END IF;
END $$;

-- 3) Create RLS policies for service_role and admins (idempotent create via conditional checks)
-- prompts table policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prompts') THEN
    -- Service role full access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompts' AND policyname = 'Service role full access - prompts'
    ) THEN
      EXECUTE $$
        CREATE POLICY "Service role full access - prompts"
        ON public.prompts
        FOR ALL
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role')
      $$;
    END IF;

    -- Admins full access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompts' AND policyname = 'Admins full access - prompts'
    ) THEN
      EXECUTE $$
        CREATE POLICY "Admins full access - prompts"
        ON public.prompts
        FOR ALL
        USING (public.get_user_role(auth.uid()) IN ('admin','super_admin'))
        WITH CHECK (public.get_user_role(auth.uid()) IN ('admin','super_admin'))
      $$;
    END IF;

    -- Authenticated read access (optional read for non-admins if needed by UI)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompts' AND policyname = 'Authenticated read - prompts'
    ) THEN
      EXECUTE $$
        CREATE POLICY "Authenticated read - prompts"
        ON public.prompts
        FOR SELECT
        USING (auth.role() = 'authenticated')
      $$;
    END IF;
  END IF;
END $$;

-- prompt_versions table policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prompt_versions') THEN
    -- Service role full access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompt_versions' AND policyname = 'Service role full access - prompt_versions'
    ) THEN
      EXECUTE $$
        CREATE POLICY "Service role full access - prompt_versions"
        ON public.prompt_versions
        FOR ALL
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role')
      $$;
    END IF;

    -- Admins full access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompt_versions' AND policyname = 'Admins full access - prompt_versions'
    ) THEN
      EXECUTE $$
        CREATE POLICY "Admins full access - prompt_versions"
        ON public.prompt_versions
        FOR ALL
        USING (public.get_user_role(auth.uid()) IN ('admin','super_admin'))
        WITH CHECK (public.get_user_role(auth.uid()) IN ('admin','super_admin'))
      $$;
    END IF;

    -- Authenticated read access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'prompt_versions' AND policyname = 'Authenticated read - prompt_versions'
    ) THEN
      EXECUTE $$
        CREATE POLICY "Authenticated read - prompt_versions"
        ON public.prompt_versions
        FOR SELECT
        USING (auth.role() = 'authenticated')
      $$;
    END IF;
  END IF;
END $$;

-- 4) Optional: ensure schema usage for service_role (typically set by Supabase, but we assert it)
GRANT USAGE ON SCHEMA public TO service_role;
