-- Enable Vault Extension for Secure API Key Storage
CREATE EXTENSION IF NOT EXISTS vault;

-- Update manage_api_key function to use Vault for all encryption/decryption
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

      -- Always use Vault for encryption
      IF existing_secret_id IS NOT NULL THEN
        -- Update existing vault secret
        PERFORM vault.update_secret(existing_secret_id, api_key_param);
        new_secret_id := existing_secret_id;
      ELSE
        -- Create new vault secret
        SELECT vault.create_secret(
          format('user:%s:provider:%s', user_id_param, provider_param), 
          api_key_param
        ) INTO new_secret_id;
      END IF;

      IF existing_key_id IS NOT NULL THEN
        UPDATE public.api_keys
        SET 
          api_key = NULL, -- Never store plaintext
          key_hash = key_hash_param,
          masked_key = masked_key_param,
          key_prefix = key_prefix_param,
          is_active = true,
          status = 'active',
          vault_secret_id = new_secret_id,
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
          NULL, -- Never store plaintext
          key_hash_param, masked_key_param, key_prefix_param,
          true, 'active', '["read", "write"]'::jsonb,
          new_secret_id
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
      -- Get vault secret ID before deletion
      SELECT vault_secret_id INTO existing_secret_id
      FROM public.api_keys
      WHERE id = api_key_id_param AND user_id = user_id_param;
      
      -- Delete from vault if exists
      IF existing_secret_id IS NOT NULL THEN
        PERFORM vault.delete_secret(existing_secret_id);
      END IF;
      
      -- Delete from api_keys table
      DELETE FROM public.api_keys
      WHERE id = api_key_id_param AND user_id = user_id_param;
      
      result := jsonb_build_object('success', true, 'deleted_id', api_key_id_param);

    WHEN 'get_for_decryption' THEN
      -- Return decrypted secret from Vault
      SELECT id, provider, vault_secret_id, status
      INTO existing_key_id, v_provider, existing_secret_id, v_status
      FROM public.api_keys
      WHERE user_id = user_id_param AND provider = provider_param AND is_active = true
      LIMIT 1;

      IF existing_key_id IS NULL THEN
        result := '[]'::jsonb; 
        RETURN result;
      END IF;

      IF existing_secret_id IS NOT NULL THEN
        -- Get secret from vault
        SELECT vault.get_secret(existing_secret_id) INTO secret_value;
      ELSE
        -- No vault secret ID - this shouldn't happen with new system
        RAISE EXCEPTION 'API key found but no vault secret ID';
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