-- Fix: drop then recreate function with new return type
DROP FUNCTION IF EXISTS public.get_user_provider_costs(uuid);

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