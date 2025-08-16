import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: realtime-ephemeral-token
 * Purpose: Generate ephemeral OpenAI Realtime session tokens for client WebRTC connections
 * Security: Uses the requesting user's stored API key (no global keys)
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client that forwards the caller's JWT for RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase env');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing Supabase env' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Ensure user is authenticated
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: valid session required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const provider: string = body?.provider || 'openai';
    const model: string = body?.model || 'gpt-4o-realtime-preview-2024-12-17';
    const voice: string = body?.voice || 'alloy';
    const instructions: string = body?.instructions ||
      'You are an AI entrepreneurship cofounder. Provide concise, actionable guidance.';

    // Fetch the user's API key from secure storage via RPC (security definer)
    const { data: keyObj, error: keyErr } = await supabase.rpc('manage_api_key', {
      operation: 'get_for_decryption',
      user_id_param: userRes.user.id,
      provider_param: provider,
    });

    if (keyErr) {
      console.error('manage_api_key error', keyErr);
      return new Response(
        JSON.stringify({ error: 'Failed to load API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt legacy-stored keys if necessary (keeps compatibility with older entries)
    const decryptIfNeeded = (maybeEncrypted: string): string => {
      // Likely plaintext OpenAI keys
      if ((maybeEncrypted?.startsWith('sk-') && maybeEncrypted.length >= 20) ||
          (maybeEncrypted?.startsWith('sk-proj-') && maybeEncrypted.length >= 30)) {
        return maybeEncrypted;
      }
      // Attempt simple XOR-base64 legacy decryption
      try {
        const secret = 'api_key_encryption_secret_2024';
        const base64Decoded = atob(maybeEncrypted);
        let decrypted = '';
        for (let i = 0; i < base64Decoded.length; i++) {
          decrypted += String.fromCharCode(base64Decoded.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
        }
        return decrypted;
      } catch (_) {
        return maybeEncrypted; // fallback; validation below will fail fast if incorrect
      }
    };

    const rawApiKey = (keyObj?.api_key as string | undefined) ?? '';
    if (!rawApiKey) {
      return new Response(
        JSON.stringify({ error: `No active ${provider} API key found for user` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const finalKey = decryptIfNeeded(rawApiKey);
    const looksValid = (finalKey.startsWith('sk-') && finalKey.length >= 20) ||
                       (finalKey.startsWith('sk-proj-') && finalKey.length >= 30);
    if (!looksValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid OpenAI API key format. Please update your API key in Settings > API Keys.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Request an ephemeral token from OpenAI (valid for a short time)
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
    headers: {
        Authorization: `Bearer ${finalKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, voice, instructions }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI sessions error', data);
      return new Response(JSON.stringify({ error: data?.error || 'Failed to create session' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('OpenAI Realtime session created for user', userRes.user.id);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating ephemeral session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
