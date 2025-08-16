import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { calculateOpenAICost } from "../shared/cost-tracking.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateForecastRequest {
  timeframe: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create a client that forwards the caller's JWT for RLS
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;

    const body = (await req.json()) as GenerateForecastRequest;
    const timeframe = (body?.timeframe || '').toString().trim();
    if (!timeframe) {
      return new Response(JSON.stringify({ error: 'timeframe is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the user's OpenAI API key via secured RPC
    const { data: keyData, error: keyError } = await supabase.rpc('manage_api_key', {
      operation: 'get_for_decryption',
      user_id_param: userId,
      provider_param: 'openai',
      api_key_param: null,
      key_hash_param: null,
      masked_key_param: null,
      key_prefix_param: null,
      api_key_id_param: null,
    });

    const openAIApiKey: string | undefined = keyData?.api_key ?? undefined;

    if (keyError || !openAIApiKey) {
      // Log failed attempt
      await supabase.from('api_usage_costs').insert({
        user_id: userId,
        provider: 'openai',
        service: 'forecasting',
        endpoint: 'chat/completions',
        success: false,
        operation_type: 'generate_forecast',
        usage_count: 1,
        metadata: { error: keyError?.message || 'Missing OpenAI key' },
      });

      return new Response(JSON.stringify({ error: 'OpenAI API key not configured for this user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const start = performance.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a market research expert. Generate market forecasts based on historical data and trends.' },
          { role: 'user', content: `Generate a market forecast for the next ${timeframe}. Return concise bullet insights.` },
        ],
        temperature: 0.7,
      }),
    });

    const elapsed = Math.round(performance.now() - start);

    if (!response.ok) {
      const text = await response.text();
      await supabase.from('api_usage_costs').insert({
        user_id: userId,
        provider: 'openai',
        service: 'forecasting',
        endpoint: 'chat/completions',
        response_time_ms: elapsed,
        success: false,
        operation_type: 'generate_forecast',
        usage_count: 1,
        metadata: { error: text },
      });

      return new Response(JSON.stringify({ error: 'OpenAI API error', details: text }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    const promptTokens: number = data?.usage?.prompt_tokens ?? 0;
    const completionTokens: number = data?.usage?.completion_tokens ?? 0;
    const cost = calculateOpenAICost(promptTokens, completionTokens, 'gpt-4o-mini');

    await supabase.from('api_usage_costs').insert({
      user_id: userId,
      provider: 'openai',
      service: 'forecasting',
      endpoint: 'chat/completions',
      response_time_ms: elapsed,
      cost_usd: cost,
      success: true,
      operation_type: 'generate_forecast',
      usage_count: 1,
      metadata: { promptTokens, completionTokens, model: 'gpt-4o-mini' },
    });

    return new Response(
      JSON.stringify({
        choices: data?.choices ?? [],
        usage: data?.usage ?? null,
        model: 'gpt-4o-mini',
        timeframe,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('generate-forecast error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
