/**
 * Shared types for API key management
 */

export interface ApiKeyValidationResult {
  isValid: boolean;
  provider: string;
  error?: string;
  details?: {
    responseTime?: number;
    statusCode?: number;
    endpoint?: string;
    modelsCount?: number;
  };
}

export interface ApiKeyRequest {
  action: 'save' | 'validate' | 'get_all' | 'delete' | 'get_statuses';
  provider?: string;
  apiKey?: string;
  keyId?: string;
}

export interface ApiKeyResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  provider: string;
  masked_key: string;
  status: string;
  is_active: boolean;
  last_validated?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export interface ProviderStatus {
  provider: string;
  status: 'active' | 'error' | 'pending' | 'unconfigured';
  isWorking: boolean;
  exists: boolean;
  lastChecked: string;
  errorMessage?: string;
  maskedKey?: string;
}