-- Create secure API key storage and retrieval functions

-- Function to securely store API keys
CREATE OR REPLACE FUNCTION public.store_api_key_secure(
  user_id_param UUID,
  provider_param TEXT,
  api_key_param TEXT,
  key_hash_param TEXT,
  masked_key_param TEXT,
  key_prefix_param TEXT,
  encryption_context TEXT DEFAULT 'vault_v2'
)
RETURNS TABLE(id UUID, masked_key TEXT, provider TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_key_id UUID;
  encrypted_key BYTEA;
BEGIN
  -- Validate input
  IF user_id_param IS NULL OR provider_param IS NULL OR api_key_param IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;
  
  -- Encrypt the API key using the secure function
  encrypted_key := encrypt_sensitive_data_secure(api_key_param, encryption_context);
  
  -- Deactivate any existing keys for this provider/user
  UPDATE api_keys 
  SET is_active = FALSE, 
      status = 'replaced',
      updated_at = now()
  WHERE user_id = user_id_param 
    AND provider = provider_param 
    AND is_active = TRUE;
  
  -- Insert new encrypted key
  INSERT INTO api_keys (
    user_id, provider, api_key, key_hash, masked_key, key_prefix,
    status, is_active, encryption_version, last_security_audit,
    created_at, updated_at
  ) VALUES (
    user_id_param, provider_param, encrypted_key::TEXT, key_hash_param, 
    masked_key_param, key_prefix_param, 'active', TRUE, 2, now(),
    now(), now()
  ) RETURNING api_keys.id INTO new_key_id;
  
  -- Return success info
  RETURN QUERY SELECT new_key_id, masked_key_param, provider_param;
END;
$$;

-- Function to securely retrieve API keys
CREATE OR REPLACE FUNCTION public.retrieve_api_key_secure(
  user_id_param UUID,
  provider_param TEXT,
  key_id_param UUID DEFAULT NULL,
  access_context TEXT DEFAULT 'vault_retrieval'
)
RETURNS TABLE(id UUID, api_key TEXT, provider TEXT, status TEXT, masked_key TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  key_record RECORD;
  decrypted_key TEXT;
BEGIN
  -- Find the key
  SELECT ak.id, ak.api_key, ak.provider, ak.status, ak.masked_key, ak.encryption_version
  INTO key_record
  FROM api_keys ak
  WHERE ak.user_id = user_id_param 
    AND ak.provider = provider_param
    AND ak.is_active = TRUE
    AND (key_id_param IS NULL OR ak.id = key_id_param)
  ORDER BY ak.created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'API key not found';
  END IF;
  
  -- Decrypt the key based on encryption version
  IF key_record.encryption_version = 2 THEN
    -- Use new secure decryption
    decrypted_key := decrypt_sensitive_data_secure(key_record.api_key::BYTEA, access_context);
  ELSE
    -- Fallback to legacy decryption
    decrypted_key := decrypt_sensitive_data(key_record.api_key::BYTEA);
  END IF;
  
  IF decrypted_key IS NULL THEN
    RAISE EXCEPTION 'Failed to decrypt API key';
  END IF;
  
  -- Update last used timestamp
  UPDATE api_keys 
  SET last_used_at = now(), 
      updated_at = now()
  WHERE id = key_record.id;
  
  -- Return decrypted key data
  RETURN QUERY SELECT 
    key_record.id, 
    decrypted_key, 
    key_record.provider, 
    key_record.status, 
    key_record.masked_key;
END;
$$;

-- Function to update API key validation status
CREATE OR REPLACE FUNCTION public.update_api_key_validation(
  key_id_param UUID,
  is_valid_param BOOLEAN,
  validated_at_param TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE api_keys 
  SET 
    status = CASE WHEN is_valid_param THEN 'active' ELSE 'invalid' END,
    last_validated = validated_at_param,
    updated_at = now(),
    last_security_audit = now()
  WHERE id = key_id_param 
    AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Function to get user role for security checks
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is super admin
  SELECT email INTO user_role
  FROM auth.users 
  WHERE id = user_id_param;
  
  IF public.is_super_admin(user_role) THEN
    RETURN 'super_admin';
  END IF;
  
  -- Check user_roles table
  SELECT role INTO user_role
  FROM user_roles 
  WHERE user_id = user_id_param 
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Add trigger to audit all API key table changes
CREATE OR REPLACE FUNCTION public.audit_api_key_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all changes to API keys table
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id, 
    old_values, new_values, metadata, created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    'api_key_' || lower(TG_OP),
    'api_keys',
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'provider', COALESCE(NEW.provider, OLD.provider),
      'audit_timestamp', now(),
      'security_context', 'comprehensive_audit'
    ),
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply the audit trigger
DROP TRIGGER IF EXISTS api_key_comprehensive_audit ON api_keys;
CREATE TRIGGER api_key_comprehensive_audit
  AFTER INSERT OR UPDATE OR DELETE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION audit_api_key_changes();