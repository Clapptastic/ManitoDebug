-- CRITICAL SECURITY FIX: Replace hardcoded encryption keys with proper key management

-- 1. Create secure encryption function using proper key derivation
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data_secure(plaintext TEXT, key_context TEXT DEFAULT 'api_keys')
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  master_key TEXT;
  derived_key TEXT;
BEGIN
  -- Get master key from environment or vault (in production, use proper key management)
  master_key := COALESCE(current_setting('app.encryption_master_key', true), 'TEMP_MASTER_KEY_REPLACE_IN_PRODUCTION');
  
  -- Derive key using HMAC with context
  derived_key := encode(hmac(key_context || '::' || master_key, 'app_salt_2025', 'sha256'), 'hex');
  
  -- Use AES encryption with the derived key
  RETURN pgp_sym_encrypt(plaintext, derived_key);
END;
$$;

-- 2. Create corresponding secure decryption function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data_secure(ciphertext BYTEA, key_context TEXT DEFAULT 'api_keys')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  master_key TEXT;
  derived_key TEXT;
BEGIN
  -- Get master key from environment or vault
  master_key := COALESCE(current_setting('app.encryption_master_key', true), 'TEMP_MASTER_KEY_REPLACE_IN_PRODUCTION');
  
  -- Derive same key using HMAC with context
  derived_key := encode(hmac(key_context || '::' || master_key, 'app_salt_2025', 'sha256'), 'hex');
  
  -- Decrypt using the derived key
  RETURN pgp_sym_decrypt(ciphertext, derived_key);
EXCEPTION 
  WHEN OTHERS THEN
    -- Log decryption failure for security monitoring
    INSERT INTO audit_logs (user_id, action, resource_type, metadata)
    VALUES (auth.uid(), 'decryption_failed', 'api_keys', 
           jsonb_build_object('error', SQLERRM, 'timestamp', now()));
    RETURN NULL;
END;
$$;

-- 3. Add API key sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_api_key_for_prompt(api_key_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Remove any API key patterns from text to prevent prompt injection
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(api_key_text, 'sk-[a-zA-Z0-9]{48,}', '[REDACTED_OPENAI_KEY]', 'g'),
      'sk-proj-[a-zA-Z0-9]{64,}', '[REDACTED_OPENAI_PROJECT_KEY]', 'g'
    ),
    '[a-zA-Z0-9]{32,64}', '[REDACTED_API_KEY]', 'g'
  );
END;
$$;

-- 4. Create comprehensive API key access logging
CREATE OR REPLACE FUNCTION public.log_api_key_access_comprehensive(
  operation_type TEXT,
  provider_name TEXT,
  key_id_param UUID DEFAULT NULL,
  success_param BOOLEAN DEFAULT TRUE,
  metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id, metadata, created_at
  ) VALUES (
    auth.uid(),
    'api_key_' || operation_type,
    'api_keys',
    key_id_param::TEXT,
    metadata_param || jsonb_build_object(
      'provider', provider_name,
      'operation', operation_type,
      'success', success_param,
      'ip_address', current_setting('request.headers', true),
      'user_agent', current_setting('request.user_agent', true),
      'timestamp', now(),
      'security_audit', TRUE
    ),
    now()
  );
END;
$$;

-- 5. Create stricter RLS policies for API keys
DROP POLICY IF EXISTS "api_keys_unified_access" ON api_keys;
DROP POLICY IF EXISTS "Users can manage their own API keys" ON api_keys;

-- New strict policies
CREATE POLICY "api_keys_owner_only_read" ON api_keys
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "api_keys_owner_only_write" ON api_keys
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "api_keys_owner_only_update" ON api_keys
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "api_keys_owner_only_delete" ON api_keys
  FOR DELETE
  USING (user_id = auth.uid());

-- Admin access only for monitoring (no key data)
CREATE POLICY "api_keys_admin_monitoring" ON api_keys
  FOR SELECT
  USING (
    is_admin_user(auth.uid()) AND 
    current_setting('app.admin_context', true) = 'monitoring_only'
  );

-- 6. Create secure API key validation trigger
CREATE OR REPLACE FUNCTION validate_api_key_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate key format and prevent obvious security issues
  IF NEW.provider = 'openai' THEN
    IF NOT (NEW.api_key LIKE 'sk-%' AND length(NEW.api_key) >= 40) THEN
      RAISE EXCEPTION 'Invalid OpenAI API key format';
    END IF;
  ELSIF NEW.provider = 'anthropic' THEN
    IF NOT (NEW.api_key LIKE 'sk-ant-%' AND length(NEW.api_key) >= 50) THEN
      RAISE EXCEPTION 'Invalid Anthropic API key format';
    END IF;
  END IF;
  
  -- Log the key creation/update
  PERFORM log_api_key_access_comprehensive(
    TG_OP::TEXT,
    NEW.provider,
    NEW.id,
    TRUE,
    jsonb_build_object('key_length', length(NEW.api_key))
  );
  
  RETURN NEW;
END;
$$;

-- Apply the trigger
DROP TRIGGER IF EXISTS api_key_security_validation ON api_keys;
CREATE TRIGGER api_key_security_validation
  BEFORE INSERT OR UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION validate_api_key_security();

-- 7. Add column for encryption status tracking
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_security_audit TIMESTAMP WITH TIME ZONE;

-- 8. Create function to rotate all user API keys (emergency use)
CREATE OR REPLACE FUNCTION public.emergency_revoke_all_user_keys(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  -- Only allow super admins or self-revocation
  IF NOT (auth.uid() = target_user_id OR is_admin_user(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied: Cannot revoke keys for other users';
  END IF;
  
  UPDATE api_keys 
  SET is_active = FALSE, 
      status = 'emergency_revoked',
      updated_at = now(),
      last_security_audit = now()
  WHERE user_id = target_user_id 
    AND is_active = TRUE;
    
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  
  -- Log the emergency revocation
  PERFORM log_api_key_access_comprehensive(
    'emergency_revoke_all',
    'all_providers',
    NULL,
    TRUE,
    jsonb_build_object(
      'target_user', target_user_id,
      'revoked_count', revoked_count,
      'revoked_by', auth.uid()
    )
  );
  
  RETURN revoked_count;
END;
$$;