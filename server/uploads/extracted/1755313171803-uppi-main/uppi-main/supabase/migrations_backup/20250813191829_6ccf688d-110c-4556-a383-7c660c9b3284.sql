-- Create remaining optimization functions and indexes for flow management

-- 3. Create optimized flow assignment function
CREATE OR REPLACE FUNCTION public.assign_prompt_to_flow(
  prompt_id_param uuid,
  flow_id_param uuid,
  is_active_param boolean DEFAULT true,
  priority_param integer DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has permission
  IF NOT (
    auth.uid() = ANY(ARRAY['5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::uuid]) OR
    get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']) OR
    auth.role() = 'service_role'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Insert or update prompt flow assignment
  INSERT INTO prompt_flows (
    prompt_id, 
    flow_id, 
    is_active_in_flow, 
    priority, 
    assigned_by,
    assigned_at
  ) VALUES (
    prompt_id_param,
    flow_id_param,
    is_active_param,
    priority_param,
    auth.uid(),
    now()
  )
  ON CONFLICT (prompt_id, flow_id) 
  DO UPDATE SET
    is_active_in_flow = EXCLUDED.is_active_in_flow,
    priority = EXCLUDED.priority,
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = EXCLUDED.assigned_at;

  RETURN true;
END;
$function$;

-- 4. Create performance indexes for optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_flows_prompt_id ON prompt_flows(prompt_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_flows_flow_id ON prompt_flows(flow_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompt_flows_active ON prompt_flows(is_active_in_flow);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flow_definitions_category ON flow_definitions(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flow_definitions_active ON flow_definitions(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prompts_domain_provider ON prompts(domain, provider);

-- 5. Create flow health monitoring function
CREATE OR REPLACE FUNCTION public.get_flow_health_metrics()
RETURNS TABLE(
  flow_id uuid,
  flow_name text,
  flow_category text,
  total_prompts integer,
  active_prompts integer,
  inactive_prompts integer,
  health_score numeric,
  last_activity timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    fd.id as flow_id,
    fd.name as flow_name,
    fd.category as flow_category,
    COUNT(pf.prompt_id)::integer as total_prompts,
    COUNT(CASE WHEN pf.is_active_in_flow THEN 1 END)::integer as active_prompts,
    COUNT(CASE WHEN NOT pf.is_active_in_flow THEN 1 END)::integer as inactive_prompts,
    CASE 
      WHEN COUNT(pf.prompt_id) = 0 THEN 0
      ELSE (COUNT(CASE WHEN pf.is_active_in_flow THEN 1 END)::numeric / COUNT(pf.prompt_id)::numeric * 100)
    END as health_score,
    MAX(pf.assigned_at) as last_activity
  FROM flow_definitions fd
  LEFT JOIN prompt_flows pf ON fd.id = pf.flow_id
  WHERE fd.is_active = true
  GROUP BY fd.id, fd.name, fd.category
  ORDER BY health_score DESC, fd.name;
END;
$function$;