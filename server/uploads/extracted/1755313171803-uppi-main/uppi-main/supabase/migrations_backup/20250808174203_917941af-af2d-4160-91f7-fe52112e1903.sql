-- Ensure helper exists to set monthly cost limit per provider
CREATE OR REPLACE FUNCTION public.set_user_provider_monthly_limit(
  user_id_param uuid,
  provider_param text,
  monthly_cost_limit_param numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only the user, admins, or service role can set limits
  IF NOT (
    auth.uid() = user_id_param OR 
    get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']) OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.user_provider_costs (user_id, provider, monthly_cost_limit)
  VALUES (user_id_param, provider_param, monthly_cost_limit_param)
  ON CONFLICT (user_id, provider) DO UPDATE
  SET monthly_cost_limit = EXCLUDED.monthly_cost_limit,
      updated_at = now();

  RETURN true;
END;
$$;