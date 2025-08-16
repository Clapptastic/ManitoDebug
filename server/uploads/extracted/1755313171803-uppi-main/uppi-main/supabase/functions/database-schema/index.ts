import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action } = await req.json();

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin_user', { user_id_param: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a user-scoped client so SQL functions see auth.uid()
    const userScoped = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    if (action === 'get-policies') {
      // Use the exec_sql function to get RLS policies safely
      const { data, error } = await userScoped.rpc('exec_sql', {
        sql: `SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname`
      });

      if (error) {
        console.error('Error fetching policies:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch RLS policies' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const policies = (data as any)?.[0]?.result?.policies ?? [];

      return new Response(
        JSON.stringify({ 
          success: true, 
          policies
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-functions') {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT routine_name, routine_schema, routine_type FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name`
      });

      if (error) {
        console.error('Error fetching functions:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch functions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, functions: (data as any)?.functions || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-tables') {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `SELECT 
          table_name,
          table_schema,
          table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name`
      });

      if (error) {
        console.error('Error fetching tables:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch tables' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          tables: data?.tables || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-enhanced-schema') {
      // Use dedicated DB function to fetch tables with columns/constraints
      const { data, error } = await supabase.rpc('get_tables', { schema_name: 'public' });

      if (error) {
        console.error('Error fetching enhanced schema:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch enhanced schema' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const rawTables = (data as any)?.tables || [];

      // Transform to shape expected by EnhancedSchemaVisualizer
      const tables = rawTables.map((t: any) => {
        const columns = (t.columns || []).map((c: any) => ({
          column_name: c.name,
          data_type: c.type,
          is_nullable: c.nullable,
          column_default: c.default_value,
        }));

        const foreignKeys = (t.constraints || [])
          .filter((c: any) => c.type === 'foreign_key' && typeof c.definition === 'string')
          .flatMap((c: any) => {
            try {
              const match = c.definition.match(/FOREIGN KEY \(([^)]+)\) REFERENCES ([\w\.]+)\(([^)]+)\)/i);
              if (!match) return [];
              const col = match[1].split(',')[0].trim().replace(/\"/g, '');
              const refTableFull = match[2];
              const refTable = refTableFull.includes('.') ? refTableFull.split('.')[1] : refTableFull;
              const refCol = match[3].split(',')[0].trim().replace(/\"/g, '');
              return [{ column_name: col, foreign_table_name: refTable, foreign_column_name: refCol }];
            } catch (_) {
              return [];
            }
          });

        return {
          table_name: t.name,
          columns,
          foreignKeys,
        };
      });

      return new Response(
        JSON.stringify({ success: true, tables, metrics: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Database schema error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});