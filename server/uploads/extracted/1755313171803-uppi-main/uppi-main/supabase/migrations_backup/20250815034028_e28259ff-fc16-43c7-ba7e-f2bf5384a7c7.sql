-- Check if the manage_api_key_vault function exists and create vault functions for API key management

-- Create the vault storage function for API keys
CREATE OR REPLACE FUNCTION vault_store_api_key(
    p_user_id UUID,
    p_provider TEXT,
    p_api_key TEXT,
    p_key_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_vault_secret_id UUID;
    v_masked_key TEXT;
    v_key_prefix TEXT;
BEGIN
    -- Create masked version of key (show first 3 and last 4 characters)
    v_masked_key := CASE 
        WHEN length(p_api_key) > 7 THEN 
            left(p_api_key, 3) || '...' || right(p_api_key, 4)
        ELSE 
            '***'
    END;
    
    -- Extract key prefix for identification
    v_key_prefix := left(p_api_key, 4);
    
    -- Store in vault using Supabase's vault.create_secret function
    INSERT INTO vault.secrets (name, secret, key_id)
    VALUES (p_key_name, p_api_key, vault.create_key())
    RETURNING id INTO v_vault_secret_id;
    
    -- Insert or update the API key record
    INSERT INTO public.api_keys (
        user_id, provider, vault_secret_id, masked_key, key_prefix, 
        status, is_active, last_validated, created_at, updated_at
    ) VALUES (
        p_user_id, p_provider, v_vault_secret_id, v_masked_key, v_key_prefix,
        'active', true, now(), now(), now()
    )
    ON CONFLICT (user_id, provider) 
    DO UPDATE SET 
        vault_secret_id = EXCLUDED.vault_secret_id,
        masked_key = EXCLUDED.masked_key,
        key_prefix = EXCLUDED.key_prefix,
        status = 'active',
        is_active = true,
        last_validated = now(),
        updated_at = now();
    
    RETURN v_vault_secret_id;
END;
$$;

-- Create the vault retrieval function for API keys
CREATE OR REPLACE FUNCTION vault_retrieve_api_key(
    p_user_id UUID,
    p_provider TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_secret_id UUID;
    v_api_key TEXT;
BEGIN
    -- Get the vault secret ID from the API keys table
    SELECT vault_secret_id INTO v_secret_id
    FROM public.api_keys
    WHERE user_id = p_user_id 
      AND provider = p_provider 
      AND is_active = true
      AND vault_secret_id IS NOT NULL
    LIMIT 1;
    
    IF v_secret_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Retrieve the secret from vault
    SELECT decrypted_secret INTO v_api_key
    FROM vault.decrypted_secrets
    WHERE id = v_secret_id;
    
    RETURN v_api_key;
END;
$$;

-- Create the main vault management function
CREATE OR REPLACE FUNCTION manage_api_key_vault(
    operation TEXT,
    user_id_param UUID DEFAULT NULL,
    provider_param TEXT DEFAULT NULL,
    api_key_param TEXT DEFAULT NULL,
    key_name_param TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSONB;
    v_vault_secret_id UUID;
    v_api_key TEXT;
    v_keys JSONB;
BEGIN
    CASE operation
        WHEN 'save' THEN
            -- Store API key in vault
            SELECT vault_store_api_key(user_id_param, provider_param, api_key_param, key_name_param) 
            INTO v_vault_secret_id;
            
            v_result := jsonb_build_object(
                'operation', 'save',
                'vault_secret_id', v_vault_secret_id,
                'provider', provider_param,
                'status', 'success'
            );
            
        WHEN 'get_all_statuses' THEN
            -- Get all API key statuses for user
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ak.id,
                    'provider', ak.provider,
                    'masked_key', ak.masked_key,
                    'status', ak.status,
                    'last_validated', ak.last_validated,
                    'created_at', ak.created_at,
                    'updated_at', ak.updated_at,
                    'has_vault_secret', (ak.vault_secret_id IS NOT NULL),
                    'storage_method', CASE 
                        WHEN ak.vault_secret_id IS NOT NULL THEN 'supabase_vault'
                        ELSE 'legacy'
                    END
                )
            ) INTO v_keys
            FROM public.api_keys ak
            WHERE ak.user_id = user_id_param AND ak.is_active = true;
            
            v_result := COALESCE(v_keys, '[]'::jsonb);
            
        WHEN 'delete' THEN
            -- Delete API key and vault secret
            SELECT vault_secret_id INTO v_vault_secret_id
            FROM public.api_keys
            WHERE user_id = user_id_param 
              AND provider = provider_param 
              AND is_active = true;
            
            -- Mark as inactive instead of hard delete
            UPDATE public.api_keys 
            SET is_active = false, updated_at = now()
            WHERE user_id = user_id_param AND provider = provider_param;
            
            -- Delete from vault if exists
            IF v_vault_secret_id IS NOT NULL THEN
                DELETE FROM vault.secrets WHERE id = v_vault_secret_id;
            END IF;
            
            v_result := jsonb_build_object(
                'operation', 'delete',
                'vault_secret_id', v_vault_secret_id,
                'provider', provider_param,
                'status', 'success'
            );
            
        ELSE
            RAISE EXCEPTION 'Unknown operation: %', operation;
    END CASE;
    
    RETURN v_result;
END;
$$;