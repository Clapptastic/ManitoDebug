-- Enable RLS and add policies for prompts and prompt_versions
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prompts' AND policyname='Service role full access - prompts'
  ) THEN
    CREATE POLICY "Service role full access - prompts"
      ON public.prompts
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prompt_versions' AND policyname='Service role full access - prompt_versions'
  ) THEN
    CREATE POLICY "Service role full access - prompt_versions"
      ON public.prompt_versions
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Admin manage (ALL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prompts' AND policyname='Admins can manage prompts'
  ) THEN
    CREATE POLICY "Admins can manage prompts"
      ON public.prompts
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']))
      WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prompt_versions' AND policyname='Admins can manage prompt_versions'
  ) THEN
    CREATE POLICY "Admins can manage prompt_versions"
      ON public.prompt_versions
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']))
      WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']));
  END IF;
END $$;

-- Authenticated read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prompts' AND policyname='Authenticated users can read prompts'
  ) THEN
    CREATE POLICY "Authenticated users can read prompts"
      ON public.prompts
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='prompt_versions' AND policyname='Authenticated users can read prompt_versions'
  ) THEN
    CREATE POLICY "Authenticated users can read prompt_versions"
      ON public.prompt_versions
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (auth.role() = 'authenticated');
  END IF;
END $$;