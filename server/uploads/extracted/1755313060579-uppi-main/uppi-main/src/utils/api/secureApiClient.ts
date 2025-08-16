/**
 * Secure API Client with comprehensive security features
 * Includes CSRF protection, input sanitization, rate limiting, and error handling
 */

import { sanitizeObject, sanitizeString, sanitizeUrl } from '../security/inputSanitizer';
import { addCSRFHeaders, csrfFetch } from '../security/csrfProtection';
import { sanitizeErrorForProduction, withProductionErrorHandling } from '../security/productionErrorHandler';

interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
  sanitizeInput?: boolean;
  csrfProtection?: boolean;
  rateLimitCheck?: boolean;
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  skipSanitization?: boolean;
  skipCSRF?: boolean;
  skipRateLimit?: boolean;
  rateLimitOperation?: string;
}

class SecureApiClient {
  private baseUrl: string;
  private defaultOptions: ApiClientOptions;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultOptions = {
      timeout: 30000,
      retries: 3,
      validateResponse: true,
      sanitizeInput: true,
      csrfProtection: true,
      rateLimitCheck: true,
      ...options,
    };
  }

  /**
   * Check server-side rate limit before making request
   */
  private async checkRateLimit(operation: string, identifier?: string): Promise<boolean> {
    try {
      const response = await fetch('/functions/v1/server-rate-limiter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('supabase.auth.token') && {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          }),
        },
        body: JSON.stringify({
          operation,
          identifier: identifier || `client_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before trying again.');
        }
        // If rate limiter is down, allow request (fail open)
        console.warn('Rate limiter unavailable, allowing request');
        return true;
      }

      const data = await response.json();
      return data.allowed;
    } catch (error) {
      // Fail open - if rate limiter is unavailable, allow request
      console.warn('Rate limit check failed:', error);
      return true;
    }
  }

  /**
   * Sanitize request data
   */
  private sanitizeRequestData(data: any): any {
    if (!this.defaultOptions.sanitizeInput) {
      return data;
    }

    if (typeof data === 'string') {
      return sanitizeString(data, 'FORM_INPUT');
    }

    if (typeof data === 'object' && data !== null) {
      return sanitizeObject(data, 'FORM_INPUT');
    }

    return data;
  }

  /**
   * Add security headers to request
   */
  private addSecurityHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const secureHeaders = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      ...headers,
    };

    // Add CSRF protection if enabled
    if (this.defaultOptions.csrfProtection) {
      return addCSRFHeaders(secureHeaders);
    }

    return secureHeaders;
  }

  /**
   * Validate response data
   */
  private validateResponse(response: Response, data: any): void {
    if (!this.defaultOptions.validateResponse) {
      return;
    }

    // Check for suspicious content
    if (typeof data === 'string') {
      if (data.includes('<script') || data.includes('javascript:')) {
        throw new Error('Response contains potentially malicious content');
      }
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/')) {
      console.warn('Unexpected content type:', contentType);
    }
  }

  /**
   * Make a secure HTTP request
   */
  private async makeRequest<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return withProductionErrorHandling(async () => {
      const {
        timeout = this.defaultOptions.timeout,
        retries = this.defaultOptions.retries,
        skipSanitization = false,
        skipCSRF = false,
        skipRateLimit = false,
        rateLimitOperation = 'api-call',
        body,
        headers = {},
        ...fetchOptions
      } = options;

      // Sanitize URL
      const sanitizedUrl = sanitizeUrl(`${this.baseUrl}${url}`);
      if (!sanitizedUrl) {
        throw new Error('Invalid URL provided');
      }

      // Check rate limit
      if (!skipRateLimit && this.defaultOptions.rateLimitCheck) {
        const allowed = await this.checkRateLimit(rateLimitOperation);
        if (!allowed) {
          throw new Error('Rate limit exceeded. Please wait before trying again.');
        }
      }

      // Sanitize request body
      let sanitizedBody = body;
      if (body && !skipSanitization) {
        if (typeof body === 'string') {
          try {
            const parsed = JSON.parse(body);
            sanitizedBody = JSON.stringify(this.sanitizeRequestData(parsed));
          } catch {
            sanitizedBody = sanitizeString(body, 'FORM_INPUT');
          }
        } else {
          sanitizedBody = JSON.stringify(this.sanitizeRequestData(body));
        }
      }

      // Prepare headers
      const secureHeaders = skipCSRF 
        ? { ...headers }
        : this.addSecurityHeaders(headers as Record<string, string>);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let lastError: Error;
      let attempt = 0;

      while (attempt < retries!) {
        try {
          const response = skipCSRF && this.defaultOptions.csrfProtection
            ? await fetch(sanitizedUrl, {
                ...fetchOptions,
                headers: secureHeaders,
                body: sanitizedBody,
                signal: controller.signal,
              })
            : await csrfFetch(sanitizedUrl, {
                ...fetchOptions,
                headers: secureHeaders,
                body: sanitizedBody,
                signal: controller.signal,
              });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          this.validateResponse(response, data);

          return data;
        } catch (error) {
          lastError = error as Error;
          attempt++;

          if (attempt < retries!) {
            // Exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      clearTimeout(timeoutId);
      throw lastError!;
    });
  }

  /**
   * GET request
   */
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'GET',
      rateLimitOperation: options.rateLimitOperation || 'api-get',
    });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      rateLimitOperation: options.rateLimitOperation || 'api-post',
    });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      rateLimitOperation: options.rateLimitOperation || 'api-put',
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'DELETE',
      rateLimitOperation: options.rateLimitOperation || 'api-delete',
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      rateLimitOperation: options.rateLimitOperation || 'api-patch',
    });
  }
}

/**
 * Default secure API client instance
 */
export const secureApi = new SecureApiClient({
  baseUrl: '/functions/v1',
  timeout: 30000,
  retries: 3,
  validateResponse: true,
  sanitizeInput: true,
  csrfProtection: true,
  rateLimitCheck: true,
});

/**
 * Create a new secure API client with custom options
 */
export function createSecureApiClient(options: ApiClientOptions): SecureApiClient {
  return new SecureApiClient(options);
}

export { SecureApiClient };