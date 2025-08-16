-- Secure insert RPC for analysis_runs to avoid intermittent permission errors
-- Ensures only the authenticated user (or service/admin) can insert and returns the new id
CREATE OR REPLACE FUNCTION public.insert_analysis_run(
  user_id_param uuid,
  run_type_param text,
  session_id_param text,
  input_data_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Authorization: only the same user, service role, or admins
  IF NOT (
    auth.uid() = user_id_param OR 
    auth.role() = 'service_role' OR 
    get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.analysis_runs (
    user_id,
    run_type,
    session_id,
    status,
    input_data
  ) VALUES (
    user_id_param,
    run_type_param,
    session_id_param,
    'running',
    input_data_param
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;