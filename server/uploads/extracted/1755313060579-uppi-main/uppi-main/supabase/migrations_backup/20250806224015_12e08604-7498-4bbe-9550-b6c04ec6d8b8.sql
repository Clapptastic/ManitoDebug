-- Create a secure RPC function to get competitor analyses
CREATE OR REPLACE FUNCTION get_user_competitor_analyses(user_id_param uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  name text,
  website_url text,
  industry text,
  description text,
  employee_count integer,
  founded_year integer,
  headquarters text,
  business_model text,
  target_market text[],
  strengths text[],
  weaknesses text[],
  opportunities text[],
  threats text[],
  pricing_strategy jsonb,
  funding_info jsonb,
  social_media_presence jsonb,
  market_position text,
  analysis_data jsonb,
  status text,
  user_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  completed_at timestamp with time zone,
  data_quality_score numeric,
  data_completeness_score numeric,
  market_sentiment_score numeric,
  actual_cost numeric,
  analysis_id uuid,
  session_id text,
  organization_id uuid,
  website_verified boolean,
  employee_count_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the target user ID (either from parameter or current auth user)
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Verify user is authenticated and has access
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify user can only access their own data unless they're super admin
  IF target_user_id != auth.uid() AND NOT (
    (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    ca.id,
    ca.name,
    ca.website_url,
    ca.industry,
    ca.description,
    ca.employee_count,
    ca.founded_year,
    ca.headquarters,
    ca.business_model,
    ca.target_market,
    ca.strengths,
    ca.weaknesses,
    ca.opportunities,
    ca.threats,
    ca.pricing_strategy,
    ca.funding_info,
    ca.social_media_presence,
    ca.market_position,
    ca.analysis_data,
    ca.status,
    ca.user_id,
    ca.created_at,
    ca.updated_at,
    ca.completed_at,
    ca.data_quality_score,
    ca.data_completeness_score,
    ca.market_sentiment_score,
    ca.actual_cost,
    ca.analysis_id,
    ca.session_id,
    ca.organization_id,
    ca.website_verified,
    ca.employee_count_verified
  FROM competitor_analyses ca
  WHERE ca.user_id = target_user_id
  ORDER BY ca.created_at DESC;
END;
$$;

-- Create a function to get competitor analysis progress
CREATE OR REPLACE FUNCTION get_competitor_analysis_progress(session_id_param text, user_id_param uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  session_id text,
  user_id uuid,
  status text,
  progress_percentage numeric,
  total_competitors integer,
  completed_competitors integer,
  current_competitor text,
  error_message text,
  metadata jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the target user ID (either from parameter or current auth user)
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Verify user is authenticated
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    cap.id,
    cap.session_id,
    cap.user_id,
    cap.status,
    cap.progress_percentage,
    cap.total_competitors,
    cap.completed_competitors,
    cap.current_competitor,
    cap.error_message,
    cap.metadata,
    cap.created_at,
    cap.updated_at
  FROM competitor_analysis_progress cap
  WHERE cap.session_id = session_id_param 
    AND cap.user_id = target_user_id;
END;
$$;

-- Create a function to insert competitor analysis progress
CREATE OR REPLACE FUNCTION insert_competitor_analysis_progress(
  session_id_param text,
  user_id_param uuid,
  total_competitors_param integer,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Verify user is authenticated and matches the user_id parameter
  IF auth.uid() != user_id_param AND NOT (
    (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3' OR
    get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']) OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  INSERT INTO competitor_analysis_progress (
    session_id,
    user_id,
    status,
    total_competitors,
    completed_competitors,
    progress_percentage,
    metadata
  ) VALUES (
    session_id_param,
    user_id_param,
    'pending',
    total_competitors_param,
    0,
    0,
    metadata_param
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Create a function to update competitor analysis progress
CREATE OR REPLACE FUNCTION update_competitor_analysis_progress(
  session_id_param text,
  status_param text DEFAULT NULL,
  progress_percentage_param numeric DEFAULT NULL,
  completed_competitors_param integer DEFAULT NULL,
  current_competitor_param text DEFAULT NULL,
  error_message_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify user has access to this session
  IF NOT EXISTS (
    SELECT 1 FROM competitor_analysis_progress 
    WHERE session_id = session_id_param 
      AND (user_id = auth.uid() OR auth.role() = 'service_role' OR 
           (auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3')
  ) THEN
    RAISE EXCEPTION 'Access denied or session not found';
  END IF;
  
  UPDATE competitor_analysis_progress
  SET 
    status = COALESCE(status_param, status),
    progress_percentage = COALESCE(progress_percentage_param, progress_percentage),
    completed_competitors = COALESCE(completed_competitors_param, completed_competitors),
    current_competitor = COALESCE(current_competitor_param, current_competitor),
    error_message = COALESCE(error_message_param, error_message),
    metadata = COALESCE(metadata_param, metadata),
    updated_at = now()
  WHERE session_id = session_id_param;
  
  RETURN FOUND;
END;
$$;