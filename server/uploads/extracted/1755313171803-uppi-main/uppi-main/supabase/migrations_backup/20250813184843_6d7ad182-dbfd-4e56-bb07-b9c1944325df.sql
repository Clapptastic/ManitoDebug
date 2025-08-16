-- Fix the get_tables function to have proper search_path
CREATE OR REPLACE FUNCTION public.get_tables(schema_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  tables_json jsonb;
BEGIN
  WITH tables_data AS (
    SELECT 
      t.table_name as name,
      schema_name as schema,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable = 'YES',
            'default_value', c.column_default
          )
          ORDER BY c.ordinal_position
        )
        FROM information_schema.columns c
        WHERE c.table_schema = schema_name AND c.table_name = t.table_name
      ) as columns,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', tc.constraint_name,
            'type', 
              CASE tc.constraint_type
                WHEN 'PRIMARY KEY' THEN 'primary_key'
                WHEN 'FOREIGN KEY' THEN 'foreign_key'
                WHEN 'UNIQUE' THEN 'unique'
                WHEN 'CHECK' THEN 'check'
                ELSE lower(tc.constraint_type)
              END,
            'definition', pg_get_constraintdef(pgc.oid)
          )
        )
        FROM information_schema.table_constraints tc
        JOIN pg_constraint pgc ON tc.constraint_name = pgc.conname
        WHERE tc.table_schema = schema_name AND tc.table_name = t.table_name
      ) as constraints,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', indexname,
            'definition', indexdef
          )
        )
        FROM pg_indexes
        WHERE schemaname = schema_name AND tablename = t.table_name
      ) as indexes,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', p.polname,
            'action', 
              CASE p.polcmd
                WHEN 'r' THEN 'SELECT'
                WHEN 'a' THEN 'INSERT'
                WHEN 'w' THEN 'UPDATE'
                WHEN 'd' THEN 'DELETE'
                WHEN '*' THEN 'ALL'
              END
          )
        )
        FROM pg_policy p
        JOIN pg_class c ON p.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = schema_name AND c.relname = t.table_name
      ) as policies
    FROM information_schema.tables t
    WHERE t.table_schema = schema_name
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', name,
      'schema', schema,
      'columns', COALESCE(columns, '[]'::jsonb),
      'constraints', COALESCE(constraints, '[]'::jsonb),
      'indexes', COALESCE(indexes, '[]'::jsonb),
      'policies', COALESCE(policies, '[]'::jsonb)
    )
  )
  INTO tables_json
  FROM tables_data;

  RETURN jsonb_build_object('tables', COALESCE(tables_json, '[]'::jsonb));
END;
$function$;