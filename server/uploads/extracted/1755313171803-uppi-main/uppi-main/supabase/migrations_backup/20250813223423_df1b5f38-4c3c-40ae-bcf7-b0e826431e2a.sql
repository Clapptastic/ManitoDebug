-- Update is_super_admin function to use admin_users table
CREATE OR REPLACE FUNCTION public.is_super_admin(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = email_to_check 
        AND role = 'super_admin' 
        AND is_active = true
    );
END;
$$;

-- Fix Critical Issue #3: API Key Encryption - Standardize vault usage
-- Update manage_api_key function to handle vault consistently
CREATE OR REPLACE FUNCTION public.manage_api_key(
  operation text,
  user_id_param uuid DEFAULT NULL::uuid,
  provider_param text DEFAULT NULL::text,
  api_key_param text DEFAULT NULL::text,
  key_hash_param text DEFAULT NULL::text,
  masked_key_param text DEFAULT NULL::text,
  key_prefix_param text DEFAULT NULL::text,
  api_key_id_param uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  existing_key_id uuid;
  existing_secret_id uuid;
  new_secret_id uuid;
  use_vault boolean := false;
  secret_value text;
  v_provider text;
  v_status text;
BEGIN
  -- Check if vault extension is available
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vault') INTO use_vault;
  
  -- Authorization check
  IF NOT (
    auth.uid() = user_id_param OR 
    is_super_admin((SELECT email FROM auth.users WHERE id = auth.uid())) OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions';
  END IF;

  CASE operation
    WHEN 'insert' THEN
      -- Check for existing key
      SELECT id, vault_secret_id INTO existing_key_id, existing_secret_id
      FROM public.api_keys
      WHERE user_id = user_id_param AND provider = provider_param
      LIMIT 1;

      -- Handle vault storage if available
      IF use_vault THEN
        IF existing_secret_id IS NOT NULL THEN
          EXECUTE 'SELECT vault.update_secret($1, $2)' USING existing_secret_id, api_key_param;
          new_secret_id := existing_secret_id;
        ELSE
          EXECUTE 'SELECT vault.create_secret($1, $2)'
            INTO new_secret_id
            USING format('user:%s:provider:%s', user_id_param, provider_param), api_key_param;
        END IF;
      END IF;

      -- Upsert API key record
      INSERT INTO public.api_keys (
        user_id, provider, name, api_key, key_hash, masked_key,
        key_prefix, is_active, status, permissions, vault_secret_id
      ) VALUES (
        user_id_param, provider_param, provider_param,
        CASE WHEN use_vault THEN NULL ELSE api_key_param END,
        key_hash_param, masked_key_param, key_prefix_param,
        true, 'active', '["read", "write"]'::jsonb,
        CASE WHEN use_vault THEN new_secret_id ELSE NULL END
      )
      ON CONFLICT (user_id, provider) DO UPDATE SET
        api_key = CASE WHEN use_vault THEN NULL ELSE EXCLUDED.api_key END,
        key_hash = EXCLUDED.key_hash,
        masked_key = EXCLUDED.masked_key,
        key_prefix = EXCLUDED.key_prefix,
        is_active = true,
        status = 'active',
        vault_secret_id = CASE WHEN use_vault THEN new_secret_id ELSE vault_secret_id END,
        updated_at = now()
      RETURNING jsonb_build_object(
        'id', id, 'provider', provider, 'masked_key', masked_key,
        'status', status, 'created_at', created_at, 'updated_at', updated_at
      ) INTO result;

    WHEN 'select' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id, 'provider', provider, 'name', name, 'masked_key', masked_key,
          'status', status, 'is_active', is_active, 'created_at', created_at,
          'updated_at', updated_at, 'last_used_at', last_used_at, 'permissions', permissions
        )
      ) INTO result
      FROM public.api_keys
      WHERE user_id = user_id_param AND is_active = true;

    WHEN 'delete' THEN
      DELETE FROM public.api_keys
      WHERE id = api_key_id_param AND user_id = user_id_param;
      result := jsonb_build_object('success', true, 'deleted_id', api_key_id_param);

    WHEN 'get_for_decryption' THEN
      SELECT id, provider, vault_secret_id, api_key, status
      INTO existing_key_id, v_provider, existing_secret_id, secret_value, v_status
      FROM public.api_keys
      WHERE user_id = user_id_param AND provider = provider_param AND is_active = true
      LIMIT 1;

      IF existing_key_id IS NULL THEN
        result := '[]'::jsonb;
        RETURN result;
      END IF;

      -- Get secret from vault if available
      IF use_vault AND existing_secret_id IS NOT NULL THEN
        BEGIN
          EXECUTE 'SELECT vault.get_secret($1)' INTO secret_value USING existing_secret_id;
        EXCEPTION WHEN OTHERS THEN
          -- Fallback to direct storage if vault fails
          secret_value := (SELECT api_key FROM public.api_keys WHERE id = existing_key_id);
        END;
      END IF;

      result := jsonb_build_object(
        'id', existing_key_id, 'provider', v_provider,
        'api_key', secret_value, 'status', v_status
      );

    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;

  -- Log the operation
  PERFORM public.log_api_key_operation(
    operation, provider_param, user_id_param, true, NULL
  );

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;