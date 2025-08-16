
-- Function to get table constraints for schema browser
CREATE OR REPLACE FUNCTION public.get_table_constraints(p_schema text, p_table text)
RETURNS TABLE (
  name text,
  type text,
  definition text,
  columns text[],
  references_table text,
  references_columns text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH constraint_info AS (
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      pg_get_constraintdef(pgc.oid) AS constraint_definition
    FROM
      information_schema.table_constraints tc
      JOIN pg_constraint pgc ON tc.constraint_name = pgc.conname
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    WHERE
      tc.table_schema = p_schema
      AND tc.table_name = p_table
  )
  SELECT
    constraint_name,
    CASE constraint_type
      WHEN 'PRIMARY KEY' THEN 'primary_key'
      WHEN 'FOREIGN KEY' THEN 'foreign_key'
      WHEN 'UNIQUE' THEN 'unique'
      WHEN 'CHECK' THEN 'check'
      ELSE lower(constraint_type)
    END,
    constraint_definition,
    array_agg(DISTINCT column_name) FILTER (WHERE column_name IS NOT NULL),
    MIN(foreign_table_name),
    array_agg(DISTINCT foreign_column_name) FILTER (WHERE foreign_column_name IS NOT NULL)
  FROM
    constraint_info
  GROUP BY
    constraint_name, constraint_type, constraint_definition;
END;
$$;

-- Function to get table indexes for schema browser
CREATE OR REPLACE FUNCTION public.get_table_indexes(p_schema text, p_table text)
RETURNS TABLE (
  name text,
  columns text[],
  unique boolean,
  type text,
  definition text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.relname as index_name,
    array_agg(a.attname) as column_names,
    ix.indisunique as is_unique,
    am.amname as index_type,
    pg_get_indexdef(i.oid) as index_definition
  FROM
    pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_am am ON i.relam = am.oid
    LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  WHERE
    n.nspname = p_schema
    AND t.relname = p_table
  GROUP BY
    i.relname, ix.indisunique, am.amname, i.oid;
END;
$$;

-- Function to get RLS policies for schema browser
CREATE OR REPLACE FUNCTION public.get_table_policies(p_schema text, p_table text)
RETURNS TABLE (
  name text,
  action text,
  using_expression text,
  check_expression text,
  with_check text,
  roles text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH policy_roles AS (
    SELECT
      polname,
      array_agg(rolname) as roles
    FROM
      pg_policy
      JOIN pg_roles ON pg_roles.oid = ANY(pg_policy.polroles)
      JOIN pg_class ON pg_policy.polrelid = pg_class.oid
      JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE
      pg_namespace.nspname = p_schema
      AND pg_class.relname = p_table
    GROUP BY
      polname
  )
  SELECT
    p.polname as policy_name,
    CASE p.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      WHEN '*' THEN 'ALL'
    END as policy_action,
    pg_get_expr(p.polqual, p.polrelid) as policy_using,
    NULL as policy_check,
    pg_get_expr(p.polwithcheck, p.polrelid) as policy_with_check,
    pr.roles
  FROM
    pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    LEFT JOIN policy_roles pr ON p.polname = pr.polname
  WHERE
    n.nspname = p_schema
    AND c.relname = p_table;
END;
$$;

-- Function to get all schemas
CREATE OR REPLACE FUNCTION public.get_schemas()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'schemas',
    (
      SELECT jsonb_agg(schema_name)
      FROM information_schema.schemata
      WHERE schema_name NOT LIKE 'pg_%'
        AND schema_name NOT IN ('information_schema')
      ORDER BY schema_name
    )
  );
END;
$$;

-- Function to get tables in a schema
CREATE OR REPLACE FUNCTION public.get_tables(schema_name text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
