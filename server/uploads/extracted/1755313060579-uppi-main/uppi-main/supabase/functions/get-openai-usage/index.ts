import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { logApiMetrics } from '../shared/api-metrics.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  const startTime = Date.now();
  try {
    console.log('🔍 Fetching OpenAI API usage...');
    
    // Get authenticated user - fix infinite auth loop
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No Authorization header provided');
      await logApiMetrics('unknown', 'get-openai-usage', startTime, 401);
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      await logApiMetrics('unknown', 'get-openai-usage', startTime, 401);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 401 }
      );
    }

    // Get user's OpenAI API key
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .rpc('manage_api_key', {
        operation: 'get_for_decryption',
        user_id_param: user.id,
        provider_param: 'openai'
      });

    if (keyError || !apiKeyData?.api_key) {
      console.error('❌ OpenAI API key not found:', keyError);
      await logApiMetrics(user.id, 'get-openai-usage', startTime, 404, { reason: 'api_key_not_found' });
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 404 }
      );
    }

    // Get decrypted API key via secure API key manager
    const { data: decryptData } = await supabaseAdmin.functions.invoke('unified-api-key-manager', {
      body: { provider: 'openai', action: 'decrypt' }
    });

    if (!decryptData?.apiKey) {
      console.error('❌ Failed to decrypt OpenAI API key');
      await logApiMetrics(user.id, 'get-openai-usage', startTime, 500, { reason: 'decryption_failed' });
      return new Response(
        JSON.stringify({ error: 'Failed to decrypt OpenAI API key' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 500 }
      );
    }

    const decryptedKey = decryptData.apiKey;
    // If decryption produced an unreadable key, gracefully degrade with a safe stub
    if (!/^[\x20-\x7E]+$/.test(decryptedKey)) {
      console.warn('OpenAI API key appears malformed after decryption; returning safe usage stub');
      await logApiMetrics(user.id, 'get-openai-usage', startTime, 200, { provider: 'openai', reason: 'malformed_after_decryption' });
      return new Response(
        JSON.stringify({
          success: true,
          usage: {
            total_tokens: 0,
            total_cost: 0,
            note: 'API key could not be decrypted. Please re-save your OpenAI key in Settings.'
          },
          period: { start: new Date().toISOString(), end: new Date().toISOString() }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 200 }
      );
    }

    console.log('🔑 Testing OpenAI API key...');
    
    try {
      // Timeout wrapper for external API call (5s)
      const withTimeout = async <T>(p: Promise<T>, ms = 5000): Promise<T> => {
        return await Promise.race([
          p,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
        ]);
      };

      // Test with a simple models call first (less expensive than usage)
      const modelsResponse = await withTimeout(fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${decryptedKey}`,
          'Content-Type': 'application/json',
        },
      }));

      if (!modelsResponse.ok) {
        const errorText = await modelsResponse.text();
        console.error('❌ OpenAI API error:', modelsResponse.status, errorText);

        // Return a safe success stub to avoid client crashes
        await logApiMetrics(user.id, 'get-openai-usage', startTime, 200, { provider: 'openai', upstream_status: modelsResponse.status });
        return new Response(
          JSON.stringify({
            success: true,
            usage: {
              total_tokens: 0,
              total_cost: 0,
              note: modelsResponse.status === 401
                ? 'OpenAI API key invalid or expired. Please update your key in Settings.'
                : `OpenAI API unreachable (${modelsResponse.status}). Using fallback.`
            },
            period: { start: new Date().toISOString(), end: new Date().toISOString() }
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 200 }
        );
      }

      console.log('✅ OpenAI API key is valid');

      // Return mock usage data since OpenAI's usage endpoint has limitations
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      await logApiMetrics(user.id, 'get-openai-usage', startTime, 200, { provider: 'openai' });
      return new Response(
        JSON.stringify({
          success: true,
          usage: {
            total_tokens: 0,
            total_cost: 0,
            note: 'Usage tracking available in OpenAI dashboard. API key is valid.',
            models_available: true
          },
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 200 }
      );

    } catch (fetchError) {
      console.error('❌ Network error calling OpenAI API:', fetchError);
      // Return a safe success stub on network errors/timeouts
      await logApiMetrics(user.id, 'get-openai-usage', startTime, 200, { provider: 'openai', error: (fetchError as Error)?.message });
      return new Response(
        JSON.stringify({ 
          success: true,
          usage: {
            total_tokens: 0,
            total_cost: 0,
            note: 'Network error contacting OpenAI. Using fallback.'
          },
          period: { start: new Date().toISOString(), end: new Date().toISOString() }
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 200 }
      );
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    await logApiMetrics('unknown', 'get-openai-usage', startTime, 500, { error: (error as Error)?.message });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: (error as Error)?.message
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 500 }
    );
  }
});