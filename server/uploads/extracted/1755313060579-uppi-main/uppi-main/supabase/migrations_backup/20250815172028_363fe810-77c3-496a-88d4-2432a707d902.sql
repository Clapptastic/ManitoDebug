-- Fix security issues and consolidate API key management

-- 1. Fix RLS policies for profiles table (consolidate conflicting policies)
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create single, secure profile policy
CREATE POLICY "users_can_only_access_own_profile" 
ON profiles FOR ALL 
USING (auth.uid() = user_id);

-- 2. Fix API keys table security (ensure user isolation)
DROP POLICY IF EXISTS "api_keys_policy" ON api_keys;
DROP POLICY IF EXISTS "secure_api_key_access" ON api_keys;

-- Secure API key access - users can only access their own keys
CREATE POLICY "users_own_api_keys_only" 
ON api_keys FOR ALL 
USING (auth.uid() = user_id);

-- 3. Fix competitor analyses security
DROP POLICY IF EXISTS "competitor_analyses_policy" ON competitor_analyses;
DROP POLICY IF EXISTS "org_member_access" ON competitor_analyses;

-- Simple user-only access for competitor analyses
CREATE POLICY "users_own_analyses_only" 
ON competitor_analyses FOR ALL 
USING (auth.uid() = user_id);

-- 4. Create user_api_keys table if not exists (unified approach)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  masked_key TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Reference to vault secret
  status TEXT NOT NULL DEFAULT 'active',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_validated TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS on user_api_keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Secure policy for user_api_keys
CREATE POLICY "users_own_api_keys_secure" 
ON user_api_keys FOR ALL 
USING (auth.uid() = user_id);

-- 5. Add updated_at trigger
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Fix function search paths (security warnings)
CREATE OR REPLACE FUNCTION vault_store_secret(secret_name text, secret_value text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    secret_id uuid;
BEGIN
    INSERT INTO vault.secrets (name, secret, key_id)
    VALUES (secret_name, secret_value, vault.create_key())
    RETURNING id INTO secret_id;
    
    RETURN secret_id;
END;
$$;

CREATE OR REPLACE FUNCTION vault_delete_secret(secret_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    DELETE FROM vault.secrets WHERE name = secret_name;
    RETURN FOUND;
END;
$$;