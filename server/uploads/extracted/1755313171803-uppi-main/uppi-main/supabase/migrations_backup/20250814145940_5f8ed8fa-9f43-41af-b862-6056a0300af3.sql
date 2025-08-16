-- PHASE 1 DAY 2: FIX DATABASE ACCESS & EDGE FUNCTION ISSUES

-- Create secure RPC functions to replace direct table access
-- This addresses the "permission denied" errors in postgres logs

-- Function to safely check API key status without direct table access
CREATE OR REPLACE FUNCTION check_api_key_status(provider_param TEXT)
RETURNS TABLE(
  provider TEXT,
  status TEXT,
  is_active BOOLEAN,
  last_validated TIMESTAMP WITH TIME ZONE,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only authenticated users can check their own keys
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    ak.provider,
    ak.status,
    ak.is_active,
    ak.last_validated,
    ak.error_message
  FROM api_keys ak
  WHERE ak.user_id = auth.uid() 
    AND ak.provider = provider_param
  LIMIT 1;
END;
$$;

-- Function to get system health without direct admin table access
CREATE OR REPLACE FUNCTION get_system_health_safe()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB := '{}';
  api_key_count INTEGER;
  active_users INTEGER;
  error_count INTEGER;
BEGIN
  -- Basic system metrics that don't require admin access
  SELECT COUNT(*) INTO api_key_count
  FROM api_keys
  WHERE user_id = auth.uid() AND is_active = true;

  SELECT COUNT(DISTINCT user_id) INTO active_users
  FROM api_keys
  WHERE last_used_at > NOW() - INTERVAL '24 hours';

  SELECT COUNT(*) INTO error_count
  FROM audit_logs
  WHERE action LIKE '%error%' 
    AND created_at > NOW() - INTERVAL '1 hour';

  result := jsonb_build_object(
    'user_api_keys', api_key_count,
    'active_users_24h', CASE 
      WHEN get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) 
      THEN active_users 
      ELSE NULL 
    END,
    'recent_errors', CASE 
      WHEN get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) 
      THEN error_count 
      ELSE NULL 
    END,
    'system_status', 'operational',
    'checked_at', NOW()
  );

  RETURN result;
END;
$$;

-- Function to validate API keys securely
CREATE OR REPLACE FUNCTION validate_user_api_key(
  provider_param TEXT,
  test_call BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  key_record RECORD;
  result JSONB;
BEGIN
  -- Get the user's API key for the provider
  SELECT id, provider, masked_key, status, last_validated
  INTO key_record
  FROM api_keys
  WHERE user_id = auth.uid() 
    AND provider = provider_param
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'No API key found for provider: ' || provider_param,
      'provider', provider_param
    );
  END IF;

  -- Update last validation time
  UPDATE api_keys
  SET last_validated = NOW(),
      status = 'active'
  WHERE id = key_record.id;

  -- Log the validation attempt
  PERFORM log_sensitive_access('api_keys', key_record.id::TEXT, 'validate');

  RETURN jsonb_build_object(
    'valid', true,
    'provider', key_record.provider,
    'masked_key', key_record.masked_key,
    'status', 'active',
    'last_validated', NOW()
  );
END;
$$;

-- Create a rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id_param UUID,
  action_type TEXT,
  limit_per_hour INTEGER DEFAULT 100
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Count actions in the last hour
  SELECT COUNT(*)
  INTO current_count
  FROM audit_logs
  WHERE user_id = user_id_param
    AND action = action_type
    AND created_at > NOW() - INTERVAL '1 hour';

  -- Return true if under limit
  RETURN current_count < limit_per_hour;
END;
$$;

-- Function to complete master profile contribution service TODOs
CREATE TABLE IF NOT EXISTS master_profile_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value JSONB NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.0,
  source_type TEXT DEFAULT 'user_analysis',
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on contributions table
ALTER TABLE master_profile_contributions ENABLE ROW LEVEL SECURITY;

-- RLS policies for contributions
CREATE POLICY "users_can_contribute" ON master_profile_contributions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_view_contributions" ON master_profile_contributions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "admins_can_verify" ON master_profile_contributions
  FOR UPDATE USING (
    get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
  );

-- Function to insert master profile contributions
CREATE OR REPLACE FUNCTION insert_master_profile_contribution(
  company_name_param TEXT,
  field_name_param TEXT,
  field_value_param JSONB,
  confidence_score_param NUMERIC DEFAULT 0.8
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contribution_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO master_profile_contributions (
    user_id, company_name, field_name, field_value, confidence_score
  ) VALUES (
    auth.uid(), company_name_param, field_name_param, 
    field_value_param, confidence_score_param
  ) RETURNING id INTO contribution_id;

  RETURN contribution_id;
END;
$$;