
-- First, let's create a helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION check_role_no_recursion(user_id uuid, role_to_check user_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM platform_roles
        WHERE platform_roles.user_id = $1
        AND platform_roles.role = $2
    );
$$;

-- Create a function to check if user is super admin without recursion
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN check_role_no_recursion(auth.uid(), 'super_admin'::user_role);
END;
$$;

-- Recreate the database schema info function with better error handling
CREATE OR REPLACE FUNCTION get_database_schema_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Only allow super admins to access this information
    IF NOT (SELECT is_super_admin(auth.uid())) THEN
        RAISE EXCEPTION 'Unauthorized: Only super admins can access schema information';
    END IF;

    WITH table_info AS (
        SELECT 
            t.table_name,
            jsonb_agg(
                jsonb_build_object(
                    'column_name', c.column_name,
                    'data_type', c.data_type,
                    'is_nullable', c.is_nullable,
                    'column_default', c.column_default,
                    'description', pd.description
                ) ORDER BY c.ordinal_position
            ) as columns,
            obj_description((quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass) as table_description
        FROM information_schema.tables t
        JOIN information_schema.columns c 
            ON c.table_name = t.table_name 
            AND c.table_schema = t.table_schema
        LEFT JOIN pg_description pd
            ON pd.objoid = (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass
            AND pd.objsubid = c.ordinal_position
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_schema, t.table_name
    ),
    constraint_info AS (
        SELECT 
            tc.table_name,
            jsonb_agg(
                jsonb_build_object(
                    'constraint_name', tc.constraint_name,
                    'constraint_type', tc.constraint_type,
                    'column_names', array_agg(kcu.column_name),
                    'foreign_table', ccu.table_name,
                    'foreign_columns', array_agg(ccu.column_name)
                )
            ) as constraints
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
        GROUP BY tc.table_name, tc.constraint_name
    ),
    index_info AS (
        SELECT 
            tablename as table_name,
            jsonb_agg(
                jsonb_build_object(
                    'index_name', indexname,
                    'index_def', indexdef
                )
            ) as indexes
        FROM pg_indexes
        WHERE schemaname = 'public'
        GROUP BY tablename
    ),
    rls_info AS (
        SELECT 
            tablename as table_name,
            jsonb_agg(
                jsonb_build_object(
                    'policy_name', policyname,
                    'roles', roles,
                    'cmd', cmd,
                    'qual', qual,
                    'with_check', with_check
                )
            ) as policies
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
    )
    SELECT jsonb_build_object(
        'schema_version', '1.0',
        'last_updated', now(),
        'tables', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'table_name', ti.table_name,
                    'description', ti.table_description,
                    'columns', ti.columns,
                    'constraints', COALESCE(ci.constraints, '[]'::jsonb),
                    'indexes', COALESCE(ii.indexes, '[]'::jsonb),
                    'policies', COALESCE(ri.policies, '[]'::jsonb)
                )
            )
            FROM table_info ti
            LEFT JOIN constraint_info ci ON ci.table_name = ti.table_name
            LEFT JOIN index_info ii ON ii.table_name = ti.table_name
            LEFT JOIN rls_info ri ON ri.table_name = ti.table_name
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Fix platform_roles policies
ALTER TABLE platform_roles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their roles" ON platform_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON platform_roles;
DROP POLICY IF EXISTS "Platform role policies" ON platform_roles;

ALTER TABLE platform_roles ENABLE ROW LEVEL SECURITY;

-- Create a single, simple policy for platform_roles
CREATE POLICY "Platform role policies"
    ON platform_roles
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (
        -- Users can see their own roles
        auth.uid() = user_id
        OR 
        -- Or the user is a super admin (using our non-recursive check)
        check_role_no_recursion(auth.uid(), 'super_admin'::user_role)
    )
    WITH CHECK (
        -- Only super admins can modify roles
        check_role_no_recursion(auth.uid(), 'super_admin'::user_role)
    );
