-- Create the missing match_code_embeddings function
CREATE OR REPLACE FUNCTION public.match_code_embeddings(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id uuid,
  file_path text,
  content text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.file_path,
    ce.content,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM code_embeddings ce
  WHERE
    ce.deleted_at IS NULL AND
    ce.user_id = p_user_id AND
    1 - (ce.embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Create the missing log_analysis_step function for debugging
CREATE OR REPLACE FUNCTION public.log_analysis_step(
  analysis_id_param uuid,
  step_name_param text,
  step_status_param text,
  step_details_param jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    resource_type,
    resource_id,
    action,
    metadata,
    user_id
  ) VALUES (
    'competitor_analysis',
    analysis_id_param::text,
    step_name_param || '_' || step_status_param,
    jsonb_build_object(
      'step_name', step_name_param,
      'step_status', step_status_param,
      'step_details', step_details_param
    ),
    auth.uid()
  );
END;
$$;

-- Create the missing is_super_admin_user function (referenced in microservices)
CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Check if user is super admin
  RETURN public.is_super_admin(user_email);
END;
$$;