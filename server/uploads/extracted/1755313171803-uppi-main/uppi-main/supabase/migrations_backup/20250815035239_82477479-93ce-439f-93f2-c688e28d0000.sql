-- Drop existing function and recreate without parameter defaults conflict
DROP FUNCTION IF EXISTS public.manage_api_key_vault(text,uuid,text,text,text);

-- Create the manage_api_key_vault function
CREATE OR REPLACE FUNCTION public.manage_api_key_vault(
  operation text,
  user_id_param uuid,
  provider_param text,
  api_key_param text,
  key_name_param text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_vault_secret_id UUID;
  v_masked_key TEXT;
  v_key_prefix TEXT;
  v_result JSONB;
BEGIN
  -- Log the operation for debugging
  RAISE NOTICE 'manage_api_key_vault called with operation: %, user: %, provider: %', operation, user_id_param, provider_param;
  
  CASE operation
    WHEN 'save' THEN
      -- Create masked version of key (show first 3 and last 4 characters)
      v_masked_key := CASE 
        WHEN length(api_key_param) > 7 THEN 
          left(api_key_param, 3) || '...' || right(api_key_param, 4)
        ELSE 
          '***'
      END;
      
      -- Extract key prefix for identification
      v_key_prefix := left(api_key_param, 4);
      
      -- Store in vault using vault_store_api_key function
      v_vault_secret_id := vault_store_api_key(user_id_param, provider_param, api_key_param, key_name_param);
      
      RETURN jsonb_build_object(
        'operation', 'save',
        'vault_secret_id', v_vault_secret_id,
        'provider', provider_param,
        'masked_key', v_masked_key,
        'success', true
      );
      
    WHEN 'get_all_statuses' THEN
      -- Get all API keys for the user
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
          'has_vault_secret', (ak.vault_secret_id IS NOT NULL),
          'storage_method', CASE 
            WHEN ak.vault_secret_id IS NOT NULL THEN 'supabase_vault'
            ELSE 'legacy'
          END
        )
      ) INTO v_result
      FROM public.api_keys ak
      WHERE ak.user_id = user_id_param AND ak.is_active = true;
      
      RETURN COALESCE(v_result, '[]'::jsonb);
      
    WHEN 'delete' THEN
      -- Soft delete the API key
      UPDATE public.api_keys 
      SET 
        is_active = false,
        status = 'deleted',
        updated_at = now()
      WHERE user_id = user_id_param 
        AND provider = provider_param
        AND is_active = true;
      
      RETURN jsonb_build_object(
        'operation', 'delete',
        'provider', provider_param,
        'success', true
      );
      
    ELSE
      RAISE EXCEPTION 'Unknown operation: %', operation;
  END CASE;
END;
$function$;