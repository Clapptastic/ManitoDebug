-- Create affiliate_programs table to manage provider signup/affiliate links
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  name text NOT NULL,
  default_url text,
  affiliate_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful index for lookups by provider
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_provider ON public.affiliate_programs (provider);

-- Trigger to maintain updated_at
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

-- Enable RLS
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;

-- Policies
-- View: anyone can read active programs
DROP POLICY IF EXISTS "Active affiliate programs are viewable by everyone" ON public.affiliate_programs;
CREATE POLICY "Active affiliate programs are viewable by everyone"
ON public.affiliate_programs
FOR SELECT
USING (is_active = true);

-- Insert: only super admins
DROP POLICY IF EXISTS "Only super admins can insert affiliate programs" ON public.affiliate_programs;
CREATE POLICY "Only super admins can insert affiliate programs"
ON public.affiliate_programs
FOR INSERT
WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');

-- Update: only super admins
DROP POLICY IF EXISTS "Only super admins can update affiliate programs" ON public.affiliate_programs;
CREATE POLICY "Only super admins can update affiliate programs"
ON public.affiliate_programs
FOR UPDATE
USING (public.get_user_role(auth.uid()) = 'super_admin')
WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');

-- Delete: only super admins
DROP POLICY IF EXISTS "Only super admins can delete affiliate programs" ON public.affiliate_programs;
CREATE POLICY "Only super admins can delete affiliate programs"
ON public.affiliate_programs
FOR DELETE
USING (public.get_user_role(auth.uid()) = 'super_admin');