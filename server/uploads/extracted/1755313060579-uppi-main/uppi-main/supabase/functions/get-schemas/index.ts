
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role (needed for schema access)
    const supabase = createClient(
      SUPABASE_URL,
      SERVICE_ROLE_KEY,
    );

    // Fetch schemas via secure RPC (no raw SQL)
    const { data, error } = await supabase.rpc('get_schemas');

    if (error) throw error;

    // Extract schema names with fallback handling
    let schemas: string[] = [];
    if (data && Array.isArray((data as any).schemas)) {
      schemas = (data as any).schemas as string[];
    } else if (Array.isArray(data)) {
      // legacy shape: array of rows with schema_name
      schemas = (data as any[]).map((row: any) => row.schema_name).filter(Boolean);
    }

    // Return successful response
    return new Response(
      JSON.stringify({ schemas }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error fetching schemas:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500
      }
    );
  }
});
