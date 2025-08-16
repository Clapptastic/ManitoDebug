-- Create missing database functions for Phase 1.2

-- 1. Create log_analysis_step function for comprehensive audit logging
CREATE OR REPLACE FUNCTION public.log_analysis_step(
  step_name TEXT,
  step_data JSONB DEFAULT '{}',
  user_id_param UUID DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL,
  step_status TEXT DEFAULT 'completed',
  error_message_param TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Use provided user_id or get current authenticated user
  IF user_id_param IS NULL THEN
    user_id_param := auth.uid();
  END IF;
  
  -- Insert comprehensive analysis step log
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    session_id,
    new_values,
    metadata
  ) VALUES (
    user_id_param,
    step_name,
    'analysis_step',
    session_id_param,
    session_id_param,
    jsonb_build_object(
      'status', step_status,
      'step_data', step_data,
      'error_message', error_message_param,
      'timestamp', NOW()
    ),
    jsonb_build_object(
      'function', 'log_analysis_step',
      'version', '1.0'
    )
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 2. Create is_super_admin_user function for enhanced admin checks
CREATE OR REPLACE FUNCTION public.is_super_admin_user(user_id_param UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_email TEXT;
    user_id_to_check UUID;
BEGIN
    -- Use provided user_id or get current authenticated user
    user_id_to_check := COALESCE(user_id_param, auth.uid());
    
    -- Return false if no user provided
    IF user_id_to_check IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user email from auth.users
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = user_id_to_check;
    
    -- Check if email is in super admin list
    IF user_email IN ('akclapp@gmail.com', 'samdyer27@gmail.com') THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has super_admin role in user_roles table
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_id_to_check 
          AND role = 'super_admin' 
          AND is_active = TRUE 
          AND (expires_at IS NULL OR expires_at > NOW())
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 3. Create match_code_embeddings function for semantic code search
-- Note: This function checks for vector extension availability
CREATE OR REPLACE FUNCTION public.match_code_embeddings(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id_param UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  file_path TEXT,
  content TEXT,
  language TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or get current authenticated user
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Return empty if no user
  IF target_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Check if pgvector extension is available
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    -- If no vector extension, return empty results
    RETURN;
  END IF;
  
  -- Perform vector similarity search
  RETURN QUERY
  SELECT 
    ce.id,
    ce.file_path,
    ce.content,
    ce.language,
    1 - (ce.embedding <-> query_embedding) as similarity
  FROM public.code_embeddings ce
  WHERE ce.user_id = target_user_id
    AND ce.embedding IS NOT NULL
    AND 1 - (ce.embedding <-> query_embedding) > similarity_threshold
  ORDER BY ce.embedding <-> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Create enhanced get_user_permissions function for fine-grained access control
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  permission TEXT,
  resource_type TEXT,
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or get current authenticated user
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Return empty if no user
  IF target_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return user permissions from admin_permissions table
  RETURN QUERY
  SELECT 
    ap.permission,
    'admin'::TEXT as resource_type,
    ap.granted_at,
    ap.expires_at
  FROM public.admin_permissions ap
  WHERE ap.user_id = target_user_id
    AND (ap.expires_at IS NULL OR ap.expires_at > NOW());
  
END;
$$;

-- 5. Create bulk_update_api_key_status function for batch operations
CREATE OR REPLACE FUNCTION public.bulk_update_api_key_status(
  status_updates JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  update_record RECORD;
  updated_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Verify user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Process each update in the JSON array
  FOR update_record IN 
    SELECT * FROM jsonb_array_elements(status_updates) AS elem
  LOOP
    -- Update API key status
    UPDATE public.api_keys 
    SET 
      status = (update_record.value->>'status')::TEXT,
      error_message = update_record.value->>'error_message',
      last_validated = NOW(),
      updated_at = NOW()
    WHERE id = (update_record.value->>'id')::UUID
      AND user_id = current_user_id;
    
    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  -- Return results
  result := jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;