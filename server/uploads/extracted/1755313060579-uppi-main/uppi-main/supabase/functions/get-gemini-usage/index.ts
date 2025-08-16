import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader?.replace('Bearer ', '') ?? '';
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 401,
      });
    }

    const { data: apiKeyData } = await supabaseAdmin.rpc('manage_api_key', {
      operation: 'get_for_decryption',
      user_id_param: user.id,
      provider_param: 'gemini'
    });

    if (!apiKeyData?.api_key) {
      return new Response(JSON.stringify({ error: 'Gemini API key not found' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        usage: { total_tokens: 0, total_cost: 0, note: 'Gemini usage API not available; using estimates in app.' },
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: (error as Error).message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 500,
    });
  }
});
