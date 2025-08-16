import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApiKeyValidationResult {
  isValid: boolean;
  provider: string;
  error?: string;
  details?: any;
  formatCorrect: boolean;
  canConnectToService: boolean;
  lastChecked: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for vault operations
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      }
    );

    const body = await req.json().catch(() => ({}));
    const { action, provider, apiKey, key_id } = body;

    console.log(`🔐 Enhanced API Key Manager (Vault) - Action: ${action || 'undefined'}, Provider: ${provider || 'undefined'}`);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    let effectiveUserId;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (!userError && user) {
          effectiveUserId = user.id;
          console.log(`✅ User authenticated: ${user.email}`);
        } else {
          console.warn(`⚠️ Auth validation failed:`, userError);
        }
      } catch (authErr) {
        console.warn(`⚠️ Auth token validation error:`, authErr);
      }
    }

    if (!effectiveUserId) {
      console.warn(`⚠️ No authentication for action: ${action}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required',
        action,
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result;

    switch (action) {
      case 'save':
        result = await saveApiKeyVault(supabase, effectiveUserId, provider, apiKey);
        break;
      case 'validate':
        result = await validateApiKeyVault(supabase, effectiveUserId, provider);
        break;
      case 'decrypt':
        result = await getDecryptedApiKeyVault(supabase, effectiveUserId, provider);
        break;
      case 'get_all_statuses':
        result = await getAllApiKeyStatusesVault(supabase, effectiveUserId);
        break;
      case 'refresh_status':
        result = await refreshApiKeyStatusVault(supabase, effectiveUserId, provider);
        break;
      case 'test_connection':
        result = await testApiConnectionVault(supabase, effectiveUserId, provider);
        break;
      case 'delete':
        result = await deleteApiKeyVault(supabase, effectiveUserId, key_id, provider);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`✅ Action ${action} completed successfully`);

    return new Response(JSON.stringify({
      success: true,
      action,
      provider,
      result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Enhanced API Key Manager (Vault) error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// VAULT-BASED API KEY OPERATIONS (SUPABASE BEST PRACTICES)
// ============================================================================

async function saveApiKeyVault(supabase: any, userId: string, provider: string, apiKey: string) {
  console.log(`💾 Saving API key for ${provider} using Supabase Vault...`);

  // Validate format first
  console.log(`📝 Validating format for ${provider}...`);
  const formatValidation = await validateApiKeyFormat(provider, apiKey);
  if (!formatValidation.formatCorrect) {
    throw new Error(`Invalid ${provider} API key format: ${formatValidation.error}`);
  }

  // Test the key works
  console.log(`🌐 Testing ${provider} API connection...`);
  const testResult = await testApiKeyDirectly(provider, apiKey);
  if (!testResult.isValid) {
    throw new Error(`API key validation failed: ${testResult.error}`);
  }

  try {
    // Use Supabase Vault function to store the API key securely
    console.log(`🔐 Storing API key in Supabase Vault for ${provider}...`);
    
    const { data, error } = await supabase.rpc('manage_api_key_vault', {
      operation: 'save',
      user_id_param: userId,
      provider_param: provider,
      api_key_param: apiKey,
      key_name_param: `${provider}_api_key_${userId}`
    });

    if (error) {
      console.error('❌ Vault storage failed:', error);
      throw new Error(`Failed to store API key in vault: ${error.message}`);
    }

    console.log(`✅ API key for ${provider} saved successfully in Vault`);

    return {
      provider,
      operation: data.operation,
      vault_secret_id: data.vault_secret_id,
      status: 'active',
      validation_result: testResult,
      saved_at: new Date().toISOString(),
      storage_type: 'supabase_vault'
    };

  } catch (error) {
    console.error(`❌ Error saving API key to vault:`, error);
    throw new Error(`Failed to save API key: ${error.message}`);
  }
}

async function validateApiKeyVault(supabase: any, userId: string, provider: string) {
  console.log(`🔍 Validating ${provider} API key from Vault...`);

  try {
    // Get API key from vault and validate it
    const decryptResult = await getDecryptedApiKeyVault(supabase, userId, provider);
    
    if (!decryptResult.success) {
      return {
        isValid: false,
        provider,
        error: decryptResult.error || 'API key not found in vault',
        formatCorrect: false,
        canConnectToService: false,
        lastChecked: new Date().toISOString()
      };
    }

    const apiKeyValue = decryptResult.apiKey;
    
    // Validate format and test service connection
    const formatValidation = await validateApiKeyFormat(provider, apiKeyValue);
    const serviceTest = await testApiKeyDirectly(provider, apiKeyValue);

    const result: ApiKeyValidationResult = {
      isValid: formatValidation.formatCorrect && serviceTest.isValid,
      provider,
      formatCorrect: formatValidation.formatCorrect,
      canConnectToService: serviceTest.isValid,
      lastChecked: new Date().toISOString(),
      details: {
        format_validation: formatValidation,
        service_test: serviceTest,
        storage_type: 'supabase_vault'
      }
    };

    if (!result.isValid) {
      result.error = formatValidation.error || serviceTest.error;
    }

    console.log(`✅ Validation completed for ${provider} - Valid: ${result.isValid}`);
    return result;

  } catch (error) {
    console.error(`❌ Error validating ${provider} from vault:`, error);
    return {
      isValid: false,
      provider,
      error: error.message,
      formatCorrect: false,
      canConnectToService: false,
      lastChecked: new Date().toISOString()
    };
  }
}

async function getDecryptedApiKeyVault(supabase: any, userId: string, provider: string) {
  console.log(`🔓 Retrieving API key for ${provider} from Vault...`);

  try {
    // Get the API key record from database to find vault_secret_id
    const { data: keyRecord, error: dbError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (dbError || !keyRecord) {
      return {
        success: false,
        error: 'API key not found',
        provider
      };
    }

    if (!keyRecord.vault_secret_id) {
      return {
        success: false,
        error: 'API key not stored in vault - migration required',
        provider
      };
    }

    // Use vault function to retrieve the API key (use correct parameters)
    const { data: decryptedKey, error: vaultError } = await supabase.rpc('vault_retrieve_api_key', {
      p_user_id: userId,
      p_provider: provider
    });

    if (vaultError || !decryptedKey) {
      console.error('❌ Vault retrieval failed:', vaultError);
      return {
        success: false,
        error: 'Failed to retrieve API key from vault',
        provider
      };
    }

    console.log(`✅ Successfully retrieved API key for ${provider} from Vault`);
    return {
      success: true,
      apiKey: decryptedKey,
      provider,
      masked_key: keyRecord.masked_key,
      status: keyRecord.status,
      storage_type: 'supabase_vault'
    };

  } catch (error) {
    console.error(`❌ Error retrieving API key from vault for ${provider}:`, error);
    return {
      success: false,
      error: error.message,
      provider
    };
  }
}

async function getAllApiKeyStatusesVault(supabase: any, userId: string) {
  console.log(`📋 Getting all API key statuses from Vault...`);

  try {
    // Use vault management function to get all API keys
    const { data: vaultResult, error: vaultError } = await supabase.rpc('manage_api_key_vault', {
      operation: 'get_all_statuses',
      user_id_param: userId
    });

    if (vaultError) {
      console.error(`❌ Vault query failed:`, vaultError.message);
      return [];
    }

    const keys = Array.isArray(vaultResult) ? vaultResult : [];
    
    const allKeys = keys.map(dbKey => ({
      id: dbKey.id,
      provider: dbKey.provider,
      masked_key: dbKey.masked_key,
      status: dbKey.status,
      last_validated: dbKey.last_validated,
      created_at: dbKey.created_at,
      updated_at: dbKey.updated_at,
      storage_type: dbKey.storage_method || 'supabase_vault',
      has_vault_secret: dbKey.has_vault_secret,
      is_active: dbKey.status === 'active',
      is_working: dbKey.status === 'active' && dbKey.has_vault_secret
    }));

    console.log(`✅ Retrieved ${allKeys.length} total API key statuses from Vault`);
    return allKeys;

  } catch (error) {
    console.error(`❌ Error getting API key statuses from vault:`, error);
    return [];
  }
}

async function refreshApiKeyStatusVault(supabase: any, userId: string, provider: string) {
  console.log(`🔄 Refreshing vault status for ${provider}...`);
  return await validateApiKeyVault(supabase, userId, provider);
}

async function testApiConnectionVault(supabase: any, userId: string, provider: string) {
  console.log(`🌐 Testing vault connection for ${provider}...`);
  return await validateApiKeyVault(supabase, userId, provider);
}

async function deleteApiKeyVault(supabase: any, userId: string, keyId: string, provider: string) {
  console.log(`🗑️ Deleting API key from Vault: ${provider}...`);

  try {
    // Use vault management function to delete the API key
    const { data, error } = await supabase.rpc('manage_api_key_vault', {
      operation: 'delete',
      user_id_param: userId,
      provider_param: provider
    });

    if (error) {
      console.error('❌ Vault deletion failed:', error);
      throw new Error(`Failed to delete API key from vault: ${error.message}`);
    }

    console.log(`✅ Successfully deleted ${provider} API key from Vault`);
    return {
      operation: 'deleted',
      provider,
      vault_secret_id: data.vault_secret_id,
      deleted_at: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Error deleting API key from vault:`, error);
    throw new Error(`Failed to delete API key: ${error.message}`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS (FORMAT VALIDATION & SERVICE TESTING)
// ============================================================================

async function validateApiKeyFormat(provider: string, apiKey: string) {
  console.log(`📝 Validating format for ${provider}...`);

  const patterns = {
    openai: /^sk-[a-zA-Z0-9\-_]{20,}$/,
    anthropic: /^sk-ant-api03-[a-zA-Z0-9_-]{93}$/,
    perplexity: /^pplx-[a-f0-9]{56}$/,
    gemini: /^AIza[0-9A-Za-z_-]{35}$/,
    newsapi: /^[a-f0-9]{32}$/,
    serpapi: /^[a-f0-9]{64}$/,
    mistral: /^[a-zA-Z0-9]{32}$/,
    cohere: /^[a-zA-Z0-9_-]{40}$/
  };

  const pattern = patterns[provider as keyof typeof patterns];
  if (!pattern) {
    return {
      formatCorrect: false,
      error: `Unknown provider: ${provider}`,
      expectedFormat: 'Unknown format'
    };
  }

  const isValid = pattern.test(apiKey);
  return {
    formatCorrect: isValid,
    error: isValid ? null : `Invalid ${provider} API key format`,
    expectedFormat: pattern.toString()
  };
}

async function testApiKeyDirectly(provider: string, apiKey: string) {
  console.log(`🌐 Testing API connection for ${provider}...`);

  try {
    // Add timeout wrapper function
    const withTimeout = (promise: Promise<any>, timeoutMs: number = 10000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
      ]);
    };

    switch (provider) {
      case 'openai':
        const openaiResponse = await withTimeout(
          fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }),
          8000 // 8 second timeout
        );
        
        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          return {
            isValid: true,
            provider,
            details: {
              modelsCount: data.data?.length || 0,
              testEndpoint: '/v1/models'
            }
          };
        } else {
          const errorText = await openaiResponse.text();
          return {
            isValid: false,
            provider,
            error: `OpenAI API error: ${openaiResponse.status} - ${errorText}`
          };
        }

      case 'anthropic':
        const anthropicResponse = await withTimeout(
          fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'test' }]
            })
          }),
          8000 // 8 second timeout
        );
        
        return {
          isValid: anthropicResponse.status !== 401 && anthropicResponse.status !== 403,
          provider,
          details: {
            statusCode: anthropicResponse.status,
            testEndpoint: '/v1/messages'
          },
          error: anthropicResponse.status === 401 || anthropicResponse.status === 403 
            ? `Invalid Anthropic API key: ${anthropicResponse.status}`
            : undefined
        };

      case 'gemini':
        const geminiResponse = await withTimeout(
          fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`),
          8000 // 8 second timeout
        );
        
        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          return {
            isValid: true,
            provider,
            details: {
              modelsCount: data.models?.length || 0,
              testEndpoint: '/v1beta/models'
            }
          };
        } else {
          return {
            isValid: false,
            provider,
            error: `Gemini API error: ${geminiResponse.status}`
          };
        }

      default:
        // For other providers, just validate format
        return {
          isValid: true,
          provider,
          details: {
            note: 'Format validation passed, direct API test not implemented'
          }
        };
    }
  } catch (error) {
    console.error(`❌ API test failed for ${provider}:`, error);
    return {
      isValid: false,
      provider,
      error: `Connection test failed: ${error.message}`
    };
  }
}