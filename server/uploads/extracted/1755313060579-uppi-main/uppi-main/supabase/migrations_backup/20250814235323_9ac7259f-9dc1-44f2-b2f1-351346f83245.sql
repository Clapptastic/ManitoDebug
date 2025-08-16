-- Fix API key management system by creating proper functions and updating schema

-- Create or replace the manage_api_key_vault function to work with current schema
CREATE OR REPLACE FUNCTION public.manage_api_key_vault(
  operation text,
  user_id_param uuid,
  provider_param text,
  encrypted_key_param text DEFAULT NULL,
  vault_secret_id_param uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  key_id uuid;
BEGIN
  -- Validate user access
  IF auth.uid() != user_id_param AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  CASE operation
    WHEN 'save' THEN
      -- Insert or update API key
      INSERT INTO api_keys (
        user_id, 
        provider, 
        encrypted_key,
        vault_secret_id,
        name,
        key_prefix,
        masked_key,
        status,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        user_id_param,
        provider_param,
        encrypted_key_param,
        vault_secret_id_param,
        provider_param || ' API Key',
        LEFT(encrypted_key_param, 8) || '...',
        LEFT(encrypted_key_param, 8) || '...' || RIGHT(encrypted_key_param, 4),
        'active',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, provider) 
      DO UPDATE SET
        encrypted_key = EXCLUDED.encrypted_key,
        vault_secret_id = EXCLUDED.vault_secret_id,
        masked_key = EXCLUDED.masked_key,
        status = 'active',
        is_active = true,
        updated_at = NOW()
      RETURNING id INTO key_id;

      result := jsonb_build_object(
        'success', true,
        'id', key_id,
        'message', 'API key saved successfully'
      );

    WHEN 'get' THEN
      -- Get API key for user and provider
      SELECT jsonb_build_object(
        'id', ak.id,
        'provider', ak.provider,
        'encrypted_key', ak.encrypted_key,
        'vault_secret_id', ak.vault_secret_id,
        'masked_key', ak.masked_key,
        'status', ak.status,
        'is_active', ak.is_active
      ) INTO result
      FROM api_keys ak
      WHERE ak.user_id = user_id_param 
        AND ak.provider = provider_param
        AND ak.is_active = true;

      IF result IS NULL THEN
        result := jsonb_build_object(
          'success', false,
          'error', 'API key not found'
        );
      ELSE
        result := result || jsonb_build_object('success', true);
      END IF;

    WHEN 'delete' THEN
      -- Delete API key
      UPDATE api_keys 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = user_id_param 
        AND provider = provider_param;

      result := jsonb_build_object(
        'success', true,
        'message', 'API key deleted successfully'
      );

    WHEN 'list' THEN
      -- List all API keys for user
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ak.id,
          'provider', ak.provider,
          'masked_key', ak.masked_key,
          'status', ak.status,
          'is_active', ak.is_active,
          'last_validated', ak.last_validated,
          'created_at', ak.created_at
        )
      ) INTO result
      FROM api_keys ak
      WHERE ak.user_id = user_id_param AND ak.is_active = true;

      result := jsonb_build_object(
        'success', true,
        'keys', COALESCE(result, '[]'::jsonb)
      );

    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;

  RETURN result;
END;
$$;