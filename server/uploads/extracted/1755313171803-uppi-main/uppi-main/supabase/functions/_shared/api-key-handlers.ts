/**
 * Action handlers for API key operations
 */

import { validateApiKey } from './api-key-validators.ts';
import {
  saveApiKeyToVault,
  getAllApiKeys,
  deleteApiKey,
  getApiKeyForValidation,
  updateApiKeyStatus
} from './api-key-database.ts';
import type { ApiKeyRequest, ApiKeyResponse, ProviderStatus } from './api-key-types.ts';

/**
 * Handle save API key action
 */
export async function handleSaveApiKey(
  userId: string,
  request: ApiKeyRequest
): Promise<ApiKeyResponse> {
  const { provider, apiKey } = request;

  if (!provider || !apiKey) {
    return {
      success: false,
      error: 'Provider and API key are required',
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Validate the API key first
    const validationResult = await validateApiKey(provider, apiKey);
    
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error || `Invalid ${provider} API key`,
        timestamp: new Date().toISOString()
      };
    }

    // Save to vault
    const savedKey = await saveApiKeyToVault(userId, provider, apiKey);

    return {
      success: true,
      data: {
        id: savedKey.id,
        provider: savedKey.provider,
        masked_key: savedKey.masked_key,
        status: savedKey.status,
        validation: validationResult
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error saving API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save API key',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Handle validate API key action
 */
export async function handleValidateApiKey(
  userId: string,
  request: ApiKeyRequest
): Promise<ApiKeyResponse> {
  const { provider, apiKey } = request;

  if (!provider) {
    return {
      success: false,
      error: 'Provider is required',
      timestamp: new Date().toISOString()
    };
  }

  try {
    let keyToValidate = apiKey;

    // If no key provided, get from vault
    if (!keyToValidate) {
      keyToValidate = await getApiKeyForValidation(userId, provider);
      if (!keyToValidate) {
        return {
          success: false,
          error: `No API key found for ${provider}`,
          timestamp: new Date().toISOString()
        };
      }
    }

    const validationResult = await validateApiKey(provider, keyToValidate);

    // Update status in database if this is a stored key
    if (!apiKey) {
      const keys = await getAllApiKeys(userId);
      const existingKey = keys.find(k => k.provider === provider && k.is_active);
      if (existingKey) {
        await updateApiKeyStatus(
          existingKey.id,
          validationResult.isValid ? 'active' : 'error',
          validationResult.error
        );
      }
    }

    return {
      success: true,
      data: validationResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate API key',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Handle get all API keys action
 */
export async function handleGetAllApiKeys(
  userId: string,
  request: ApiKeyRequest
): Promise<ApiKeyResponse> {
  try {
    const keys = await getAllApiKeys(userId);

    // Never include actual API keys in response
    const safeKeys = keys.map(key => ({
      id: key.id,
      provider: key.provider,
      masked_key: key.masked_key,
      status: key.status,
      is_active: key.is_active,
      last_validated: key.last_validated,
      created_at: key.created_at,
      updated_at: key.updated_at,
      error_message: key.error_message
    }));

    return {
      success: true,
      data: safeKeys,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting API keys:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get API keys',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Handle delete API key action
 */
export async function handleDeleteApiKey(
  userId: string,
  request: ApiKeyRequest
): Promise<ApiKeyResponse> {
  const { keyId } = request;

  if (!keyId) {
    return {
      success: false,
      error: 'Key ID is required',
      timestamp: new Date().toISOString()
    };
  }

  try {
    await deleteApiKey(userId, keyId);

    return {
      success: true,
      data: { message: 'API key deleted successfully' },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error deleting API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete API key',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Handle get provider statuses action
 */
export async function handleGetProviderStatuses(
  userId: string,
  request: ApiKeyRequest
): Promise<ApiKeyResponse> {
  try {
    const keys = await getAllApiKeys(userId);
    const statuses: Record<string, ProviderStatus> = {};

    // Validate all active keys in parallel
    const validationPromises = keys
      .filter(key => key.is_active)
      .map(async (key) => {
        try {
          const apiKeyValue = await getApiKeyForValidation(userId, key.provider);
          if (apiKeyValue) {
            const result = await validateApiKey(key.provider, apiKeyValue);
            
            // Update database status
            await updateApiKeyStatus(
              key.id,
              result.isValid ? 'active' : 'error',
              result.error
            );

            statuses[key.provider] = {
              provider: key.provider,
              status: result.isValid ? 'active' : 'error',
              isWorking: result.isValid,
              exists: true,
              lastChecked: new Date().toISOString(),
              errorMessage: result.error,
              maskedKey: key.masked_key
            };
          } else {
            statuses[key.provider] = {
              provider: key.provider,
              status: 'error',
              isWorking: false,
              exists: false,
              lastChecked: new Date().toISOString(),
              errorMessage: 'API key not found in vault'
            };
          }
        } catch (error) {
          console.error(`Error validating ${key.provider}:`, error);
          statuses[key.provider] = {
            provider: key.provider,
            status: 'error',
            isWorking: false,
            exists: true,
            lastChecked: new Date().toISOString(),
            errorMessage: error instanceof Error ? error.message : 'Validation failed'
          };
        }
      });

    await Promise.allSettled(validationPromises);

    return {
      success: true,
      data: statuses,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting provider statuses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider statuses',
      timestamp: new Date().toISOString()
    };
  }
}