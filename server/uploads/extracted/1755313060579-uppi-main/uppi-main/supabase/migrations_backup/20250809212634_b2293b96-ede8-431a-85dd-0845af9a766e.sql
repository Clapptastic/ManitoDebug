-- Add missing column to support upsert_company_profile used by edge function
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'company_profiles'
      AND column_name = 'last_enriched_at'
  ) THEN
    ALTER TABLE public.company_profiles
      ADD COLUMN last_enriched_at timestamp with time zone;
  END IF;
END $$;