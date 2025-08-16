-- 1) Add monthly_cost_limit column to user_provider_costs
ALTER TABLE public.user_provider_costs
ADD COLUMN IF NOT EXISTS monthly_cost_limit numeric;

-- 2) Update get_user_provider_costs to include monthly_cost_limit
CREATE OR REPLACE FUNCTION public.get_user_provider_costs(user_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  user_id uuid,
  provider text,
  cost_per_1k_tokens numeric,
  monthly_token_allotment integer,
  monthly_cost_limit numeric,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  effective_user uuid;
BEGIN
  effective_user := COALESCE(user_id_param, auth.uid());
  IF effective_user IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT upc.user_id, upc.provider, upc.cost_per_1k_tokens, upc.monthly_token_allotment, upc.monthly_cost_limit, upc.updated_at
  FROM public.user_provider_costs upc
  WHERE upc.user_id = effective_user;
END;
$$;

-- 3) Create helper to set monthly cost limit per provider
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