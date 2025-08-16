import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Lightweight health ping
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ success: true, message: 'ok', timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const jwt = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      throw new Error(`User not authenticated: ${userError?.message || 'Unknown error'}`);
    }

    const { 
      provider, 
      endpoint, 
      method, 
      statusCode, 
      responseTime, 
      tokensUsed, 
      cost, 
      model, 
      errorMessage 
    } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error: logError } = await supabaseAdmin
      .from('api_usage_costs')
      .insert({
        user_id: user.id,
        provider: provider,
        endpoint: endpoint || '/chat/completions',
        success: statusCode >= 200 && statusCode < 300,
        response_time_ms: responseTime || 0,
        tokens_used: tokensUsed || 0,
        cost_usd: cost || 0,
        model_used: model,
        error_message: errorMessage
      });

    if (logError) throw logError;

    // Also log to consolidated api_metrics
    const requestId = crypto.randomUUID();
    const { error: apiMetricsError } = await supabaseAdmin
      .from('api_metrics')
      .insert({
        user_id: user.id,
        endpoint: endpoint || '/chat/completions',
        method: method || 'POST',
        status_code: statusCode || (errorMessage ? 500 : 200),
        response_time_ms: responseTime || 0,
        metadata: {
          provider,
          tokens_used: tokensUsed || 0,
          cost_usd: cost || 0,
          model,
          request_id: requestId,
          error_message: errorMessage || null
        }
      });

    if (apiMetricsError) throw apiMetricsError;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error)?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});