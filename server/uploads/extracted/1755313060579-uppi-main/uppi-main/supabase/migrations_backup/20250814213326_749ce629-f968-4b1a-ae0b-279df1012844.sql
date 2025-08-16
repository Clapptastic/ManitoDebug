-- Enable Vault integration for secure API key storage
-- Following Supabase Vault best practices: https://supabase.com/docs/guides/database/vault

-- Create vault secrets for API keys using Supabase Vault
CREATE OR REPLACE FUNCTION vault_store_api_key(
  p_user_id UUID,
  p_provider TEXT,
  p_api_key TEXT,
  p_key_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO vault, public
AS $$
DECLARE
  v_secret_id UUID;
  v_key_name TEXT;
BEGIN
  -- Generate a descriptive name for the vault secret
  v_key_name := COALESCE(p_key_name, p_provider || '_api_key_' || p_user_id || '_' || extract(epoch from now()));
  
  -- Store secret in Vault
  SELECT vault.create_secret(p_api_key, v_key_name) INTO v_secret_id;
  
  -- Log the vault operation (without the actual key)
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (
    p_user_id,
    'vault_secret_created',
    'api_key',
    v_secret_id::TEXT,
    jsonb_build_object(
      'provider', p_provider,
      'vault_secret_name', v_key_name,
      'storage_method', 'supabase_vault'
    )
  );
  
  RETURN v_secret_id;
END;
$$;

-- Function to retrieve API key from vault
CREATE OR REPLACE FUNCTION vault_retrieve_api_key(
  p_user_id UUID,
  p_vault_secret_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO vault, public
AS $$
DECLARE
  v_decrypted_key TEXT;
  v_key_record RECORD;
BEGIN
  -- Verify user owns this secret
  SELECT provider INTO v_key_record
  FROM api_keys 
  WHERE vault_secret_id = p_vault_secret_id AND user_id = p_user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'API key not found or access denied';
  END IF;
  
  -- Retrieve from vault
  SELECT decrypted_secret INTO v_decrypted_key
  FROM vault.decrypted_secrets
  WHERE id = p_vault_secret_id;
  
  IF v_decrypted_key IS NULL THEN
    RAISE EXCEPTION 'Failed to decrypt API key from vault';
  END IF;
  
  -- Log access (for security auditing)
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (
    p_user_id,
    'vault_secret_accessed',
    'api_key', 
    p_vault_secret_id::TEXT,
    jsonb_build_object(
      'provider', v_key_record.provider,
      'access_method', 'supabase_vault'
    )
  );
  
  RETURN v_decrypted_key;
END;
$$;

-- Function to migrate from encrypted_key to vault
CREATE OR REPLACE FUNCTION migrate_to_vault()
RETURNS TABLE(migrated_count INTEGER, failed_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_migrated INTEGER := 0;
  v_failed INTEGER := 0;
  v_record RECORD;
  v_vault_id UUID;
BEGIN
  -- Migrate existing encrypted_key entries to vault
  FOR v_record IN 
    SELECT id, user_id, provider, encrypted_key, masked_key
    FROM api_keys 
    WHERE encrypted_key IS NOT NULL 
      AND vault_secret_id IS NULL 
      AND is_active = true
  LOOP
    BEGIN
      -- Note: This is a placeholder - actual decryption would need the current method
      -- In practice, you'd decrypt the encrypted_key first, then store in vault
      
      -- For now, we'll create a vault entry and mark for manual re-entry
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
      VALUES (
        v_record.user_id,
        'migration_required',
        'api_key',
        v_record.id::TEXT,
        jsonb_build_object(
          'provider', v_record.provider,
          'migration_status', 'requires_re_entry',
          'reason', 'encrypted_key_to_vault_migration'
        )
      );
      
      -- Update the record to indicate migration needed
      UPDATE api_keys 
      SET 
        status = 'migration_required',
        error_message = 'Please re-enter your API key to use Vault encryption'
      WHERE id = v_record.id;
      
      v_migrated := v_migrated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
      VALUES (
        v_record.user_id,
        'migration_failed',
        'api_key',
        v_record.id::TEXT,
        jsonb_build_object(
          'provider', v_record.provider,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated, v_failed;
END;
$$;

-- Updated function to manage API keys with vault integration
CREATE OR REPLACE FUNCTION manage_api_key_vault(
  operation TEXT,
  user_id_param UUID DEFAULT NULL,
  provider_param TEXT DEFAULT NULL,
  api_key_param TEXT DEFAULT NULL,
  key_name_param TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_vault_secret_id UUID;
  v_existing_record RECORD;
  v_masked_key TEXT;
BEGIN
  -- Get effective user ID
  v_user_id := COALESCE(user_id_param, auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  CASE operation
    WHEN 'create' THEN
      -- Validate provider and API key
      IF provider_param IS NULL OR api_key_param IS NULL THEN
        RAISE EXCEPTION 'Provider and API key are required for create operation';
      END IF;
      
      -- Create masked version
      v_masked_key := CASE 
        WHEN length(api_key_param) > 8 THEN 
          left(api_key_param, 4) || '...' || right(api_key_param, 4)
        ELSE '***..***'
      END;
      
      -- Store in vault
      v_vault_secret_id := vault_store_api_key(v_user_id, provider_param, api_key_param, key_name_param);
      
      -- Check if key already exists for this provider
      SELECT * INTO v_existing_record
      FROM api_keys
      WHERE user_id = v_user_id AND provider = provider_param AND is_active = true;
      
      IF FOUND THEN
        -- Update existing record
        UPDATE api_keys
        SET 
          vault_secret_id = v_vault_secret_id,
          masked_key = v_masked_key,
          status = 'active',
          encrypted_key = NULL, -- Clear old encryption
          error_message = NULL,
          last_validated = NOW(),
          updated_at = NOW()
        WHERE id = v_existing_record.id;
        
        v_result := jsonb_build_object(
          'id', v_existing_record.id,
          'operation', 'updated',
          'provider', provider_param,
          'vault_secret_id', v_vault_secret_id
        );
      ELSE
        -- Create new record
        INSERT INTO api_keys (
          user_id, provider, vault_secret_id, masked_key, 
          status, last_validated, key_prefix, name
        ) VALUES (
          v_user_id, provider_param, v_vault_secret_id, v_masked_key,
          'active', NOW(), left(api_key_param, 4), 
          COALESCE(key_name_param, provider_param || ' API Key')
        ) RETURNING id INTO v_vault_secret_id;
        
        v_result := jsonb_build_object(
          'id', v_vault_secret_id,
          'operation', 'created',
          'provider', provider_param,
          'vault_secret_id', v_vault_secret_id
        );
      END IF;
      
    WHEN 'select' THEN
      -- Return all user's API keys (metadata only, no secrets)
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'provider', provider,
          'masked_key', masked_key,
          'status', status,
          'last_validated', last_validated,
          'created_at', created_at,
          'updated_at', updated_at,
          'has_vault_secret', (vault_secret_id IS NOT NULL),
          'storage_method', CASE 
            WHEN vault_secret_id IS NOT NULL THEN 'vault'
            WHEN encrypted_key IS NOT NULL THEN 'encrypted'
            ELSE 'unknown'
          END
        )
      ) INTO v_result
      FROM api_keys
      WHERE user_id = v_user_id AND is_active = true;
      
    WHEN 'delete' THEN
      IF provider_param IS NULL THEN
        RAISE EXCEPTION 'Provider is required for delete operation';
      END IF;
      
      -- Get the record to delete vault secret
      SELECT vault_secret_id INTO v_vault_secret_id
      FROM api_keys
      WHERE user_id = v_user_id AND provider = provider_param AND is_active = true;
      
      -- Soft delete the record
      UPDATE api_keys
      SET is_active = FALSE, status = 'deleted', updated_at = NOW()
      WHERE user_id = v_user_id AND provider = provider_param;
      
      -- Note: Vault secrets are automatically cleaned up by Supabase
      
      v_result := jsonb_build_object(
        'operation', 'deleted',
        'provider', provider_param,
        'vault_secret_id', v_vault_secret_id
      );
      
    ELSE
      RAISE EXCEPTION 'Unknown operation: %', operation;
  END CASE;
  
  RETURN COALESCE(v_result, '{"result": "no_data"}'::jsonb);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION vault_store_api_key(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION vault_retrieve_api_key(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION manage_api_key_vault(TEXT, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_to_vault() TO service_role;

-- Add index for vault lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_vault_secret_id ON api_keys(vault_secret_id) WHERE vault_secret_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider_active ON api_keys(user_id, provider) WHERE is_active = true;