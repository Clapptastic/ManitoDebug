-- 1) Create centralized error events table
CREATE TABLE IF NOT EXISTS public.error_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  session_id text NULL,
  source text NOT NULL, -- e.g., 'frontend', 'edge:my-func'
  component text NULL,
  route text NULL,
  error_type text NULL,
  severity text DEFAULT 'error', -- info|warning|error|critical
  message text NOT NULL,
  stack text NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_agent text NULL,
  url text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_error_events_created_at ON public.error_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_events_user_id ON public.error_events (user_id);
CREATE INDEX IF NOT EXISTS idx_error_events_severity ON public.error_events (severity);

-- Enable RLS
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1) Allow service role to bypass (implicit)
-- 2) Allow admins to read all
DROP POLICY IF EXISTS "Admins can read all error events" ON public.error_events;
CREATE POLICY "Admins can read all error events"
ON public.error_events FOR SELECT
USING (
  public.is_admin_user(auth.uid())
);

-- 3) Allow authenticated users to read their own events (optional but useful)
DROP POLICY IF EXISTS "Users can read own error events" ON public.error_events;
CREATE POLICY "Users can read own error events"
ON public.error_events FOR SELECT
USING (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- 4) Allow authenticated users to insert their own error events (frontend fallback)
DROP POLICY IF EXISTS "Users can insert own error events" ON public.error_events;
CREATE POLICY "Users can insert own error events"
ON public.error_events FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid())
);

-- 5) Only admins can delete (cleanup)
DROP POLICY IF EXISTS "Admins can delete error events" ON public.error_events;
CREATE POLICY "Admins can delete error events"
ON public.error_events FOR DELETE
USING (
  public.is_admin_user(auth.uid())
);
