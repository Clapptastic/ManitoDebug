import { useCallback, useMemo } from 'react';

interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
  };
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

class NetworkOptimizer {
  private requestCache: RequestCache = {};
  private readonly CACHE_DURATION = 5000; // 5 seconds
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  /**
   * Deduplicate identical requests within cache duration
   */
  deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = this.requestCache[key];

    // Return cached promise if still valid
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.promise;
    }

    // Create new request and cache it
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      delete this.requestCache[key];
    });

    this.requestCache[key] = {
      promise,
      timestamp: now
    };

    return promise;
  }

  /**
   * Retry failed requests with exponential backoff
   */
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const { maxRetries, baseDelay, maxDelay, backoffFactor } = {
      ...this.DEFAULT_RETRY_CONFIG,
      ...config
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on client errors (4xx)
        if (this.isClientError(error)) {
          throw lastError;
        }

        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );

        console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, lastError.message);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Batch multiple requests and execute them together
   */
  async batchRequests<T>(
    requests: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(request => request())
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch request failed:', result.reason);
          throw result.reason;
        }
      }

      // Small delay between batches to avoid overwhelming the server
      if (i + batchSize < requests.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  /**
   * Optimize payload size by removing unnecessary data
   */
  optimizePayload(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.optimizePayload(item));
    }

    if (typeof data === 'object') {
      const optimized: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Skip undefined, null, empty strings, and empty objects/arrays
        if (value === undefined || value === null) continue;
        if (value === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;
        if (typeof value === 'object' && Object.keys(value).length === 0) continue;

        optimized[key] = this.optimizePayload(value);
      }

      return optimized;
    }

    return data;
  }

  /**
   * Create a request queue for managing concurrent requests
   */
  createRequestQueue(concurrencyLimit: number = 3) {
    let running = 0;
    const queue: Array<() => void> = [];

    return async <T>(requestFn: () => Promise<T>): Promise<T> => {
      return new Promise((resolve, reject) => {
        const execute = async () => {
          running++;
          try {
            const result = await requestFn();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            running--;
            if (queue.length > 0) {
              const next = queue.shift()!;
              next();
            }
          }
        };

        if (running < concurrencyLimit) {
          execute();
        } else {
          queue.push(execute);
        }
      });
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    Object.keys(this.requestCache).forEach(key => {
      const cached = this.requestCache[key];
      if (cached && (now - cached.timestamp) >= this.CACHE_DURATION) {
        delete this.requestCache[key];
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isClientError(error: any): boolean {
    return error?.response?.status >= 400 && error?.response?.status < 500;
  }
}

// Singleton instance
export const networkOptimizer = new NetworkOptimizer();

/**
 * React hook for optimized network requests
 */
export function useNetworkOptimizer() {
  const deduplicateRequest = useCallback(
    <T>(key: string, requestFn: () => Promise<T>) => 
      networkOptimizer.deduplicateRequest(key, requestFn),
    []
  );

  const retryRequest = useCallback(
    <T>(requestFn: () => Promise<T>, config?: Partial<RetryConfig>) =>
      networkOptimizer.retryRequest(requestFn, config),
    []
  );

  const batchRequests = useCallback(
    <T>(requests: Array<() => Promise<T>>, batchSize?: number) =>
      networkOptimizer.batchRequests(requests, batchSize),
    []
  );

  const optimizePayload = useCallback(
    (data: any) => networkOptimizer.optimizePayload(data),
    []
  );

  const requestQueue = useMemo(
    () => networkOptimizer.createRequestQueue(),
    []
  );

  return {
    deduplicateRequest,
    retryRequest,
    batchRequests,
    optimizePayload,
    requestQueue
  };
}

export default networkOptimizer;