-- Fix remaining function search path security warnings
-- This addresses the final 2-3 function search path issues

-- Find and fix any remaining functions without proper search_path
DO $$
DECLARE
  func_record RECORD;
  func_definition TEXT;
  new_definition TEXT;
BEGIN
  -- Get functions that might need search_path fixes
  FOR func_record IN 
    SELECT routine_name, routine_schema
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      AND routine_name IN (
        'log_application_error', 
        'create_analysis_session',
        'validate_user_api_key',
        'handle_new_user'
      )
  LOOP
    -- Log which function we're checking
    RAISE NOTICE 'Checking function: %', func_record.routine_name;
  END LOOP;
END
$$;

-- Fix specific functions that commonly lack search_path

-- Fix log_application_error function if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'log_application_error') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.log_application_error(
      error_type text, 
      error_message text, 
      metadata_param jsonb DEFAULT ''{}''::jsonb
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO ''public''
    AS $func$
    BEGIN
      INSERT INTO audit_logs (user_id, action, resource_type, metadata)
      VALUES (
        auth.uid(),
        ''application_error'',
        error_type,
        metadata_param || jsonb_build_object(
          ''error_message'', error_message,
          ''timestamp'', now()
        )
      );
    END;
    $func$';
  END IF;
END
$$;

-- Fix create_analysis_session function if it exists  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_analysis_session') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.create_analysis_session(
      session_id text,
      user_id_param uuid
    )
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO ''public''
    AS $func$
    DECLARE
      new_id uuid;
    BEGIN
      INSERT INTO analysis_runs (id, user_id, session_id, status, run_type)
      VALUES (gen_random_uuid(), user_id_param, session_id, ''pending'', ''competitor_analysis'')
      RETURNING id INTO new_id;
      RETURN new_id;
    END;
    $func$';
  END IF;
END
$$;

-- Fix validate_user_api_key function if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'validate_user_api_key') THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.validate_user_api_key(
      user_id_param uuid,
      provider_param text
    )
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO ''public''
    AS $func$
    DECLARE
      key_record RECORD;
    BEGIN
      SELECT id, masked_key, status INTO key_record
      FROM api_keys
      WHERE user_id = user_id_param AND provider = provider_param AND is_active = true;
      
      IF FOUND THEN
        RETURN jsonb_build_object(
          ''valid'', true,
          ''provider'', provider_param,
          ''masked_key'', key_record.masked_key
        );
      ELSE
        RETURN jsonb_build_object(
          ''valid'', false,
          ''provider'', provider_param,
          ''error'', ''API key not found or inactive''
        );
      END IF;
    END;
    $func$';
  END IF;
END
$$;

-- Create a comprehensive security audit function
CREATE OR REPLACE FUNCTION public.run_security_audit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audit_result jsonb := '{}'::jsonb;
  policy_count integer;
  function_count integer;
BEGIN
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  -- Count secure functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_definition LIKE '%SET search_path%';
  
  audit_result := jsonb_build_object(
    'timestamp', now(),
    'total_rls_policies', policy_count,
    'secure_functions', function_count,
    'audit_status', 'completed'
  );
  
  -- Log the audit
  INSERT INTO audit_logs (action, resource_type, metadata)
  VALUES (
    'security_audit_completed',
    'database_security',
    audit_result
  );
  
  RETURN audit_result;
END;
$$;