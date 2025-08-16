-- Optimize API Keys table structure and add missing indexes
-- Add performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_provider ON api_keys(user_id, provider) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_active ON api_keys(user_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_vault_secret ON api_keys(vault_secret_id) WHERE vault_secret_id IS NOT NULL;

-- Add status tracking
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS health_check_at timestamp with time zone;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS consecutive_failures integer DEFAULT 0;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_validated boolean DEFAULT false;

-- Update RLS policies for better performance
DROP POLICY IF EXISTS "api_keys_user_read" ON api_keys;
DROP POLICY IF EXISTS "api_keys_user_insert" ON api_keys;
DROP POLICY IF EXISTS "api_keys_user_update" ON api_keys;
DROP POLICY IF EXISTS "api_keys_user_delete" ON api_keys;

-- Recreate optimized RLS policies
CREATE POLICY "api_keys_secure_read" ON api_keys
FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.role() = 'service_role'::text 
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "api_keys_secure_insert" ON api_keys
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR auth.role() = 'service_role'::text
);

CREATE POLICY "api_keys_secure_update" ON api_keys
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR auth.role() = 'service_role'::text
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "api_keys_secure_delete" ON api_keys
FOR DELETE
USING (
  auth.uid() = user_id 
  OR auth.role() = 'service_role'::text
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Create improved vault management function
CREATE OR REPLACE FUNCTION public.secure_api_key_operations(
  operation_type text,
  user_id_param uuid,
  provider_param text DEFAULT NULL,
  api_key_param text DEFAULT NULL,
  key_id_param uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_secret_id uuid;
  v_masked_key text;
  v_key_prefix text;
BEGIN
  -- Verify authorization
  IF NOT (
    auth.uid() = user_id_param 
    OR auth.role() = 'service_role'::text
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;

  CASE operation_type
    WHEN 'create' THEN
      -- Validate inputs
      IF provider_param IS NULL OR api_key_param IS NULL THEN
        RAISE EXCEPTION 'Provider and API key are required for create operation';
      END IF;

      -- Create masked key and prefix
      v_masked_key := CASE 
        WHEN length(api_key_param) > 7 THEN 
          left(api_key_param, 3) || '••••' || right(api_key_param, 4)
        ELSE '••••••••'
      END;
      
      v_key_prefix := left(api_key_param, 4);

      -- Store in vault
      INSERT INTO vault.secrets (name, secret, key_id)
      VALUES (
        format('%s_%s_%s', user_id_param, provider_param, extract(epoch from now())),
        api_key_param,
        vault.create_key()
      )
      RETURNING id INTO v_secret_id;

      -- Insert/update API key record
      INSERT INTO api_keys (
        user_id, provider, vault_secret_id, masked_key, key_prefix,
        status, is_active, is_validated, health_check_at, 
        consecutive_failures, created_at, updated_at
      ) VALUES (
        user_id_param, provider_param, v_secret_id, v_masked_key, v_key_prefix,
        'active', true, false, now(), 0, now(), now()
      )
      ON CONFLICT (user_id, provider) 
      DO UPDATE SET 
        vault_secret_id = EXCLUDED.vault_secret_id,
        masked_key = EXCLUDED.masked_key,
        key_prefix = EXCLUDED.key_prefix,
        status = 'active',
        is_active = true,
        is_validated = false,
        health_check_at = now(),
        consecutive_failures = 0,
        updated_at = now()
      RETURNING id INTO v_secret_id;

      v_result := jsonb_build_object(
        'success', true,
        'operation', 'create',
        'id', v_secret_id,
        'provider', provider_param,
        'masked_key', v_masked_key
      );

    WHEN 'list' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ak.id,
          'provider', ak.provider,
          'masked_key', ak.masked_key,
          'status', ak.status,
          'is_active', ak.is_active,
          'is_validated', ak.is_validated,
          'last_validated', ak.last_validated,
          'health_check_at', ak.health_check_at,
          'consecutive_failures', ak.consecutive_failures,
          'created_at', ak.created_at,
          'updated_at', ak.updated_at
        )
      ) INTO v_result
      FROM api_keys ak
      WHERE ak.user_id = user_id_param AND ak.is_active = true
      ORDER BY ak.created_at DESC;

      v_result := jsonb_build_object(
        'success', true,
        'operation', 'list',
        'data', COALESCE(v_result, '[]'::jsonb)
      );

    WHEN 'delete' THEN
      IF key_id_param IS NULL THEN
        RAISE EXCEPTION 'Key ID is required for delete operation';
      END IF;

      -- Soft delete
      UPDATE api_keys 
      SET 
        is_active = false,
        status = 'deleted',
        updated_at = now()
      WHERE id = key_id_param AND user_id = user_id_param;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'API key not found or access denied';
      END IF;

      v_result := jsonb_build_object(
        'success', true,
        'operation', 'delete',
        'id', key_id_param
      );

    WHEN 'validate' THEN
      -- Mark key as validated (health check passed)
      UPDATE api_keys
      SET 
        is_validated = true,
        last_validated = now(),
        health_check_at = now(),
        consecutive_failures = 0,
        status = 'active',
        updated_at = now()
      WHERE user_id = user_id_param 
        AND provider = provider_param 
        AND is_active = true;

      v_result := jsonb_build_object(
        'success', true,
        'operation', 'validate',
        'provider', provider_param
      );

    WHEN 'get_secret' THEN
      -- Retrieve decrypted API key (for edge functions only)
      IF auth.role() != 'service_role'::text THEN
        RAISE EXCEPTION 'Secret retrieval only allowed for service role';
      END IF;

      SELECT vs.decrypted_secret
      INTO v_result
      FROM api_keys ak
      JOIN vault.decrypted_secrets vs ON ak.vault_secret_id = vs.id
      WHERE ak.user_id = user_id_param 
        AND ak.provider = provider_param 
        AND ak.is_active = true;

      IF v_result IS NULL THEN
        v_result := jsonb_build_object('success', false, 'error', 'API key not found');
      ELSE
        v_result := jsonb_build_object('success', true, 'secret', v_result);
      END IF;

    ELSE
      RAISE EXCEPTION 'Unknown operation: %', operation_type;
  END CASE;

  RETURN v_result;
END;
$$;