
export type ApiResponse<T = any> = {
  data: T | null;
  error: ApiError | null;
  success: boolean;
};

export class ApiError extends Error {
  public code: string;
  public status: number;
  
  constructor(message: string, code = 'unknown_error', status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export interface ApiRequestLog {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  timestamp: string;
  userId?: string;
  error?: string;
}

export interface ApiUsageMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  total_tokens_used: number;
  total_cost: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export type ApiProviderType = 'openai' | 'anthropic' | 'cohere' | 'mistral' | 'google' | 'perplexity' | string;
