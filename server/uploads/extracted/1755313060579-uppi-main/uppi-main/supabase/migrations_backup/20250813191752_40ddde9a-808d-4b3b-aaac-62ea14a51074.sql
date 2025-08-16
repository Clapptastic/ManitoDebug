-- Complete the prompt flow management plan by creating necessary database functions and triggers

-- 1. Create comprehensive flow status tracking function
CREATE OR REPLACE FUNCTION public.get_prompt_flow_status(prompt_id_param uuid)
RETURNS TABLE(
  status text,
  total_assignments integer,
  active_assignments integer,
  flows jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  flow_data jsonb;
  total_count integer := 0;
  active_count integer := 0;
  status_result text;
BEGIN
  -- Get flow assignments
  SELECT 
    COUNT(*)::integer,
    COUNT(CASE WHEN pf.is_active_in_flow THEN 1 END)::integer,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'flow_id', fd.id,
        'flow_name', fd.name,
        'flow_category', fd.category,
        'is_active_in_flow', pf.is_active_in_flow,
        'assigned_at', pf.assigned_at,
        'priority', pf.priority
      )
    ), '[]'::jsonb)
  INTO total_count, active_count, flow_data
  FROM prompt_flows pf
  JOIN flow_definitions fd ON pf.flow_id = fd.id
  WHERE pf.prompt_id = prompt_id_param;

  -- Determine status
  IF total_count = 0 THEN
    status_result := 'unassigned';
  ELSIF active_count = total_count THEN
    status_result := 'active';
  ELSIF active_count = 0 THEN
    status_result := 'inactive';
  ELSE
    status_result := 'partial';
  END IF;

  RETURN QUERY SELECT 
    status_result,
    total_count,
    active_count,
    flow_data;
END;
$function$;

-- 2. Create function to get flow-aware prompts
CREATE OR REPLACE FUNCTION public.get_prompts_with_flow_status()
RETURNS TABLE(
  id uuid,
  key text,
  provider text,
  domain text,
  description text,
  is_active boolean,
  total_flow_assignments integer,
  active_flow_assignments integer,
  created_at timestamptz,
  updated_at timestamptz,
  flow_status jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.key,
    p.provider,
    p.domain,
    p.description,
    p.is_active,
    COALESCE(p.total_flow_assignments, 0),
    COALESCE(p.active_flow_assignments, 0),
    p.created_at,
    p.updated_at,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'flow_id', fd.id,
          'flow_name', fd.name,
          'flow_category', fd.category,
          'is_active_in_flow', pf.is_active_in_flow,
          'assigned_at', pf.assigned_at,
          'priority', pf.priority
        )
      )
      FROM prompt_flows pf
      JOIN flow_definitions fd ON pf.flow_id = fd.id
      WHERE pf.prompt_id = p.id),
      '[]'::jsonb
    ) as flow_status
  FROM prompts p
  ORDER BY p.updated_at DESC;
END;
$function$;