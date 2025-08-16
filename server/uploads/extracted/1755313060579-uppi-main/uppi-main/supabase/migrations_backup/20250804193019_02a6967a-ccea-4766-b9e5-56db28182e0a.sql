-- Create database functions for schema viewer functionality

-- Function to get table information
CREATE OR REPLACE FUNCTION public.get_table_info()
RETURNS TABLE (
  table_name text,
  table_schema text,
  table_type text,
  is_insertable_into text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.table_name::text,
    t.table_schema::text,
    t.table_type::text,
    t.is_insertable_into::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- Function to get column information
CREATE OR REPLACE FUNCTION public.get_column_info()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  ordinal_position integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text,
    c.ordinal_position::integer
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position;
$$;

-- Function to get foreign key information
CREATE OR REPLACE FUNCTION public.get_foreign_key_info()
RETURNS TABLE (
  table_name text,
  column_name text,
  foreign_table_schema text,
  foreign_table_name text,
  foreign_column_name text,
  constraint_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_schema::text as foreign_table_schema,
    ccu.table_name::text as foreign_table_name,
    ccu.column_name::text as foreign_column_name,
    tc.constraint_name::text
  FROM information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name, kcu.ordinal_position;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_table_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_column_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_foreign_key_info() TO authenticated;