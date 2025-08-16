/**
 * Unified API Key Types
 */

export type ApiKeyType = 
  | 'openai' 
  | 'anthropic' 
  | 'google' 
  | 'gemini'
  | 'mistral'
  | 'cohere'
  | 'perplexity'
  | 'newsapi'
  | 'serpapi'
  | 'bing'
  | 'azure'
  | 'huggingface'
  | 'groq'
  | 'alphavantage';

// Legacy compatibility
export enum ApiKeyTypeEnum {
  openai = 'openai',
  anthropic = 'anthropic',
  google = 'google',
  gemini = 'gemini',
  mistral = 'mistral',
  cohere = 'cohere',
  perplexity = 'perplexity',
  newsapi = 'newsapi',
  serpapi = 'serpapi',
  bing = 'bing',
  azure = 'azure',
  huggingface = 'huggingface',
  groq = 'groq',
  alphavantage = 'alphavantage'
}

export interface ApiKey {
  id: string;
  user_id: string;
  provider: ApiKeyType;
  name: string;
  masked_key: string;
  status: 'active' | 'inactive' | 'error' | 'deleted';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_validated: Date | null;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  usage_count: number;
  metadata: Record<string, any>;
  api_key?: string; // Legacy field for backward compatibility
}

export interface ApiKeyStatus {
  status: 'active' | 'inactive' | 'error' | 'unconfigured' | 'pending' | 'operational' | 'down' | 'degraded';
  isWorking: boolean;
  exists: boolean;
  lastChecked: string | null;
  errorMessage: string | null;
  isActive: boolean;
  isConfigured: boolean;
  maskedKey?: string;
}

export interface ApiStatusInfo extends ApiKeyStatus {
  provider: ApiKeyType;
  responseTime?: number;
  name?: string;
}

export interface ApiProviderStatusInfo extends ApiKeyStatus {
  provider: ApiKeyType;
  name: string;
}

// API Providers constant
export const API_PROVIDERS: Record<ApiKeyType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  gemini: 'Gemini',
  mistral: 'Mistral',
  cohere: 'Cohere',
  perplexity: 'Perplexity',
  newsapi: 'NewsAPI',
  serpapi: 'SerpAPI',
  bing: 'Bing',
  azure: 'Azure',
  huggingface: 'Hugging Face',
  groq: 'Groq',
  alphavantage: 'AlphaVantage'
};

// Array version for iteration
export const API_PROVIDERS_ARRAY: Array<{ key: ApiKeyType; name: string }> = Object.entries(API_PROVIDERS).map(([key, name]) => ({
  key: key as ApiKeyType,
  name
}));

// Operations interface
export interface ApiKeyOperations {
  save: (provider: string, apiKey: string) => Promise<void>;
  delete: (keyId: string) => Promise<void>;
  validate: (provider: string) => Promise<boolean>;
  getAll: () => Promise<ApiKey[]>;
  getStatuses: () => Promise<Record<string, ApiKeyStatus>>;
}