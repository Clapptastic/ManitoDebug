-- 1) Ensure competitor_analyses has columns for citations and confidence
ALTER TABLE public.competitor_analyses
  ADD COLUMN IF NOT EXISTS source_citations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence_scores jsonb;

-- 2) Harden master_company_profiles access for admins/service role only
ALTER TABLE public.master_company_profiles ENABLE ROW LEVEL SECURITY;

-- Service role full access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'master_company_profiles' AND policyname = 'service role full access - master_company_profiles'
  ) THEN
    CREATE POLICY "service role full access - master_company_profiles"
    ON public.master_company_profiles
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Super admin read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'master_company_profiles' AND policyname = 'super admin can read master_company_profiles'
  ) THEN
    CREATE POLICY "super admin can read master_company_profiles"
    ON public.master_company_profiles
    FOR SELECT
    USING (public.get_user_role(auth.uid()) = 'super_admin');
  END IF;
END $$;

-- Super admin insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'master_company_profiles' AND policyname = 'super admin can write master_company_profiles'
  ) THEN
    CREATE POLICY "super admin can write master_company_profiles"
    ON public.master_company_profiles
    FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
  END IF;
END $$;

-- Super admin update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'master_company_profiles' AND policyname = 'super admin can update master_company_profiles'
  ) THEN
    CREATE POLICY "super admin can update master_company_profiles"
    ON public.master_company_profiles
    FOR UPDATE
    USING (public.get_user_role(auth.uid()) = 'super_admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
  END IF;
END $$;

-- Super admin delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'master_company_profiles' AND policyname = 'super admin can delete master_company_profiles'
  ) THEN
    CREATE POLICY "super admin can delete master_company_profiles"
    ON public.master_company_profiles
    FOR DELETE
    USING (public.get_user_role(auth.uid()) = 'super_admin');
  END IF;
END $$;