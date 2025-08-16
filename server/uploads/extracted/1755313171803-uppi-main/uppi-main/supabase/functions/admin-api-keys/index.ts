import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const { searchParams } = new URL(req.url);
  if (req.method === 'GET' && (searchParams.get('health') === '1' || searchParams.get('health') === 'true')) {
    return new Response(
      JSON.stringify({ success: true, message: 'ok' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Authenticate requester and enforce admin-only access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');

    const supabaseAuth = createClient(supabaseUrl, supabaseAnon);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin_user', { user_id_param: user.id });
    if (adminErr || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Handle GET requests with empty body
    let requestData = {};
    try {
      const body = await req.text();
      if (body && body.trim()) {
        requestData = JSON.parse(body);
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      // Continue with empty requestData for GET requests
    }

    // Health check short-circuit
    // Returns 200 without touching sensitive data; still requires valid JWT above
    // Useful for diagnostics in the admin panel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((requestData as any)?.healthCheck) {
      return new Response(
        JSON.stringify({ success: true, message: 'ok' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { provider, forPlatformUse } = requestData as { provider?: string; forPlatformUse?: boolean };

    if (req.method === 'POST') {
      // Get admin API keys for platform use
      if (forPlatformUse) {
        const { data: adminApiKeys, error } = await supabase
          .from('admin_api_keys')
          .select('*')
          .eq('provider', provider)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching admin API keys:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch admin API keys' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Return the first available admin API key for the provider
        const availableKey = adminApiKeys?.find(key => {
          if (key.usage_limit_per_month) {
            return key.current_month_usage < key.usage_limit_per_month;
          }
          return true; // No limit means available
        });

        if (!availableKey) {
          return new Response(
            JSON.stringify({ error: 'No available admin API key for this provider' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            apiKey: availableKey.api_key,
            keyId: availableKey.id,
            provider: availableKey.provider
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get admin API keys for management (masked)
      const { data: adminApiKeys, error } = await supabase
        .from('admin_api_keys')
        .select('id, provider, name, masked_key, is_active, status, usage_limit_per_month, current_month_usage, created_at, last_validated')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin API keys:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch admin API keys' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, apiKeys: adminApiKeys }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      // Update usage tracking for admin API key
      let updateData = {};
      try {
        const body = await req.text();
        if (body && body.trim()) {
          updateData = JSON.parse(body);
        }
      } catch (error) {
        console.error('Error parsing PUT request body:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { keyId, tokensUsed, costUsd, endpoint, userId, success = true } = updateData;

      // Record usage
      const { error: usageError } = await supabase
        .from('admin_api_usage_tracking')
        .insert({
          admin_api_key_id: keyId,
          user_id: userId,
          endpoint: endpoint,
          tokens_used: tokensUsed || 0,
          cost_usd: costUsd || 0,
          success: success
        });

      if (usageError) {
        console.error('Error recording usage:', usageError);
      }

      // Update monthly usage counter
      if (tokensUsed && tokensUsed > 0) {
        const { error: updateError } = await supabase.rpc('increment_admin_key_usage', {
          key_id: keyId,
          tokens_to_add: tokensUsed
        });

        if (updateError) {
          console.error('Error updating usage counter:', updateError);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-api-keys function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});