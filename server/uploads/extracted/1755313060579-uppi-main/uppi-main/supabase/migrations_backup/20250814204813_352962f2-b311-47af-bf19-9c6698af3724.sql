-- Fix missing vault management function
CREATE OR REPLACE FUNCTION public.manage_api_key_vault(
  operation TEXT,
  user_id_param UUID DEFAULT NULL,
  provider_param TEXT DEFAULT NULL,
  api_key_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  secret_id UUID;
  vault_response JSON;
BEGIN
  -- Validate operation
  IF operation NOT IN ('insert', 'select', 'delete', 'list') THEN
    RAISE EXCEPTION 'Invalid operation: %', operation;
  END IF;

  -- Ensure user_id is provided for all operations
  IF user_id_param IS NULL THEN
    user_id_param := auth.uid();
  END IF;

  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  CASE operation
    WHEN 'insert' THEN
      -- Store API key in vault and create database record
      IF provider_param IS NULL OR api_key_param IS NULL THEN
        RAISE EXCEPTION 'Provider and API key are required for insert operation';
      END IF;

      -- Store in vault
      INSERT INTO vault.secrets (name, secret, key_id)
      VALUES (
        format('api_key_%s_%s', user_id_param, provider_param),
        api_key_param,
        (SELECT id FROM pgsodium.valid_key LIMIT 1)
      )
      RETURNING id INTO secret_id;

      -- Create API key record
      INSERT INTO public.api_keys (
        user_id,
        provider,
        vault_secret_id,
        masked_key,
        key_prefix,
        status,
        is_active
      ) VALUES (
        user_id_param,
        provider_param,
        secret_id,
        CASE 
          WHEN length(api_key_param) > 8 THEN
            substring(api_key_param from 1 for 4) || 
            repeat('*', length(api_key_param) - 8) || 
            substring(api_key_param from length(api_key_param) - 3)
          ELSE repeat('*', length(api_key_param))
        END,
        substring(api_key_param from 1 for 8),
        'active',
        true
      )
      ON CONFLICT (user_id, provider) 
      DO UPDATE SET
        vault_secret_id = EXCLUDED.vault_secret_id,
        masked_key = EXCLUDED.masked_key,
        key_prefix = EXCLUDED.key_prefix,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = now();

      result := json_build_object(
        'success', true,
        'provider', provider_param,
        'masked_key', (SELECT masked_key FROM api_keys WHERE user_id = user_id_param AND provider = provider_param)
      );

    WHEN 'select' THEN
      -- Get all API keys for user
      SELECT json_agg(
        json_build_object(
          'id', id,
          'provider', provider,
          'masked_key', masked_key,
          'status', status,
          'is_active', is_active,
          'created_at', created_at,
          'updated_at', updated_at,
          'last_validated', last_validated
        )
      ) INTO result
      FROM public.api_keys
      WHERE user_id = user_id_param
      AND is_active = true;

      IF result IS NULL THEN
        result := '[]'::json;
      END IF;

    WHEN 'delete' THEN
      -- Delete API key and vault secret
      IF provider_param IS NULL THEN
        RAISE EXCEPTION 'Provider is required for delete operation';
      END IF;

      -- Get vault secret ID
      SELECT vault_secret_id INTO secret_id
      FROM public.api_keys
      WHERE user_id = user_id_param AND provider = provider_param;

      -- Delete from vault
      IF secret_id IS NOT NULL THEN
        DELETE FROM vault.secrets WHERE id = secret_id;
      END IF;

      -- Delete from api_keys
      DELETE FROM public.api_keys
      WHERE user_id = user_id_param AND provider = provider_param;

      result := json_build_object('success', true, 'provider', provider_param);

    WHEN 'list' THEN
      -- List all providers with status
      SELECT json_agg(
        json_build_object(
          'provider', provider,
          'status', status,
          'is_active', is_active,
          'last_validated', last_validated
        )
      ) INTO result
      FROM public.api_keys
      WHERE user_id = user_id_param;

      IF result IS NULL THEN
        result := '[]'::json;
      END IF;
  END CASE;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.manage_api_key_vault TO authenticated;

-- Fix the get_api_key_from_vault function
CREATE OR REPLACE FUNCTION public.get_api_key_from_vault(
  provider_param TEXT,
  user_id_param UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  secret_id UUID;
  decrypted_key TEXT;
BEGIN
  IF user_id_param IS NULL THEN
    user_id_param := auth.uid();
  END IF;

  IF user_id_param IS NULL THEN
    RAISE EXCEPTION 'User authentication required';
  END IF;

  -- Get the vault secret ID
  SELECT vault_secret_id INTO secret_id
  FROM public.api_keys
  WHERE user_id = user_id_param 
  AND provider = provider_param 
  AND is_active = true
  LIMIT 1;

  IF secret_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Decrypt the secret from vault
  SELECT decrypted_secret INTO decrypted_key
  FROM vault.decrypted_secrets
  WHERE id = secret_id;

  RETURN decrypted_key;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_api_key_from_vault TO authenticated;