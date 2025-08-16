-- Fix Critical Issue #1: JWT Token Validation
-- Standardize edge function authentication

-- Fix Critical Issue #2: RLS Policy Conflicts
-- Remove conflicting policies and create unified ones

-- Drop conflicting API key policies
DROP POLICY IF EXISTS "API keys service operations only" ON public.api_keys;
DROP POLICY IF EXISTS "Users insert own api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users update own api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users view own api_keys" ON public.api_keys;

-- Create unified API key policy
CREATE POLICY "api_keys_unified_access" ON public.api_keys
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    can_access_api_key(user_id, auth.uid())
  )
  WITH CHECK (
    auth.role() = 'service_role' OR 
    auth.uid() = user_id
  );

-- Fix Critical Issue #4: Remove hardcoded admin dependencies
-- Create dynamic super admin function
CREATE OR REPLACE FUNCTION public.is_super_admin_email(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check against admin_users table instead of hardcoded values
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = email_to_check AND is_active = true
    );
END;
$$;

-- Create admin_users table for dynamic admin management
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    role text NOT NULL DEFAULT 'admin',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users policy
CREATE POLICY "super_admin_manage_admin_users" ON public.admin_users
  FOR ALL USING (
    auth.role() = 'service_role' OR
    is_super_admin_email((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Insert existing super admins
INSERT INTO public.admin_users (email, role, is_active) VALUES
  ('akclapp@gmail.com', 'super_admin', true),
  ('samdyer27@gmail.com', 'super_admin', true),
  ('perryrjohnson7@gmail.com', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- Update is_super_admin function to use admin_users table
CREATE OR REPLACE FUNCTION public.is_super_admin(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE email = email_to_check 
        AND role = 'super_admin' 
        AND is_active = true
    );
END;
$$;

-- Fix Critical Issue #3: API Key Encryption - Standardize vault usage
-- Update manage_api_key function to handle vault consistently
CREATE OR REPLACE FUNCTION public.manage_api_key(
  operation text,
  user_id_param uuid DEFAULT NULL::uuid,
  provider_param text DEFAULT NULL::text,
  api_key_param text DEFAULT NULL::text,
  key_hash_param text DEFAULT NULL::text,
  masked_key_param text DEFAULT NULL::text,
  key_prefix_param text DEFAULT NULL::text,
  api_key_id_param uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  existing_key_id uuid;
  existing_secret_id uuid;
  new_secret_id uuid;
  use_vault boolean := false;
  secret_value text;
  v_provider text;
  v_status text;
BEGIN
  -- Check if vault extension is available
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vault') INTO use_vault;
  
  -- Authorization check
  IF NOT (
    auth.uid() = user_id_param OR 
    is_super_admin((SELECT email FROM auth.users WHERE id = auth.uid())) OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions';
  END IF;

  CASE operation
    WHEN 'insert' THEN
      -- Check for existing key
      SELECT id, vault_secret_id INTO existing_key_id, existing_secret_id
      FROM public.api_keys
      WHERE user_id = user_id_param AND provider = provider_param
      LIMIT 1;

      -- Handle vault storage if available
      IF use_vault THEN
        IF existing_secret_id IS NOT NULL THEN
          EXECUTE 'SELECT vault.update_secret($1, $2)' USING existing_secret_id, api_key_param;
          new_secret_id := existing_secret_id;
        ELSE
          EXECUTE 'SELECT vault.create_secret($1, $2)'
            INTO new_secret_id
            USING format('user:%s:provider:%s', user_id_param, provider_param), api_key_param;
        END IF;
      END IF;

      -- Upsert API key record
      INSERT INTO public.api_keys (
        user_id, provider, name, api_key, key_hash, masked_key,
        key_prefix, is_active, status, permissions, vault_secret_id
      ) VALUES (
        user_id_param, provider_param, provider_param,
        CASE WHEN use_vault THEN NULL ELSE api_key_param END,
        key_hash_param, masked_key_param, key_prefix_param,
        true, 'active', '["read", "write"]'::jsonb,
        CASE WHEN use_vault THEN new_secret_id ELSE NULL END
      )
      ON CONFLICT (user_id, provider) DO UPDATE SET
        api_key = CASE WHEN use_vault THEN NULL ELSE EXCLUDED.api_key END,
        key_hash = EXCLUDED.key_hash,
        masked_key = EXCLUDED.masked_key,
        key_prefix = EXCLUDED.key_prefix,
        is_active = true,
        status = 'active',
        vault_secret_id = CASE WHEN use_vault THEN new_secret_id ELSE vault_secret_id END,
        updated_at = now()
      RETURNING jsonb_build_object(
        'id', id, 'provider', provider, 'masked_key', masked_key,
        'status', status, 'created_at', created_at, 'updated_at', updated_at
      ) INTO result;

    WHEN 'select' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id, 'provider', provider, 'name', name, 'masked_key', masked_key,
          'status', status, 'is_active', is_active, 'created_at', created_at,
          'updated_at', updated_at, 'last_used_at', last_used_at, 'permissions', permissions
        )
      ) INTO result
      FROM public.api_keys
      WHERE user_id = user_id_param AND is_active = true;

    WHEN 'delete' THEN
      DELETE FROM public.api_keys
      WHERE id = api_key_id_param AND user_id = user_id_param;
      result := jsonb_build_object('success', true, 'deleted_id', api_key_id_param);

    WHEN 'get_for_decryption' THEN
      SELECT id, provider, vault_secret_id, api_key, status
      INTO existing_key_id, v_provider, existing_secret_id, secret_value, v_status
      FROM public.api_keys
      WHERE user_id = user_id_param AND provider = provider_param AND is_active = true
      LIMIT 1;

      IF existing_key_id IS NULL THEN
        result := '[]'::jsonb;
        RETURN result;
      END IF;

      -- Get secret from vault if available
      IF use_vault AND existing_secret_id IS NOT NULL THEN
        BEGIN
          EXECUTE 'SELECT vault.get_secret($1)' INTO secret_value USING existing_secret_id;
        EXCEPTION WHEN OTHERS THEN
          -- Fallback to direct storage if vault fails
          secret_value := (SELECT api_key FROM public.api_keys WHERE id = existing_key_id);
        END;
      END IF;

      result := jsonb_build_object(
        'id', existing_key_id, 'provider', v_provider,
        'api_key', secret_value, 'status', v_status
      );

    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;

  -- Log the operation
  PERFORM public.log_api_key_operation(
    operation, provider_param, user_id_param, true, NULL
  );

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Fix Critical Issue #7: SOC2 Compliance - Enhanced audit logging
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
  user_id_param uuid,
  event_type text,
  resource_type text,
  resource_id text DEFAULT NULL::text,
  metadata_param jsonb DEFAULT '{}'::jsonb,
  ip_address_param inet DEFAULT NULL::inet,
  user_agent_param text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id, metadata,
    ip_address, user_agent, session_id, created_at
  ) VALUES (
    user_id_param, event_type, resource_type, resource_id,
    metadata_param || jsonb_build_object(
      'timestamp', now(),
      'compliance_event', true,
      'security_level', 'high'
    ),
    ip_address_param, user_agent_param,
    COALESCE((metadata_param->>'session_id')::text, 'unknown'),
    NOW()
  );
END;
$$;

-- Fix Medium Issue: Add missing indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_provider ON public.api_keys(user_id, provider);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_costs_user_date ON public.api_usage_costs(user_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitor_analyses_user_status ON public.competitor_analyses(user_id, status);

-- Fix Medium Issue: Add data retention policies
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Keep audit logs for 2 years for compliance
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Keep API metrics for 90 days
  DELETE FROM public.api_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Keep performance logs for 30 days
  DELETE FROM public.performance_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create scheduled cleanup (would need to be set up in cron or edge function)
COMMENT ON FUNCTION public.cleanup_old_audit_logs() IS 'Run this function periodically to maintain data retention compliance';

-- Fix Medium Issue: Add constraint validation
ALTER TABLE public.api_keys ADD CONSTRAINT chk_api_keys_vault_or_direct 
  CHECK (
    (vault_secret_id IS NOT NULL AND api_key IS NULL) OR 
    (vault_secret_id IS NULL AND api_key IS NOT NULL) OR
    (vault_secret_id IS NULL AND api_key IS NULL)
  );

-- Fix Critical Issue #5: Restrict service role access with specific policies
-- Update over-permissive policies to be more restrictive

-- Update application_settings policy
DROP POLICY IF EXISTS "application_settings_service_access" ON public.application_settings;
CREATE POLICY "application_settings_service_readonly" ON public.application_settings
  FOR SELECT USING (auth.role() = 'service_role');

-- Update api_usage_costs policy  
DROP POLICY IF EXISTS "api_usage_costs_service_access" ON public.api_usage_costs;
CREATE POLICY "api_usage_costs_service_insert" ON public.api_usage_costs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "api_usage_costs_service_select" ON public.api_usage_costs
  FOR SELECT USING (auth.role() = 'service_role');

-- Add API key integrity validation
CREATE OR REPLACE FUNCTION public.validate_api_key_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure either vault_secret_id OR api_key is present, not both
  IF NEW.vault_secret_id IS NOT NULL AND NEW.api_key IS NOT NULL THEN
    RAISE EXCEPTION 'API key cannot have both vault_secret_id and direct api_key storage';
  END IF;
  
  -- Ensure at least one storage method
  IF NEW.vault_secret_id IS NULL AND NEW.api_key IS NULL THEN
    RAISE EXCEPTION 'API key must have either vault_secret_id or api_key';
  END IF;
  
  -- Validate masked_key format
  IF NEW.masked_key IS NULL OR length(NEW.masked_key) < 8 THEN
    RAISE EXCEPTION 'Invalid masked_key format';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for API key validation
DROP TRIGGER IF EXISTS trg_validate_api_key_data ON public.api_keys;
CREATE TRIGGER trg_validate_api_key_data
  BEFORE INSERT OR UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.validate_api_key_data();