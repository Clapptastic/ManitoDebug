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
    console.log('🔍 Fetching Anthropic API usage...');
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      await logApiMetrics('unknown', 'get-anthropic-usage', startTime, 401);
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 401 }
      );
    }

    // Get user's Anthropic API key
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .rpc('manage_api_key', {
        operation: 'get_for_decryption',
        user_id_param: user.id,
        provider_param: 'anthropic'
      });

    if (keyError || !apiKeyData?.api_key) {
      console.error('❌ Anthropic API key not found:', keyError);
      await logApiMetrics(user.id, 'get-anthropic-usage', startTime, 404, { reason: 'api_key_not_found' });
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not found' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 404 }
      );
    }

    // Decrypt user's Anthropic API key (supports legacy XOR+base64)
    const decryptIfNeeded = (maybeEncrypted: string): string => {
      if (maybeEncrypted.startsWith('sk-ant-') && maybeEncrypted.length >= 20) {
        return maybeEncrypted;
      }
      try {
        const secret = 'api_key_encryption_secret_2024';
        const base64Decoded = atob(maybeEncrypted);
        let out = '';
        for (let i = 0; i < base64Decoded.length; i++) {
          out += String.fromCharCode(
            base64Decoded.charCodeAt(i) ^ secret.charCodeAt(i % secret.length)
          );
        }
        return out.trim();
      } catch {
        return maybeEncrypted;
      }
    };

    const decryptedKey = decryptIfNeeded(apiKeyData.api_key);

    console.log('🔑 Testing Anthropic API key...');
    await logApiMetrics(user.id, 'get-anthropic-usage', startTime, 200, { provider: 'anthropic' });
    return new Response(
      JSON.stringify({
        success: true,
        usage: {
          total_tokens: 0,
          total_cost: 0,
          note: 'Anthropic API usage tracking not available via API. Monitor usage in Anthropic Console.'
        },
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString()
        }
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    await logApiMetrics('unknown', 'get-anthropic-usage', startTime, 500, { error: (error as Error)?.message });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: (error as Error)?.message
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 500 }
    );
  }
});