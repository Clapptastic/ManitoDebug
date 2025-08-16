-- Extend affiliate_programs with domain for matching
ALTER TABLE public.affiliate_programs
  ADD COLUMN IF NOT EXISTS domain text;

-- Create affiliate_link_suggestions to log external links and potential affiliate programs
CREATE TABLE IF NOT EXISTS public.affiliate_link_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  original_url text NOT NULL,
  detected_program_name text,
  provider text,
  signup_url text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Indexes for fast admin review
CREATE INDEX IF NOT EXISTS idx_aff_suggestions_domain ON public.affiliate_link_suggestions (domain);
CREATE INDEX IF NOT EXISTS idx_aff_suggestions_status ON public.affiliate_link_suggestions (status);
CREATE INDEX IF NOT EXISTS idx_aff_suggestions_created_by ON public.affiliate_link_suggestions (created_by);

-- RLS
ALTER TABLE public.affiliate_link_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can insert their own suggestions" ON public.affiliate_link_suggestions;
CREATE POLICY "Users can insert their own suggestions"
ON public.affiliate_link_suggestions
FOR INSERT
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view their own suggestions" ON public.affiliate_link_suggestions;
CREATE POLICY "Users can view their own suggestions"
ON public.affiliate_link_suggestions
FOR SELECT
USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Admins can view all suggestions" ON public.affiliate_link_suggestions;
CREATE POLICY "Admins can view all suggestions"
ON public.affiliate_link_suggestions
FOR SELECT
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']));

DROP POLICY IF EXISTS "Admins can manage suggestions" ON public.affiliate_link_suggestions;
CREATE POLICY "Admins can manage suggestions"
ON public.affiliate_link_suggestions
FOR UPDATE, DELETE
USING (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']))
WITH CHECK (public.get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']));