-- Fix search_path security issue for functions
-- Update all functions to set search_path to 'public' for security

-- Update manage_api_key_vault function with proper search_path
CREATE OR REPLACE FUNCTION public.manage_api_key_vault(
    operation text,
    user_id_param uuid,
    provider_param text,
    api_key_param text DEFAULT NULL,
    key_name_param text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    existing_secret_id uuid;
    vault_result jsonb;
BEGIN
    -- Validate operation
    IF operation NOT IN ('store', 'retrieve', 'delete', 'list') THEN
        RAISE EXCEPTION 'Invalid operation: %', operation;
    END IF;

    -- Authorization check
    IF auth.uid() != user_id_param AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Store operation
    IF operation = 'store' THEN
        IF api_key_param IS NULL THEN
            RAISE EXCEPTION 'API key is required for store operation';
        END IF;

        -- Use vault to store the API key
        SELECT vault.create_secret(
            api_key_param,
            COALESCE(key_name_param, provider_param || '_key_' || user_id_param::text),
            jsonb_build_object('provider', provider_param, 'user_id', user_id_param::text)
        ) INTO existing_secret_id;

        -- Update or insert the API key record
        INSERT INTO api_keys (
            user_id, provider, vault_secret_id, masked_key, 
            status, is_active, created_at, updated_at
        ) VALUES (
            user_id_param, provider_param, existing_secret_id, 
            'sk-...' || right(api_key_param, 4),
            'active', true, now(), now()
        )
        ON CONFLICT (user_id, provider) DO UPDATE SET
            vault_secret_id = EXCLUDED.vault_secret_id,
            masked_key = EXCLUDED.masked_key,
            status = 'active',
            is_active = true,
            updated_at = now();

        result := jsonb_build_object('success', true, 'secret_id', existing_secret_id);

    -- Retrieve operation
    ELSIF operation = 'retrieve' THEN
        SELECT vault_secret_id INTO existing_secret_id
        FROM api_keys 
        WHERE user_id = user_id_param AND provider = provider_param AND is_active = true;

        IF existing_secret_id IS NULL THEN
            result := jsonb_build_object('success', false, 'error', 'No active API key found');
        ELSE
            SELECT vault.decrypted_secret(existing_secret_id) INTO vault_result;
            result := jsonb_build_object('success', true, 'api_key', vault_result);
        END IF;

    -- Delete operation
    ELSIF operation = 'delete' THEN
        SELECT vault_secret_id INTO existing_secret_id
        FROM api_keys 
        WHERE user_id = user_id_param AND provider = provider_param;

        IF existing_secret_id IS NOT NULL THEN
            PERFORM vault.delete_secret(existing_secret_id);
        END IF;

        UPDATE api_keys 
        SET is_active = false, updated_at = now()
        WHERE user_id = user_id_param AND provider = provider_param;

        result := jsonb_build_object('success', true);

    -- List operation
    ELSIF operation = 'list' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'provider', provider,
                'masked_key', masked_key,
                'status', status,
                'is_active', is_active
            )
        ) INTO result
        FROM api_keys 
        WHERE user_id = user_id_param AND is_active = true;

        result := jsonb_build_object('success', true, 'keys', COALESCE(result, '[]'::jsonb));
    END IF;

    -- Audit log
    INSERT INTO audit_logs (user_id, action, resource_type, metadata)
    VALUES (user_id_param, 'api_key_' || operation, 'api_keys', 
            jsonb_build_object('provider', provider_param, 'operation', operation));

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        INSERT INTO audit_logs (user_id, action, resource_type, metadata)
        VALUES (user_id_param, 'api_key_error', 'api_keys', 
                jsonb_build_object('error', SQLERRM, 'operation', operation));
        
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Update other critical functions with search_path
CREATE OR REPLACE FUNCTION public.insert_competitor_analysis_progress(
    session_id_param text,
    user_id_param uuid,
    status_param text DEFAULT 'pending',
    total_competitors_param integer DEFAULT 0,
    metadata_param jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_id uuid;
BEGIN
    -- Validate user authorization
    IF auth.uid() != user_id_param AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    INSERT INTO competitor_analysis_progress (
        session_id, user_id, status, total_competitors, metadata
    ) VALUES (
        session_id_param, user_id_param, status_param, total_competitors_param, metadata_param
    ) RETURNING id INTO new_id;

    RETURN new_id;
END;
$function$;

-- Update competitor analysis progress function
CREATE OR REPLACE FUNCTION public.update_competitor_analysis_progress(
    session_id_param text,
    status_param text DEFAULT NULL,
    progress_percentage_param numeric DEFAULT NULL,
    completed_competitors_param integer DEFAULT NULL,
    current_competitor_param text DEFAULT NULL,
    error_message_param text DEFAULT NULL,
    metadata_param jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE competitor_analysis_progress 
    SET 
        status = COALESCE(status_param, status),
        progress_percentage = COALESCE(progress_percentage_param, progress_percentage),
        completed_competitors = COALESCE(completed_competitors_param, completed_competitors),
        current_competitor = COALESCE(current_competitor_param, current_competitor),
        error_message = COALESCE(error_message_param, error_message),
        metadata = COALESCE(metadata_param, metadata),
        updated_at = now()
    WHERE session_id = session_id_param;

    RETURN FOUND;
END;
$function$;