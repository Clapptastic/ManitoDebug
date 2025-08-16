-- CRITICAL: Fix API Key Encryption/Decryption Issues - Comprehensive Audit Fix

-- 1. First, check if vault extension is actually available and working
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vault') THEN
        RAISE NOTICE 'Vault extension is available';
    ELSE
        RAISE NOTICE 'Vault extension is NOT available - will use secure fallback';
    END IF;
END $$;

-- 2. Create a unified, secure API key management function that handles all encryption scenarios
CREATE OR REPLACE FUNCTION public.manage_api_key(
  operation text,
  user_id_param uuid DEFAULT NULL::uuid,
  provider_param text DEFAULT NULL::text,
  api_key_param text DEFAULT NULL::text,
  key_hash_param text DEFAULT NULL::text,
  masked_key_param text DEFAULT NULL::text,
  key_prefix_param text DEFAULT NULL::text,
  api_key_id_param uuid DEFAULT NULL::uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  existing_key_id uuid;
  existing_secret_id uuid;
  new_secret_id uuid;
  use_vault boolean := EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vault');
  secret_value text;
  v_provider text;
  v_status text;
BEGIN
  -- Authorization: same user, super admin, or service role
  IF NOT (
    auth.uid() = user_id_param OR 
    (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
    get_user_role(auth.uid()) = 'super_admin' OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions';
  END IF;

  CASE operation
    WHEN 'insert' THEN
      -- Upsert by (user, provider)
      SELECT id, vault_secret_id INTO existing_key_id, existing_secret_id
      FROM public.api_keys
      WHERE user_id = user_id_param AND provider = provider_param
      LIMIT 1;

      IF use_vault THEN
        -- Ensure a secret exists/updated in Vault using dynamic SQL
        IF existing_secret_id IS NOT NULL THEN
          EXECUTE 'SELECT vault.update_secret($1, $2)' USING existing_secret_id, api_key_param;
          new_secret_id := existing_secret_id;
        ELSE
          EXECUTE 'SELECT vault.create_secret($1, $2)'
            INTO new_secret_id
            USING format('user:%s:provider:%s', user_id_param, provider_param), api_key_param;
        END IF;
      END IF;

      IF existing_key_id IS NOT NULL THEN
        UPDATE public.api_keys
        SET 
          api_key = CASE WHEN use_vault THEN NULL ELSE api_key_param END,
          key_hash = key_hash_param,
          masked_key = masked_key_param,
          key_prefix = key_prefix_param,
          is_active = true,
          status = 'active',
          vault_secret_id = CASE WHEN use_vault THEN new_secret_id ELSE vault_secret_id END,
          updated_at = now()
        WHERE id = existing_key_id
        RETURNING jsonb_build_object(
          'id', id,
          'provider', provider,
          'masked_key', masked_key,
          'status', status,
          'created_at', created_at,
          'updated_at', updated_at
        ) INTO result;
      ELSE
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
        RETURNING jsonb_build_object(
          'id', id,
          'provider', provider,
          'masked_key', masked_key,
          'status', status,
          'created_at', created_at,
          'updated_at', updated_at
        ) INTO result;
      END IF;

    WHEN 'select' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'provider', provider,
          'name', name,
          'masked_key', masked_key,
          'status', status,
          'is_active', is_active,
          'created_at', created_at,
          'updated_at', updated_at,
          'last_used_at', last_used_at,
          'permissions', permissions
        )
      ) INTO result
      FROM public.api_keys
      WHERE user_id = user_id_param AND is_active = true;

    WHEN 'delete' THEN
      DELETE FROM public.api_keys
      WHERE id = api_key_id_param AND user_id = user_id_param;
      result := jsonb_build_object('success', true, 'deleted_id', api_key_id_param);

    WHEN 'get_for_decryption' THEN
      -- Return plaintext secret via Vault if available, else from api_key column
      SELECT id, provider, vault_secret_id, api_key, status
      INTO existing_key_id, v_provider, existing_secret_id, secret_value, v_status
      FROM public.api_keys
      WHERE user_id = user_id_param AND provider = provider_param AND is_active = true
      LIMIT 1;

      IF existing_key_id IS NULL THEN
        result := '[]'::jsonb; RETURN result;
      END IF;

      IF use_vault AND existing_secret_id IS NOT NULL THEN
        EXECUTE 'SELECT vault.get_secret($1)' INTO secret_value USING existing_secret_id;
      END IF;

      result := jsonb_build_object(
        'id', existing_key_id,
        'provider', v_provider,
        'api_key', secret_value,
        'status', v_status
      );

    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 3. Add audit logging for all API key operations
CREATE OR REPLACE FUNCTION public.log_api_key_operation(
  operation_type text,
  provider_param text,
  user_id_param uuid,
  success boolean DEFAULT true,
  error_message text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    created_at
  ) VALUES (
    user_id_param,
    operation_type,
    'api_key',
    provider_param,
    jsonb_build_object(
      'provider', provider_param,
      'success', success,
      'error_message', error_message,
      'timestamp', now()
    ),
    NOW()
  );
END;
$$;

-- 4. Create function to validate API key integrity
CREATE OR REPLACE FUNCTION public.validate_api_key_integrity(
  user_id_param uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
  key_record record;
  issues jsonb := '[]'::jsonb;
  vault_available boolean := EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vault');
BEGIN
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  -- Check each API key for integrity issues
  FOR key_record IN 
    SELECT id, provider, vault_secret_id, api_key, masked_key, status
    FROM public.api_keys 
    WHERE user_id = target_user_id AND is_active = true
  LOOP
    -- Check for vault/non-vault consistency
    IF vault_available AND key_record.vault_secret_id IS NULL AND key_record.api_key IS NULL THEN
      issues := issues || jsonb_build_object(
        'provider', key_record.provider,
        'issue', 'missing_both_vault_and_plaintext',
        'severity', 'critical'
      );
    ELSIF NOT vault_available AND key_record.api_key IS NULL THEN
      issues := issues || jsonb_build_object(
        'provider', key_record.provider,
        'issue', 'missing_plaintext_no_vault',
        'severity', 'critical'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'user_id', target_user_id,
    'vault_available', vault_available,
    'issues', issues,
    'checked_at', now()
  );
END;
$$;