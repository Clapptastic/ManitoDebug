-- PHASE 1 DAY 1: EMERGENCY SECURITY PATCHES

-- Fix function search path vulnerability (CRITICAL SECURITY ISSUE)
-- Add SET search_path to all functions without it
ALTER FUNCTION public.touch_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.increment_wireframe_version() SET search_path TO 'public';
ALTER FUNCTION public.handle_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';
ALTER FUNCTION public.update_user_provider_costs_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_prompt_flow_updated_at() SET search_path TO 'public';

-- Enable pgcrypto extension for field-level encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns for sensitive data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_encrypted BYTEA;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_encrypted BYTEA;

-- Add proper API key hashing
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_hash_new TEXT;

-- Create encryption/decryption functions
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(plaintext TEXT)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Use a fixed key for demo - in production, use proper key management
  RETURN pgp_sym_encrypt(plaintext, 'encryption_key_here');
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(ciphertext BYTEA)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN pgp_sym_decrypt(ciphertext, 'encryption_key_here');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Function to hash API keys securely
CREATE OR REPLACE FUNCTION hash_api_key(api_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN encode(digest(api_key, 'sha256'), 'hex');
END;
$$;

-- Add audit trail for sensitive data access
CREATE TABLE IF NOT EXISTS sensitive_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  access_type TEXT NOT NULL, -- 'read', 'write', 'delete'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Policy for audit log access
CREATE POLICY "audit_log_admin_access" ON sensitive_data_access_log
  FOR ALL USING (
    get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
    auth.role() = 'service_role'
  );

-- Function to log sensitive data access
CREATE OR REPLACE FUNCTION log_sensitive_access(
  table_name_param TEXT,
  record_id_param TEXT,
  access_type_param TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO sensitive_data_access_log (
    user_id, table_name, record_id, access_type
  ) VALUES (
    auth.uid(), table_name_param, record_id_param, access_type_param
  );
END;
$$;