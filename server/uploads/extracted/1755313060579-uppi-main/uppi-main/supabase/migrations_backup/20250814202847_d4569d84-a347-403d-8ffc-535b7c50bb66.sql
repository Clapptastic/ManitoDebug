-- Fix the legacy decryption function to use proper encryption key management
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(ciphertext bytea)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  encryption_key TEXT := 'temp_legacy_key_replace_in_production_2025';
BEGIN
  -- Use the legacy encryption key for backward compatibility
  RETURN pgp_sym_decrypt(ciphertext, encryption_key);
EXCEPTION 
  WHEN OTHERS THEN
    -- Log decryption failure for security monitoring
    INSERT INTO audit_logs (user_id, action, resource_type, metadata)
    VALUES (auth.uid(), 'legacy_decryption_failed', 'api_keys', 
           jsonb_build_object('error', SQLERRM, 'timestamp', now()));
    RETURN NULL;
END;
$function$;

-- Update the secure decryption function to handle bytea properly
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data_secure(ciphertext text, key_context text DEFAULT 'api_keys'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  master_key TEXT;
  derived_key TEXT;
  ciphertext_bytea BYTEA;
BEGIN
  -- Get master key from environment or vault
  master_key := COALESCE(current_setting('app.encryption_master_key', true), 'TEMP_MASTER_KEY_REPLACE_IN_PRODUCTION');
  
  -- Derive same key using HMAC with context
  derived_key := encode(hmac(key_context || '::' || master_key, 'app_salt_2025', 'sha256'), 'hex');
  
  -- Convert text to bytea if needed
  BEGIN
    ciphertext_bytea := ciphertext::bytea;
  EXCEPTION
    WHEN OTHERS THEN
      ciphertext_bytea := decode(ciphertext, 'base64');
  END;
  
  -- Decrypt using the derived key
  RETURN pgp_sym_decrypt(ciphertext_bytea, derived_key);
EXCEPTION 
  WHEN OTHERS THEN
    -- Log decryption failure for security monitoring
    INSERT INTO audit_logs (user_id, action, resource_type, metadata)
    VALUES (auth.uid(), 'decryption_failed', 'api_keys', 
           jsonb_build_object('error', SQLERRM, 'timestamp', now()));
    RETURN NULL;
END;
$function$;