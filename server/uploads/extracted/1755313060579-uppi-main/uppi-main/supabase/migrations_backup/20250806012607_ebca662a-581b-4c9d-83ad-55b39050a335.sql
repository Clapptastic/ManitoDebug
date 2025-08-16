-- Create function to increment admin API key usage
CREATE OR REPLACE FUNCTION public.increment_admin_key_usage(
  key_id uuid,
  tokens_to_add integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_api_keys 
  SET 
    current_month_usage = current_month_usage + tokens_to_add,
    last_used_at = now(),
    updated_at = now()
  WHERE id = key_id;
END;
$$;