-- Clean up all conflicting function versions
DROP FUNCTION IF EXISTS public.manage_api_key_vault(text, uuid, text, text);
DROP FUNCTION IF EXISTS public.manage_api_key_vault(text, uuid, text, text, text);

-- Create single authoritative function with proper security
CREATE OR REPLACE FUNCTION public.manage_api_key_vault(
  operation TEXT,
  user_id_param UUID DEFAULT NULL,
  provider_param TEXT DEFAULT NULL,
  api_key_param TEXT DEFAULT NULL,
  key_name_param TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_existing_record RECORD;
  v_masked_key TEXT;
  v_api_key_id UUID;
BEGIN
  -- Get effective user ID
  v_user_id := COALESCE(user_id_param, auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  CASE operation
    WHEN 'create' THEN
      -- Validate required parameters
      IF provider_param IS NULL OR api_key_param IS NULL THEN
        RAISE EXCEPTION 'Provider and API key are required for create operation';
      END IF;

      -- Create masked version of key
      v_masked_key := CASE 
        WHEN length(api_key_param) > 8 THEN
          left(api_key_param, 4) || '...' || right(api_key_param, 4)
        ELSE '***'
      END;

      -- Check if key already exists for this user/provider
      SELECT * INTO v_existing_record
      FROM public.api_keys 
      WHERE user_id = v_user_id AND provider = provider_param;

      IF v_existing_record.id IS NOT NULL THEN
        -- Update existing record
        UPDATE public.api_keys 
        SET 
          api_key = api_key_param,
          masked_key = v_masked_key,
          status = 'active',
          is_active = true,
          last_validated = now(),
          updated_at = now()
        WHERE id = v_existing_record.id
        RETURNING id INTO v_api_key_id;
      ELSE
        -- Insert new record  
        INSERT INTO public.api_keys (
          user_id, provider, api_key, masked_key, status, is_active, last_validated
        ) VALUES (
          v_user_id, provider_param, api_key_param, v_masked_key, 'active', true, now()
        ) RETURNING id INTO v_api_key_id;
      END IF;

      -- Return success result
      v_result := jsonb_build_object(
        'operation', 'create',
        'api_key_id', v_api_key_id,
        'provider', provider_param,
        'masked_key', v_masked_key,
        'status', 'active'
      );

    WHEN 'select' THEN
      -- Return user's API keys with status
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ak.id,
          'provider', ak.provider,
          'masked_key', ak.masked_key,
          'status', ak.status,
          'is_active', ak.is_active,
          'last_validated', ak.last_validated,
          'created_at', ak.created_at,
          'updated_at', ak.updated_at,
          'has_vault_secret', (ak.api_key IS NOT NULL),
          'storage_method', 'database'
        )
      ) INTO v_result
      FROM public.api_keys ak
      WHERE ak.user_id = v_user_id 
        AND ak.is_active = true;

      -- Return empty array if no keys found
      v_result := COALESCE(v_result, '[]'::jsonb);

    WHEN 'delete' THEN
      -- Validate required parameters
      IF provider_param IS NULL THEN
        RAISE EXCEPTION 'Provider is required for delete operation';
      END IF;

      -- Soft delete the API key
      UPDATE public.api_keys 
      SET 
        is_active = false,
        status = 'deleted',
        api_key = NULL, -- Clear the actual key for security
        updated_at = now()
      WHERE user_id = v_user_id 
        AND provider = provider_param
      RETURNING id INTO v_api_key_id;

      IF v_api_key_id IS NULL THEN
        RAISE EXCEPTION 'API key not found for provider: %', provider_param;
      END IF;

      v_result := jsonb_build_object(
        'operation', 'delete',
        'api_key_id', v_api_key_id,
        'provider', provider_param,
        'status', 'deleted'
      );

    WHEN 'get_key' THEN
      -- Return decrypted API key for specific provider (for validation)
      IF provider_param IS NULL THEN
        RAISE EXCEPTION 'Provider is required for get_key operation';
      END IF;

      SELECT api_key INTO v_result
      FROM public.api_keys
      WHERE user_id = v_user_id 
        AND provider = provider_param 
        AND is_active = true;

      IF v_result IS NULL THEN
        v_result := jsonb_build_object('error', 'API key not found');
      ELSE
        v_result := jsonb_build_object('api_key', v_result);
      END IF;

    ELSE
      RAISE EXCEPTION 'Unknown operation: %', operation;
  END CASE;

  RETURN v_result;
END;
$$;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION public.manage_api_key_vault TO authenticated;

-- Create helper function for API key retrieval (used by edge functions)
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