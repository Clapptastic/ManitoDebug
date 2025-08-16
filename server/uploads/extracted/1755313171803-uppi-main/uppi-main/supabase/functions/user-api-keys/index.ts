import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { logApiMetrics } from '../shared/api-metrics.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  try {
    // Parse body once (may be empty for GET-style requests)
    let body: any = null;
    try {
      const raw = await req.text();
      body = raw && raw.trim() ? JSON.parse(raw) : null;
    } catch {}

    // Lightweight health check path (no auth/db): used by diagnostics
    if (body?.healthCheck) {
      await logApiMetrics('unknown', 'user-api-keys', startTime, 200);
      return new Response(
        JSON.stringify({ success: true, message: 'ok' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      await logApiMetrics('unknown', 'user-api-keys', startTime, 401);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const provider: string | undefined = body?.provider;

    // Build query: only validated, active keys for this user
    let query = supabaseClient
      .from('api_keys')
      .select('id, provider, name, masked_key, status, is_active, created_at, updated_at, last_used_at, last_validated, permissions')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('status', 'active')
      .not('last_validated', 'is', null);

    if (provider) {
      query = query.ilike('provider', provider);
    }

    const { data: apiKeys, error } = await query.order('provider', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      await logApiMetrics(user.id, 'user-api-keys', startTime, 500);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch API keys' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return only non-sensitive, validated key metadata
    const result = (apiKeys || []).map((key: any) => ({
      id: key.id,
      provider: key.provider,
      name: key.name,
      masked_key: key.masked_key,
      status: key.status,
      is_active: key.is_active,
      created_at: key.created_at,
      updated_at: key.updated_at,
      last_used_at: key.last_used_at,
      last_validated: key.last_validated,
      permissions: key.permissions
    }));

    console.log(`✅ Found ${apiKeys?.length || 0} API keys`);

    await logApiMetrics(user.id, 'user-api-keys', startTime, 200);
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        count: apiKeys?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching API keys:', error);
    await logApiMetrics('unknown', 'user-api-keys', startTime, 500);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})