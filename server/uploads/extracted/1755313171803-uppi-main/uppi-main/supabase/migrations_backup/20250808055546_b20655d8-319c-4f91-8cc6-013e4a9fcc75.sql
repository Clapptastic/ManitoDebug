-- Cost governance: per-user soft limits and checks
-- Table: user_cost_limits
CREATE TABLE IF NOT EXISTS public.user_cost_limits (
  user_id uuid PRIMARY KEY,
  monthly_cost_limit numeric NOT NULL DEFAULT 10.0,
  alert_threshold numeric NOT NULL DEFAULT 0.8,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_cost_limits ENABLE ROW LEVEL SECURITY;

-- Policies: users manage their own row
CREATE POLICY IF NOT EXISTS "Users manage their own cost limits"
ON public.user_cost_limits
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies: admins and service role manage all
CREATE POLICY IF NOT EXISTS "Admins and service role manage all cost limits"
ON public.user_cost_limits
FOR ALL
USING ((get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR auth.role() = 'service_role')
WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin'])) OR auth.role() = 'service_role');

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS trg_user_cost_limits_updated_at ON public.user_cost_limits;
CREATE TRIGGER trg_user_cost_limits_updated_at
BEFORE UPDATE ON public.user_cost_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function: get_user_monthly_spend
CREATE OR REPLACE FUNCTION public.get_user_monthly_spend(user_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  spend numeric;
BEGIN
  SELECT COALESCE(SUM(cost_usd), 0) INTO spend
  FROM public.api_usage_costs
  WHERE user_id = user_id_param
    AND date >= date_trunc('month', now())::date
    AND date <= current_date;
  RETURN spend;
END;
$$;

-- Function: check_user_cost_allowed (soft limit check)
CREATE OR REPLACE FUNCTION public.check_user_cost_allowed(user_id_param uuid DEFAULT NULL::uuid, projected_cost_param numeric DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  effective_user uuid;
  monthly_limit numeric := 10.0;
  threshold numeric := 0.8;
  spend numeric := 0.0;
  remaining numeric := 0.0;
  allowed boolean := true;
  alert boolean := false;
BEGIN
  effective_user := COALESCE(user_id_param, auth.uid());
  IF effective_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Load user-specific limits if present
  SELECT ucl.monthly_cost_limit, ucl.alert_threshold
  INTO monthly_limit, threshold
  FROM public.user_cost_limits ucl
  WHERE ucl.user_id = effective_user AND ucl.is_active = true
  LIMIT 1;

  spend := public.get_user_monthly_spend(effective_user);
  remaining := GREATEST(monthly_limit - spend, 0);
  allowed := projected_cost_param <= remaining;
  alert := spend >= (threshold * monthly_limit);

  RETURN jsonb_build_object(
    'allowed', allowed,
    'monthly_spend', spend,
    'monthly_limit', monthly_limit,
    'remaining', remaining,
    'alert', alert,
    'alert_threshold', threshold
  );
END;
$$;

-- Function: set_user_cost_limit (upsert helper)
CREATE OR REPLACE FUNCTION public.set_user_cost_limit(user_id_param uuid, monthly_limit_param numeric, alert_threshold_param numeric DEFAULT 0.8)
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

  INSERT INTO public.user_cost_limits (user_id, monthly_cost_limit, alert_threshold, is_active)
  VALUES (user_id_param, monthly_limit_param, alert_threshold_param, true)
  ON CONFLICT (user_id) DO UPDATE
  SET monthly_cost_limit = EXCLUDED.monthly_cost_limit,
      alert_threshold = EXCLUDED.alert_threshold,
      is_active = true,
      updated_at = now();

  RETURN true;
END;
$$;