-- 1) Add missing column for user provider costs
ALTER TABLE public.user_provider_costs
  ADD COLUMN IF NOT EXISTS monthly_cost_limit numeric;

-- 2) Ensure RLS is enabled and proper policies exist for system_components
ALTER TABLE public.system_components ENABLE ROW LEVEL SECURITY;

-- Service role full access (ALL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'system_components' 
      AND policyname = 'Service role full access - system_components'
  ) THEN
    CREATE POLICY "Service role full access - system_components"
      ON public.system_components
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END$$;

-- Admins can view components (SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'system_components' 
      AND policyname = 'Admins can view system components'
  ) THEN
    CREATE POLICY "Admins can view system components"
      ON public.system_components
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']));
  END IF;
END$$;