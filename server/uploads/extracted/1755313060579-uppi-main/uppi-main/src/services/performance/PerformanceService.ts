import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling } from '@/utils/errorReporting';

interface QueryOptimizationConfig {
  enableIndexHints?: boolean;
  batchSize?: number;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Performance optimization service for database queries and API calls
 * Implements caching, query optimization, and performance monitoring
 */
class PerformanceService {
  private cache = new Map<string, { data: any; expires: number }>();
  private defaultCacheTime = 5 * 60 * 1000; // 5 minutes

  /**
   * Optimized database query with caching and performance monitoring
   */
  async optimizedQuery<T>(
    queryBuilder: () => Promise<{ data: T | null; error: any }>,
    cacheKey: string,
    config: QueryOptimizationConfig = {}
  ): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
    const startTime = performance.now();

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      const duration = performance.now() - startTime;
      this.logPerformanceMetric('cache_hit', duration, { cacheKey });
      return { data: cached.data, error: null, fromCache: true };
    }

    // Execute query with error handling
    const result = await withErrorHandling(
      async () => {
        const queryResult = await queryBuilder();
        
        // Cache successful results
        if (!queryResult.error && queryResult.data) {
          this.cache.set(cacheKey, {
            data: queryResult.data,
            expires: Date.now() + (config.timeout || this.defaultCacheTime)
          });
        }
        
        return queryResult;
      },
      { 
        component: 'PerformanceService',
        action: 'optimized_query',
        metadata: { cacheKey, config }
      }
    );

    const duration = performance.now() - startTime;
    this.logPerformanceMetric('database_query', duration, { 
      cacheKey, 
      cached: false,
      hasError: !!result?.error 
    });

    return result || { data: null, error: 'Query failed' };
  }

  /**
   * Batch processing for multiple operations
   */
  async batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    const batches = this.chunkArray(items, batchSize);

    for (const batch of batches) {
      const startTime = performance.now();
      const batchResults = await withErrorHandling(
        () => processor(batch),
        {
          component: 'PerformanceService',
          action: 'batch_process',
          metadata: { batchSize: batch.length }
        }
      );

      if (batchResults) {
        results.push(...batchResults);
      }

      const duration = performance.now() - startTime;
      this.logPerformanceMetric('batch_processing', duration, {
        batchSize: batch.length,
        totalItems: items.length
      });

      // Small delay to prevent overwhelming the system
      await this.delay(10);
    }

    return results;
  }

   /**
    * Preload data for critical user flows
    */
   async preloadCriticalData(userId: string): Promise<void> {
     const preloadTasks = [
       // Preload user API keys
       () => this.optimizedQuery(
         async () => {
           const result = await supabase.rpc('manage_api_key', {
             operation: 'select',
             user_id_param: userId
           });
           return { data: result.data, error: result.error };
         },
         `api_keys_${userId}`
       ),
       
       // Preload recent analyses
       () => this.optimizedQuery(
         async () => {
           const result = await supabase.rpc('get_user_competitor_analyses', { 
             user_id_param: userId 
           });
           return { data: result.data, error: result.error };
         },
         `analyses_${userId}`
       ),

       // Preload user settings
       () => this.optimizedQuery(
         async () => {
           const result = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
           return { data: result.data, error: result.error };
         },
         `profile_${userId}`
       )
     ];

     // Execute preload tasks in parallel
     await Promise.allSettled(preloadTasks.map(task => task()));
   }

  /**
   * Clear cache for specific keys or patterns
   */
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logPerformanceMetric(
    metricName: string, 
    duration: number, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Log to performance monitor edge function
      await supabase.functions.invoke('performance-monitor', {
        body: {
          metric_name: metricName,
          value: duration,
          timestamp: new Date().toISOString(),
          metadata: {
            page: window.location.pathname,
            userAgent: navigator.userAgent.substring(0, 100),
            ...metadata
          }
        }
      });
    } catch (error) {
      // Don't let performance logging interfere with main functionality
      console.warn('Failed to log performance metric:', error);
    }
  }
}

export const performanceService = new PerformanceService();
export default performanceService;