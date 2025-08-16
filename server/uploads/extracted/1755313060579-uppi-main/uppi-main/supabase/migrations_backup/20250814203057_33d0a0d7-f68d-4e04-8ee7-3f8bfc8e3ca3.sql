-- Remove all legacy encryption/decryption functions
DROP FUNCTION IF EXISTS public.decrypt_sensitive_data(bytea);
DROP FUNCTION IF EXISTS public.encrypt_sensitive_data(text);

-- Remove legacy API key management functions that don't use vault
DROP FUNCTION IF EXISTS public.hash_api_key(text);

-- Update the API keys table to only support vault encryption
ALTER TABLE public.api_keys DROP COLUMN IF EXISTS api_key;
ALTER TABLE public.api_keys DROP COLUMN IF EXISTS encryption_version;
ALTER TABLE public.api_keys DROP COLUMN IF EXISTS key_hash;
ALTER TABLE public.api_keys DROP COLUMN IF EXISTS key_hash_new;

-- Ensure vault_secret_id is required for all new keys
ALTER TABLE public.api_keys ALTER COLUMN vault_secret_id SET NOT NULL;

-- Remove any legacy API keys that don't have vault_secret_id
DELETE FROM public.api_keys WHERE vault_secret_id IS NULL;

-- Update the secure API key access function to only work with vault
CREATE OR REPLACE FUNCTION public.secure_api_key_access(target_user_id uuid, operation text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Only authenticated users can access their own API keys
  IF auth.uid() = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Service role has full access
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;
  
  -- Admins have read access to all keys for management
  IF operation = 'read' AND get_user_role(auth.uid()) = ANY (ARRAY['admin','super_admin']) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Create unified vault-based API key management function
CREATE OR REPLACE FUNCTION public.manage_api_key_vault(
  operation text,
  user_id_param uuid,
  provider_param text,
  api_key_param text DEFAULT NULL,
  key_id_param uuid DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  vault_secret_id uuid;
  masked_key text;
  key_prefix text;
  result_data jsonb;
BEGIN
  -- Validate authentication
  IF NOT secure_api_key_access(user_id_param, operation) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  CASE operation
    WHEN 'insert' THEN
      -- Create vault secret
      INSERT INTO vault.secrets (name, secret)
      VALUES (
        'api_key_' || provider_param || '_' || user_id_param || '_' || gen_random_uuid(),
        api_key_param
      )
      RETURNING id INTO vault_secret_id;
      
      -- Generate masked key and prefix
      masked_key := substring(api_key_param, 1, 3) || '...' || substring(api_key_param, -4);
      key_prefix := substring(api_key_param, 1, 8);
      
      -- Deactivate existing keys for this provider
      UPDATE api_keys 
      SET is_active = false, status = 'replaced', updated_at = now()
      WHERE user_id = user_id_param AND provider = provider_param AND is_active = true;
      
      -- Insert new vault-encrypted key
      INSERT INTO api_keys (
        user_id, provider, vault_secret_id, masked_key, key_prefix,
        status, is_active, created_at, updated_at
      ) VALUES (
        user_id_param, provider_param, vault_secret_id, masked_key, key_prefix,
        'active', true, now(), now()
      ) RETURNING jsonb_build_object(
        'id', id,
        'provider', provider,
        'masked_key', masked_key,
        'status', status
      ) INTO result_data;
      
    WHEN 'select' THEN
      -- Get API key metadata (not the actual key)
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'provider', provider,
        'masked_key', masked_key,
        'status', status,
        'is_active', is_active,
        'last_validated', last_validated,
        'created_at', created_at
      ))
      INTO result_data
      FROM api_keys
      WHERE user_id = user_id_param 
        AND (provider_param IS NULL OR provider = provider_param)
        AND is_active = true;
        
    WHEN 'delete' THEN
      -- Soft delete (deactivate)
      UPDATE api_keys 
      SET is_active = false, status = 'deleted', updated_at = now()
      WHERE id = key_id_param AND user_id = user_id_param
      RETURNING jsonb_build_object('deleted', true, 'id', id) INTO result_data;
      
    ELSE
      RAISE EXCEPTION 'Unknown operation: %', operation;
  END CASE;
  
  -- Log the operation
  PERFORM log_api_key_access_comprehensive(
    operation,
    COALESCE(provider_param, 'unknown'),
    key_id_param,
    true,
    jsonb_build_object('vault_based', true)
  );
  
  RETURN COALESCE(result_data, '{}'::jsonb);
END;
$function$;

-- Create function to get decrypted API key from vault
CREATE OR REPLACE FUNCTION public.get_api_key_from_vault(
  user_id_param uuid,
  provider_param text
)
 RETURNS TABLE(api_key text, id uuid, status text, masked_key text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  key_record record;
  decrypted_key text;
BEGIN
  -- Validate access
  IF NOT secure_api_key_access(user_id_param, 'read') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Find the active key
  SELECT ak.id, ak.vault_secret_id, ak.status, ak.masked_key
  INTO key_record
  FROM api_keys ak
  WHERE ak.user_id = user_id_param 
    AND ak.provider = provider_param
    AND ak.is_active = true
    AND ak.vault_secret_id IS NOT NULL
  ORDER BY ak.created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active API key found for provider: %', provider_param;
  END IF;
  
  -- Get decrypted key from vault
  SELECT decrypted_secret INTO decrypted_key
  FROM vault.decrypted_secrets
  WHERE id = key_record.vault_secret_id;
  
  IF decrypted_key IS NULL THEN
    RAISE EXCEPTION 'Failed to decrypt API key from vault';
  END IF;
  
  -- Update last used timestamp
  UPDATE api_keys 
  SET last_used_at = now(), updated_at = now()
  WHERE id = key_record.id;
  
  -- Return the decrypted key
  RETURN QUERY SELECT 
    decrypted_key,
    key_record.id,
    key_record.status,
    key_record.masked_key;
END;
$function$;