-- Drop the old version of manage_api_key function to resolve conflicts
DROP FUNCTION IF EXISTS public.manage_api_key(text, uuid, text, text, text, text, text);

-- Ensure we only have the new version that supports delete operations
-- This should already exist from our previous migration but let's make sure it's correct
CREATE OR REPLACE FUNCTION public.manage_api_key(
  operation text,
  user_id_param uuid,
  provider_param text DEFAULT NULL,
  api_key_param text DEFAULT NULL,
  masked_key_param text DEFAULT NULL,
  key_hash_param text DEFAULT NULL,
  key_prefix_param text DEFAULT NULL,
  api_key_id_param uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  existing_key_id uuid;
BEGIN
  -- Verify the user is authenticated and matches the user_id_param or is super admin
  IF NOT (
    auth.uid() = user_id_param OR 
    auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
    get_user_role(auth.uid()) = 'super_admin' OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions';
  END IF;

  CASE operation
    WHEN 'insert' THEN
      -- Check if key already exists for this user/provider
      SELECT id INTO existing_key_id 
      FROM api_keys 
      WHERE user_id = user_id_param AND provider = provider_param;
      
      IF existing_key_id IS NOT NULL THEN
        -- Update existing key
        UPDATE api_keys 
        SET 
          api_key = api_key_param,
          key_hash = key_hash_param,
          masked_key = masked_key_param,
          key_prefix = key_prefix_param,
          is_active = true,
          status = 'active',
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
        -- Insert new key
        INSERT INTO api_keys (
          user_id, provider, name, api_key, key_hash, masked_key, 
          key_prefix, is_active, status, permissions
        ) VALUES (
          user_id_param, provider_param, provider_param, api_key_param,
          key_hash_param, masked_key_param, key_prefix_param, 
          true, 'active', '["read", "write"]'::jsonb
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
      -- Get all API keys for user
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
      FROM api_keys 
      WHERE user_id = user_id_param AND is_active = true;
      
    WHEN 'delete' THEN
      -- Delete API key by ID
      DELETE FROM api_keys 
      WHERE id = api_key_id_param 
        AND user_id = user_id_param;
      
      -- Return success confirmation
      result := jsonb_build_object('success', true, 'deleted_id', api_key_id_param);
      
    WHEN 'get_for_decryption' THEN
      -- Get API key with encrypted value for edge functions
      SELECT jsonb_build_object(
        'id', id,
        'provider', provider,
        'api_key', api_key,
        'status', status
      ) INTO result
      FROM api_keys 
      WHERE user_id = user_id_param 
        AND provider = provider_param 
        AND is_active = true;
        
    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;