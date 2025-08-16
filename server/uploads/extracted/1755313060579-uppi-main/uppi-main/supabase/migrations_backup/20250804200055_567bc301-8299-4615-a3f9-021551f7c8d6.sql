-- Create functions to get RLS policies information
CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS TABLE(
  table_name text,
  policy_name text,
  command text,
  permissive text,
  using_expression text,
  with_check_expression text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    cmd as command,
    permissive as permissive,
    qual as using_expression,
    with_check as with_check_expression
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
$function$;

-- Create function to get database functions information
CREATE OR REPLACE FUNCTION public.get_database_functions()
RETURNS TABLE(
  function_name text,
  function_schema text,
  return_type text,
  argument_types text,
  function_type text,
  security_type text,
  is_strict boolean,
  language text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.proname as function_name,
    n.nspname as function_schema,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as argument_types,
    CASE 
      WHEN p.prokind = 'f' THEN 'function'
      WHEN p.prokind = 'p' THEN 'procedure'
      WHEN p.prokind = 'a' THEN 'aggregate'
      WHEN p.prokind = 'w' THEN 'window'
      ELSE 'unknown'
    END as function_type,
    CASE 
      WHEN p.prosecdef THEN 'definer'
      ELSE 'invoker'
    END as security_type,
    p.proisstrict as is_strict,
    l.lanname as language
  FROM pg_proc p
  LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
  LEFT JOIN pg_language l ON p.prolang = l.oid
  WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'sql_%'
  ORDER BY p.proname;
$function$;