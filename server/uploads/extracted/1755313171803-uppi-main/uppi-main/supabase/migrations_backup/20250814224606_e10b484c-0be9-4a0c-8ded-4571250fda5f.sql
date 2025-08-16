-- Clean up existing vault_retrieve_api_key function with different signatures
DROP FUNCTION IF EXISTS public.vault_retrieve_api_key(uuid, text);

-- Recreate the helper function for API key retrieval
CREATE OR REPLACE FUNCTION public.vault_retrieve_api_key(
  p_user_id UUID,
  p_provider TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_api_key TEXT;
BEGIN
  -- Validate user access
  IF p_user_id != auth.uid() AND NOT (auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT api_key INTO v_api_key
  FROM public.api_keys
  WHERE user_id = p_user_id 
    AND provider = p_provider 
    AND is_active = true;

  RETURN v_api_key;
END;
$$;

GRANT EXECUTE ON FUNCTION public.vault_retrieve_api_key TO authenticated;