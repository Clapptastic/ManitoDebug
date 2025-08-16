
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createSupabaseAdmin } from './shared/supabase-admin.ts';
import { corsHeaders } from './shared/cors.ts';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { schema_name } = await req.json();
    
    if (!schema_name) {
      return new Response(
        JSON.stringify({ error: 'Schema name is required' }),
        { 
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400
        }
      );
    }
    
    // Initialize the Supabase admin client
    const supabase = createSupabaseAdmin();
    
    // Get tables
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', schema_name)
      .eq('table_type', 'BASE TABLE')
      .order('table_name');
      
    if (tablesError) throw tablesError;
    
    // Get detailed info for each table
    const tables = [];
    
    for (const table of tablesData) {
      const tableName = table.table_name;
      
      // Get columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', schema_name)
        .eq('table_name', tableName)
        .order('ordinal_position');
        
      if (columnsError) throw columnsError;
      
      const columns = columnsData.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default_value: col.column_default
      }));
      
      // Get constraints
      const { data: constraintsData, error: constraintsError } = await supabase.rpc(
        'get_table_constraints',
        { p_schema: schema_name, p_table: tableName }
      );
      
      if (constraintsError) throw constraintsError;
      
      // Get indexes
      const { data: indexesData, error: indexesError } = await supabase.rpc(
        'get_table_indexes',
        { p_schema: schema_name, p_table: tableName }
      );
      
      if (indexesError) throw indexesError;
      
      // Get policies
      const { data: policiesData, error: policiesError } = await supabase.rpc(
        'get_table_policies',
        { p_schema: schema_name, p_table: tableName }
      );
      
      if (policiesError) throw policiesError;
      
      tables.push({
        name: tableName,
        schema: schema_name,
        columns: columns || [],
        constraints: constraintsData || [],
        indexes: indexesData || [],
        policies: policiesData || []
      });
    }
    
    // Return successful response
    return new Response(
      JSON.stringify({ tables }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error fetching tables:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500
      }
    );
  }
});
