-- Create affiliate_programs table to manage affiliate links per provider
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,         -- e.g., 'openai', 'anthropic', 'gemini'
  name TEXT NOT NULL,                    -- Display name
  default_url TEXT,                      -- Non-affiliate fallback URL
  affiliate_url TEXT,                    -- Affiliate URL (used if present)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Timestamp trigger
CREATE TRIGGER update_affiliate_programs_updated_at
BEFORE UPDATE ON public.affiliate_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS and policies
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active affiliate programs
DROP POLICY IF EXISTS "Affiliate programs are viewable by everyone" ON public.affiliate_programs;
CREATE POLICY "Affiliate programs are viewable by everyone"
ON public.affiliate_programs
FOR SELECT
USING (is_active = TRUE);

-- Only admins/super_admins can insert/update/delete
DROP POLICY IF EXISTS "Only admins can modify affiliate programs" ON public.affiliate_programs;
CREATE POLICY "Only admins can modify affiliate programs"
ON public.affiliate_programs
FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Optional helpful index
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_provider ON public.affiliate_programs(provider);
