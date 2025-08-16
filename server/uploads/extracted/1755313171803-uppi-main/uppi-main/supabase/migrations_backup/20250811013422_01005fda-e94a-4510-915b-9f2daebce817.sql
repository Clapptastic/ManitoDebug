-- Create AI Prompt Logs table for auditing prompts sent to AI providers
CREATE TABLE IF NOT EXISTS public.ai_prompt_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  model text,
  prompt_preview text,
  prompt_hash text NOT NULL,
  prompt_length integer NOT NULL DEFAULT 0,
  temperature numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  analysis_id uuid,
  session_id text,
  status text DEFAULT 'sent',
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_prompt_logs ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_prompt_logs_user_id ON public.ai_prompt_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_logs_created_at ON public.ai_prompt_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_logs_session_id ON public.ai_prompt_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_logs_analysis_id ON public.ai_prompt_logs(analysis_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_ai_prompt_logs_updated_at ON public.ai_prompt_logs;
CREATE TRIGGER trg_ai_prompt_logs_updated_at
BEFORE UPDATE ON public.ai_prompt_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Policies
-- Service role full access
DROP POLICY IF EXISTS "Service role full access - ai_prompt_logs" ON public.ai_prompt_logs;
CREATE POLICY "Service role full access - ai_prompt_logs"
ON public.ai_prompt_logs
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Users can view their own logs
DROP POLICY IF EXISTS "Users can view their own prompt logs" ON public.ai_prompt_logs;
CREATE POLICY "Users can view their own prompt logs"
ON public.ai_prompt_logs
FOR SELECT
TO public
USING (user_id = auth.uid());

-- Admins and super admin can view all logs
DROP POLICY IF EXISTS "Admins can view all prompt logs" ON public.ai_prompt_logs;
CREATE POLICY "Admins can view all prompt logs"
ON public.ai_prompt_logs
FOR SELECT
TO public
USING (
  ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3') OR 
  (get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']))
);
