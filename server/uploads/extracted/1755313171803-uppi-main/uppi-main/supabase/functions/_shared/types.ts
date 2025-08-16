
// API Key Type Enum to match the one in the frontend
export enum ApiKeyTypeEnum {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  PERPLEXITY = 'perplexity',
  COHERE = 'cohere',
  MISTRAL = 'mistral',
  OPENAI_EMBEDDINGS = 'openai_embeddings'
}

// API Status Enum
export enum ApiStatusEnum {
  ACTIVE = 'active',
  PENDING = 'pending',
  ERROR = 'error',
  UNCONFIGURED = 'unconfigured',
  WORKING = 'working',
  INACTIVE = 'inactive'
}

// Competitor status types
export enum CompetitorStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  RUNNING = 'running',
  FAILED = 'failed',
  PROCESSING = 'processing',
  INITIALIZING = 'initializing',
  ERROR = 'error'
}

// Cost tracking interfaces
export interface ApiCostTracker {
  totalTokens: number;
  cost: number;
  requests: number;
}

// Response interfaces
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  success: boolean;
  cost?: number;
  status?: number;
}

// Database types
export interface DbApiKey {
  id: string;
  user_id: string;
  organization_id?: string | null;
  key_type: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  status?: string;
  error_message?: string | null;
}

// API provider configuration
export interface ApiConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Rate limiting configuration
export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  cooldownPeriod: number;
}

export type ApiProviders = Record<string, {
  enabled: boolean;
  config?: ApiConfig;
  rateLimit?: RateLimitConfig;
}>;
