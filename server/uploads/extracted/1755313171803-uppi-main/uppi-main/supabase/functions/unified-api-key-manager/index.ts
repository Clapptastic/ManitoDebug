/**
 * Unified API Key Manager - Edge Function
 * Provides centralized API key management operations
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers inline to avoid import issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

interface RequestBody {
  action: 'get_all_statuses' | 'get_statuses' | 'get_all' | 'decrypt' | 'save' | 'delete' | 'validate';
  provider?: string;
  user_id?: string;
  apiKey?: string;
  keyId?: string;
}

serve(async (req: Request) => {
  console.log(`[unified-api-key-manager] ${req.method} request received`);
  
  // Handle CORS preflight requests FIRST
  if (req.method === 'OPTIONS') {
    console.log('[unified-api-key-manager] Handling OPTIONS request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    console.log('[unified-api-key-manager] Processing request');
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Create Supabase client with the user's JWT
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { action, provider, apiKey, keyId } = body;

    let result;

    switch (action) {
      case 'get_all_statuses':
      case 'get_statuses':
        result = await getProviderStatuses(supabase, user.id);
        break;

      case 'get_all':
        result = await getAllApiKeys(supabase, user.id);
        break;

      case 'decrypt':
        if (!provider) {
          throw new Error('Provider is required for decrypt action');
        }
        result = await decryptApiKey(supabase, user.id, provider);
        break;

      case 'save':
        if (!provider || !apiKey) {
          throw new Error('Provider and apiKey are required for save action');
        }
        result = await saveApiKey(supabase, user.id, provider, apiKey);
        break;

      case 'delete':
        if (!keyId) {
          throw new Error('Key ID is required for delete action');
        }
        result = await deleteApiKey(supabase, user.id, keyId);
        break;

      case 'validate':
        if (!provider) {
          throw new Error('Provider is required for validate action');
        }
        result = await validateApiKey(supabase, user.id, provider);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[unified-api-key-manager] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

/**
 * Get all API keys for a user
 */
async function getAllApiKeys(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc('get_user_api_keys_safe', {
    user_id_param: userId
  });

  if (error) {
    console.error('Error fetching API keys:', error);
    throw new Error('Failed to fetch API keys');
  }

  return data || [];
}

/**
 * Get provider statuses
 */
async function getProviderStatuses(supabase: any, userId: string) {
  const apiKeys = await getAllApiKeys(supabase, userId);
  const statuses: Record<string, any> = {};

  for (const key of apiKeys) {
    statuses[key.provider] = {
      status: key.status,
      isWorking: key.is_active && key.status === 'active',
      exists: true,
      lastChecked: key.last_validated,
      errorMessage: key.error_message,
      isActive: key.is_active,
      isConfigured: true,
      maskedKey: key.masked_key
    };
  }

  return statuses;
}

/**
 * Save an API key
 */
async function saveApiKey(supabase: any, userId: string, provider: string, apiKey: string) {
  try {
    const keyName = `${provider}-key-${Date.now()}`;
    
    const { data, error } = await supabase.rpc('vault_store_api_key', {
      p_user_id: userId,
      p_provider: provider,
      p_api_key: apiKey,
      p_key_name: keyName
    });

    if (error) {
      throw new Error(`Failed to save API key: ${error.message}`);
    }

    return { success: true, id: data };
  } catch (error) {
    console.error(`Error saving API key for ${provider}:`, error);
    throw error;
  }
}

/**
 * Delete an API key
 */
async function deleteApiKey(supabase: any, userId: string, keyId: string) {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ 
        is_active: false, 
        status: 'deleted', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
}

/**
 * Validate an API key
 */
async function validateApiKey(supabase: any, userId: string, provider: string) {
  try {
    // First get the API key
    const decrypted = await decryptApiKey(supabase, userId, provider);
    
    if (!decrypted.apiKey) {
      return { valid: false, error: 'No API key found' };
    }

    // Update last_validated timestamp
    const { error } = await supabase
      .from('api_keys')
      .update({ 
        last_validated: new Date().toISOString(),
        status: 'active'
      })
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true);

    if (error) {
      console.error('Error updating validation timestamp:', error);
    }

    return { valid: true, provider };
  } catch (error) {
    console.error(`Error validating API key for ${provider}:`, error);
    return { valid: false, error: error.message };
  }
}

/**
 * Decrypt an API key for a specific provider
 */
async function decryptApiKey(supabase: any, userId: string, provider: string) {
  try {
    // First check if the user has this API key
    const { data: keyExists, error: checkError } = await supabase
      .from('api_keys')
      .select('id, masked_key, vault_secret_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (checkError || !keyExists) {
      throw new Error(`No active API key found for provider: ${provider}`);
    }

    // Try to get the decrypted key using the vault function
    const { data: apiKey, error: decryptError } = await supabase.rpc('vault_retrieve_api_key', {
      p_user_id: userId,
      p_provider: provider
    });

    if (decryptError) {
      throw new Error(`Failed to decrypt API key: ${decryptError.message}`);
    }
    
    if (!apiKey) {
      throw new Error('API key not found or could not be decrypted');
    }

    return {
      apiKey,
      provider,
      masked_key: keyExists.masked_key
    };

  } catch (error) {
    console.error(`Error decrypting API key for ${provider}:`, error);
    throw error;
  }
}