/**
 * Base API service class providing common functionality for all API services
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status?: number;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export abstract class BaseApiService {
  protected baseUrl: string;
  protected defaultHeaders: Record<string, string>;
  protected timeout: number;

  constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Make an HTTP request
   */
  protected async makeRequest<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestConfig = this.buildRequestConfig(config);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        data,
        success: true,
        status: response.status
      };

    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * GET request
   */
  protected async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'GET',
      headers
    });
  }

  /**
   * POST request
   */
  protected async post<T>(
    endpoint: string, 
    body?: any, 
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body,
      headers
    });
  }

  /**
   * PUT request
   */
  protected async put<T>(
    endpoint: string, 
    body?: any, 
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body,
      headers
    });
  }

  /**
   * DELETE request
   */
  protected async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
      headers
    });
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  /**
   * Build request configuration
   */
  private buildRequestConfig(config: ApiRequestConfig): RequestInit {
    const headers = {
      ...this.defaultHeaders,
      ...config.headers
    };

    const requestConfig: RequestInit = {
      method: config.method || 'GET',
      headers
    };

    if (config.body && config.method !== 'GET') {
      requestConfig.body = typeof config.body === 'string' 
        ? config.body 
        : JSON.stringify(config.body);
    }

    return requestConfig;
  }

  /**
   * Set authorization header
   */
  protected setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization header
   */
  protected removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

/**
 * Generic OpenAI API call function
 */
export async function callOpenAI(endpoint: string, data: any, apiKey: string): Promise<any> {
  const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  return response.json();
}