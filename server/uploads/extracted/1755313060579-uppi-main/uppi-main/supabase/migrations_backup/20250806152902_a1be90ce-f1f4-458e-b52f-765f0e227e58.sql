-- Fix the manage_api_key function to properly handle insert operations
CREATE OR REPLACE FUNCTION public.manage_api_key(
  operation text,
  user_id_param uuid DEFAULT NULL,
  provider_param text DEFAULT NULL,
  api_key_param text DEFAULT NULL,
  key_hash_param text DEFAULT NULL,
  masked_key_param text DEFAULT NULL,
  key_prefix_param text DEFAULT NULL,
  api_key_id_param uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  provider text,
  masked_key text,
  key_prefix text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = user_id_param) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF operation = 'select' THEN
    -- Return all API keys for the user
    RETURN QUERY
    SELECT 
      ak.id,
      ak.user_id,
      ak.provider,
      ak.masked_key,
      ak.key_prefix,
      ak.is_active,
      ak.created_at,
      ak.updated_at,
      ak.status
    FROM api_keys ak
    WHERE ak.user_id = user_id_param AND ak.is_active = true
    ORDER BY ak.created_at DESC;

  ELSIF operation = 'insert' THEN
    -- Insert or update API key
    INSERT INTO api_keys (
      user_id,
      provider,
      encrypted_key,
      key_hash,
      masked_key,
      key_prefix,
      is_active,
      status
    ) VALUES (
      user_id_param,
      provider_param,
      api_key_param,
      key_hash_param,
      masked_key_param,
      key_prefix_param,
      true,
      'active'
    )
    ON CONFLICT (user_id, provider) 
    DO UPDATE SET
      encrypted_key = EXCLUDED.encrypted_key,
      key_hash = EXCLUDED.key_hash,
      masked_key = EXCLUDED.masked_key,
      key_prefix = EXCLUDED.key_prefix,
      is_active = true,
      status = 'active',
      updated_at = now();

    -- Return the inserted/updated record
    RETURN QUERY
    SELECT 
      ak.id,
      ak.user_id,
      ak.provider,
      ak.masked_key,
      ak.key_prefix,
      ak.is_active,
      ak.created_at,
      ak.updated_at,
      ak.status
    FROM api_keys ak
    WHERE ak.user_id = user_id_param AND ak.provider = provider_param;

  ELSIF operation = 'delete' THEN
    -- Soft delete by setting is_active to false
    UPDATE api_keys 
    SET is_active = false, status = 'inactive', updated_at = now()
    WHERE id = api_key_id_param AND user_id = user_id_param;

    -- Return empty result for delete
    RETURN;

  ELSE
    RAISE EXCEPTION 'Invalid operation. Must be select, insert, or delete';
  END IF;
END;
$$;