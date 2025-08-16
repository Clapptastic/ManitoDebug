/**
 * Database operations for API keys using Supabase Vault
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import type { ApiKeyRecord } from './api-key-types.ts';

/**
 * Create Supabase client with service role
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Save API key using vault storage
 */
export async function saveApiKeyToVault(
  userId: string,
  provider: string,
  apiKey: string
): Promise<ApiKeyRecord> {
  const supabase = createSupabaseClient();

  try {
    // Use the vault storage function
    const { data, error } = await supabase.rpc('manage_api_key_vault', {
      operation: 'save',
      user_id_param: userId,
      provider_param: provider,
      api_key_param: apiKey,
      key_name_param: `${provider}_${userId}_${Date.now()}`
    });

    if (error) {
      console.error('Vault storage error:', error);
      throw new Error(`Failed to save API key: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to save API key to vault');
    }

    // Get the saved record
    const { data: record, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .single();

    if (fetchError) {
      console.error('Error fetching saved record:', fetchError);
      throw new Error('API key saved but failed to retrieve record');
    }

    return record;
  } catch (error) {
    console.error('Error saving API key to vault:', error);
    throw error;
  }
}

/**
 * Get all API keys for user (metadata only)
 */
export async function getAllApiKeys(userId: string): Promise<ApiKeyRecord[]> {
  const supabase = createSupabaseClient();

  try {
    const { data, error } = await supabase.rpc('manage_api_key_vault', {
      operation: 'get_all_statuses',
      user_id_param: userId,
      provider_param: null,
      api_key_param: null,
      key_name_param: null
    });

    if (error) {
      console.error('Error getting API keys:', error);
      throw new Error(`Failed to get API keys: ${error.message}`);
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in getAllApiKeys:', error);
    throw error;
  }
}

/**
 * Delete API key (soft delete)
 */
export async function deleteApiKey(userId: string, keyId: string): Promise<void> {
  const supabase = createSupabaseClient();

  try {
    // First get the provider for the key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('provider')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single();

    if (keyError || !keyData) {
      throw new Error('API key not found');
    }

    // Use vault delete function
    const { data, error } = await supabase.rpc('manage_api_key_vault', {
      operation: 'delete',
      user_id_param: userId,
      provider_param: keyData.provider,
      api_key_param: null,
      key_name_param: null
    });

    if (error) {
      console.error('Vault delete error:', error);
      throw new Error(`Failed to delete API key: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete API key');
    }
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
}

/**
 * Get API key for validation (retrieves from vault)
 */
export async function getApiKeyForValidation(userId: string, provider: string): Promise<string | null> {
  const supabase = createSupabaseClient();

  try {
    // Use vault retrieval function
    const apiKey = await supabase.rpc('vault_retrieve_api_key', {
      p_user_id: userId,
      p_provider: provider
    });

    return apiKey.data || null;
  } catch (error) {
    console.error('Error retrieving API key for validation:', error);
    return null;
  }
}

/**
 * Update API key status after validation
 */
export async function updateApiKeyStatus(
  keyId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  const supabase = createSupabaseClient();

  try {
    const { error } = await supabase
      .from('api_keys')
      .update({
        status,
        error_message: errorMessage,
        last_validated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', keyId);

    if (error) {
      console.error('Error updating API key status:', error);
      throw new Error(`Failed to update API key status: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in updateApiKeyStatus:', error);
    throw error;
  }
}