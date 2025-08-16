import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DebugInfo {
  provider: string;
  id?: string;
  hasKey: boolean;
  keyFormat: string;
  encryptionStatus: string;
  decryptionAttempt: string;
  validationStatus: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { action } = await req.json().catch(() => ({ action: 'debug_all' }));

    console.log(`🔐 Debug API keys for user: ${user.id}`);

    if (action === 'fix_corrupted') {
      return await fixCorruptedKeys(supabase, user.id);
    }

    // Get all user's API keys
    const { data: apiKeys, error: keyError } = await supabase.rpc('manage_api_key', {
      operation: 'select',
      user_id_param: user.id
    });

    if (keyError) {
      throw new Error(`Failed to fetch API keys: ${keyError.message}`);
    }

    const keys = (apiKeys as any[]) || [];
    console.log(`📊 Found ${keys.length} API keys to debug`);

    const debugResults: DebugInfo[] = [];

    for (const key of keys) {
      const debugInfo: DebugInfo = {
        provider: key.provider,
        id: key.id,
        hasKey: true,
        keyFormat: 'unknown',
        encryptionStatus: 'unknown',
        decryptionAttempt: 'not_attempted',
        validationStatus: 'not_tested'
      };

      try {
        // Get the encrypted key for testing
        const { data: keyData } = await supabase.rpc('manage_api_key', {
          operation: 'get_for_decryption',
          user_id_param: user.id,
          provider_param: key.provider
        });

        if (!keyData?.api_key) {
          debugInfo.error = 'No API key data returned';
          debugInfo.encryptionStatus = 'missing_data';
          debugResults.push(debugInfo);
          continue;
        }

        const encryptedKey = keyData.api_key;
        
        // Check if key appears to be plaintext
        const plaintextPrefixes = ['sk-', 'sk-proj-', 'pplx-', 'gsk_', 'anthropic'];
        if (plaintextPrefixes.some(prefix => encryptedKey.startsWith(prefix))) {
          debugInfo.keyFormat = 'plaintext';
          debugInfo.encryptionStatus = 'not_encrypted';
          debugInfo.decryptionAttempt = 'not_needed';
          debugInfo.validationStatus = 'valid_format';
        } else {
          debugInfo.keyFormat = 'encrypted';
          debugInfo.encryptionStatus = 'encrypted';
          
          // Attempt decryption via secure API key manager
          try {
            const { data } = await supabase.functions.invoke('unified-api-key-manager', {
              body: { provider: key.provider, action: 'decrypt' }
            });
            const decrypted = data?.apiKey;
            if (!decrypted) throw new Error('No decrypted key returned');
            debugInfo.decryptionAttempt = 'success';
            
            // Validate format after decryption
            if (plaintextPrefixes.some(prefix => decrypted.startsWith(prefix))) {
              debugInfo.validationStatus = 'valid_after_decrypt';
            } else {
              debugInfo.validationStatus = 'invalid_format';
              debugInfo.error = 'Decrypted key has invalid format';
            }
          } catch (decryptError: any) {
            debugInfo.decryptionAttempt = 'failed';
            debugInfo.error = `Decryption failed: ${decryptError.message}`;
            
            // Try legacy fallback
            try {
              const legacyDecrypted = await legacyDecrypt(encryptedKey);
              debugInfo.decryptionAttempt = 'legacy_success';
              if (plaintextPrefixes.some(prefix => legacyDecrypted.startsWith(prefix))) {
                debugInfo.validationStatus = 'valid_legacy';
              } else {
                debugInfo.validationStatus = 'invalid_legacy';
              }
            } catch (legacyError: any) {
              debugInfo.error += ` | Legacy failed: ${legacyError.message}`;
            }
          }
        }

        // Test actual API connectivity if decryption succeeded
        if (['success', 'legacy_success', 'not_needed'].includes(debugInfo.decryptionAttempt)) {
          try {
            const isWorking = await testProviderApi(supabase, key.provider, encryptedKey, debugInfo.decryptionAttempt !== 'not_needed');
            debugInfo.validationStatus = isWorking ? 'api_working' : 'api_failed';
          } catch (apiError: any) {
            debugInfo.validationStatus = 'api_error';
            debugInfo.error = (debugInfo.error ? debugInfo.error + ' | ' : '') + `API test failed: ${apiError.message}`;
          }
        }

      } catch (error: any) {
        debugInfo.error = error.message;
      }

      debugResults.push(debugInfo);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user.id,
        total_keys: keys.length,
        debug_results: debugResults,
        summary: {
          encrypted_keys: debugResults.filter(d => d.keyFormat === 'encrypted').length,
          plaintext_keys: debugResults.filter(d => d.keyFormat === 'plaintext').length,
          decryption_failures: debugResults.filter(d => d.decryptionAttempt === 'failed').length,
          working_apis: debugResults.filter(d => d.validationStatus === 'api_working').length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Debug API key error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: (error as Error)?.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function legacyDecrypt(encrypted: string): Promise<string> {
  const secret = 'api_key_encryption_secret_2024';
  const decoded = atob(encrypted);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
  }
  return result;
}

async function testProviderApi(supabaseClient: any, provider: string, key: string, needsDecryption: boolean): Promise<boolean> {
  let apiKey = key;
  
  if (needsDecryption) {
    try {
      const { data } = await supabaseClient.functions.invoke('unified-api-key-manager', {
        body: { provider, action: 'decrypt' }
      });
      apiKey = data?.apiKey || key;
    } catch {
      apiKey = await legacyDecrypt(key);
    }
  }

  switch (provider) {
    case 'openai':
      const openaiResponse = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return openaiResponse.ok;
      
    case 'anthropic':
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return anthropicResponse.ok;
      
    case 'perplexity':
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });
      return perplexityResponse.ok;
      
    default:
      return false;
  }
}

async function fixCorruptedKeys(supabase: any, userId: string): Promise<Response> {
  const fixed: string[] = [];
  const errors: string[] = [];
  
  try {
    // Get all user's keys
    const { data: apiKeys } = await supabase.rpc('manage_api_key', {
      operation: 'select',
      user_id_param: userId
    });

    const keys = (apiKeys as any[]) || [];
    
    for (const key of keys) {
      try {
        // Try to decrypt and validate
        const { data: keyData } = await supabase.rpc('manage_api_key', {
          operation: 'get_for_decryption',
          user_id_param: userId,
          provider_param: key.provider
        });

        if (keyData?.api_key) {
          try {
            const { data } = await supabase.functions.invoke('unified-api-key-manager', {
              body: { provider: key.provider, action: 'decrypt' }
            });
            if (!data?.apiKey) throw new Error('No decrypted key returned');
            // Key is fine
          } catch {
            // Try to fix by re-encrypting if we can determine it's plaintext
            const plaintextPrefixes = ['sk-', 'sk-proj-', 'pplx-', 'gsk_', 'anthropic'];
            if (plaintextPrefixes.some(prefix => keyData.api_key.startsWith(prefix))) {
              // Key appears to be plaintext, mark it for re-encryption
              await supabase
                .from('api_keys')
                .update({ 
                  status: 'error',
                  error_message: 'Key format needs updating'
                })
                .eq('id', key.id);
              fixed.push(key.provider);
            } else {
              errors.push(`${key.provider}: Unable to fix corrupted encryption`);
            }
          }
        }
      } catch (error: any) {
        errors.push(`${key.provider}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fixed,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        fixed,
        errors: [...errors, error.message]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}