
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const projectId = supabaseUrl.match(/https:\/\/(\w+)\.supabase\.co/)?.[1] || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the function name from the request
    const { function_name } = await req.json();
    
    if (!function_name) {
      throw new Error('Missing function_name parameter');
    }
    
    // Construct the full function URL
    const functionUrl = `https://${projectId}.supabase.co/functions/v1/${function_name}`;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        url: functionUrl,
        project_id: projectId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in get-function-url:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
