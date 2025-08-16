-- Create RPC to log AI prompts securely via SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.log_ai_prompt(
  provider_param text,
  model_param text,
  prompt_param text,
  prompt_length_param integer,
  analysis_id_param uuid DEFAULT NULL,
  session_id_param text DEFAULT NULL,
  temperature_param numeric DEFAULT NULL,
  status_param text DEFAULT 'sent',
  error_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.ai_prompt_logs (
    user_id,
    provider,
    model,
    prompt_hash,
    prompt_preview,
    prompt_length,
    analysis_id,
    session_id,
    temperature,
    status,
    error,
    metadata
  ) VALUES (
    auth.uid(),
    provider_param,
    model_param,
    md5(prompt_param),
    left(prompt_param, 200),
    COALESCE(prompt_length_param, length(prompt_param)),
    analysis_id_param,
    session_id_param,
    temperature_param,
    status_param,
    error_param,
    COALESCE(metadata_param, '{}'::jsonb)
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

COMMENT ON FUNCTION public.log_ai_prompt(text, text, text, integer, uuid, text, numeric, text, text, jsonb)
IS 'Logs AI prompt metadata into ai_prompt_logs with privacy (hash + preview). Requires auth. Returns new row id.';