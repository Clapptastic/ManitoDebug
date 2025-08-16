-- Fix migration by extending existing affiliate_programs schema
ALTER TABLE public.affiliate_programs
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS default_url text,
  ADD COLUMN IF NOT EXISTS affiliate_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Helpful index on provider for quick lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_provider ON public.affiliate_programs (provider);

-- Ensure updated_at is maintained on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_affiliate_programs_updated_at'
  ) THEN
    CREATE TRIGGER update_affiliate_programs_updated_at
    BEFORE UPDATE ON public.affiliate_programs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;