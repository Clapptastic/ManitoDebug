/**
 * Database Query Optimization Utilities
 * 
 * Provides standardized patterns for:
 * - Consistent error handling
 * - Query caching
 * - Retry mechanisms
 * - Performance monitoring
 * - RLS policy optimization
 */

import { supabase } from '@/integrations/supabase/client';
import { standardErrorHandler } from '@/utils/errorHandling/standardErrorHandler';

export interface QueryConfig {
  cacheTTL?: number;
  retryCount?: number;
  timeout?: number;
  logQuery?: boolean;
}

export interface QueryResult<T> {
  data: T | null;
  error: any;
  success: boolean;
  fromCache?: boolean;
  executionTime?: number;
}

class DatabaseQueryOptimizer {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private queryMetrics: Map<string, { count: number; avgTime: number; errors: number }> = new Map();

  /**
   * Execute optimized SELECT query with caching and error handling
   */
  async select<T>(
    table: string,
    columns: string = '*',
    filters?: Record<string, any>,
    config: QueryConfig = {}
  ): Promise<QueryResult<T[]>> {
    const startTime = Date.now();
    const queryKey = this.generateQueryKey('SELECT', table, columns, filters);
    
    // Check cache first
    if (config.cacheTTL && this.isCacheValid(queryKey)) {
      const cached = this.cache.get(queryKey);
      return {
        data: cached?.data || null,
        error: null,
        success: true,
        fromCache: true,
        executionTime: 0
      };
    }

    try {
      let query = (supabase as any).from(table).select(columns);
      
      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'object' && value.operator) {
              // Support for custom operators like { operator: 'gte', value: 10 }
              query = (query as any)[value.operator](key, value.value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      const { data, error } = await query;
      const executionTime = Date.now() - startTime;

      if (error) {
        this.recordMetrics(queryKey, executionTime, true);
        const standardError = standardErrorHandler.handleError(error, 'database');
        return {
          data: null,
          error: standardError,
          success: false,
          executionTime
        };
      }

      // Cache successful results
      if (config.cacheTTL && data) {
        this.cache.set(queryKey, {
          data,
          timestamp: Date.now(),
          ttl: config.cacheTTL
        });
      }

      this.recordMetrics(queryKey, executionTime, false);

      return {
        data: data as T[],
        error: null,
        success: true,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordMetrics(queryKey, executionTime, true);
      
      const standardError = standardErrorHandler.handleError(error, 'database');
      return {
        data: null,
        error: standardError,
        success: false,
        executionTime
      };
    }
  }

  /**
   * Execute optimized INSERT with proper error handling
   */
  async insert<T>(
    table: string,
    data: any | any[],
    config: QueryConfig = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const queryKey = this.generateQueryKey('INSERT', table, '*', data);

    try {
      // Ensure user authentication for inserts
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required for insert operations');
      }

      // Add user_id if not present and if the table likely needs it
      const insertData = Array.isArray(data) 
        ? data.map(item => this.addUserIdIfNeeded(item, user.id, table))
        : this.addUserIdIfNeeded(data, user.id, table);

      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(insertData)
        .select()
        .single();

      const executionTime = Date.now() - startTime;

      if (error) {
        this.recordMetrics(queryKey, executionTime, true);
        const standardError = standardErrorHandler.handleError(error, 'database');
        return {
          data: null,
          error: standardError,
          success: false,
          executionTime
        };
      }

      this.recordMetrics(queryKey, executionTime, false);
      this.invalidateTableCache(table);

      return {
        data: result as T,
        error: null,
        success: true,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordMetrics(queryKey, executionTime, true);
      
      const standardError = standardErrorHandler.handleError(error, 'database');
      return {
        data: null,
        error: standardError,
        success: false,
        executionTime
      };
    }
  }

  /**
   * Execute optimized UPDATE with proper error handling
   */
  async update<T>(
    table: string,
    data: any,
    filters: Record<string, any>,
    config: QueryConfig = {}
  ): Promise<QueryResult<T[]>> {
    const startTime = Date.now();
    const queryKey = this.generateQueryKey('UPDATE', table, '*', { data, filters });

    try {
      // Ensure user authentication for updates
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required for update operations');
      }

      let query = (supabase as any).from(table).update(data);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data: result, error } = await query.select();
      const executionTime = Date.now() - startTime;

      if (error) {
        this.recordMetrics(queryKey, executionTime, true);
        const standardError = standardErrorHandler.handleError(error, 'database');
        return {
          data: null,
          error: standardError,
          success: false,
          executionTime
        };
      }

      this.recordMetrics(queryKey, executionTime, false);
      this.invalidateTableCache(table);

      return {
        data: result as T[],
        error: null,
        success: true,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordMetrics(queryKey, executionTime, true);
      
      const standardError = standardErrorHandler.handleError(error, 'database');
      return {
        data: null,
        error: standardError,
        success: false,
        executionTime
      };
    }
  }

  /**
   * Execute optimized DELETE with proper error handling
   */
  async delete<T>(
    table: string,
    filters: Record<string, any>,
    config: QueryConfig = {}
  ): Promise<QueryResult<T[]>> {
    const startTime = Date.now();
    const queryKey = this.generateQueryKey('DELETE', table, '*', filters);

    try {
      // Ensure user authentication for deletes
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required for delete operations');
      }

      let query = (supabase as any).from(table).delete();
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data: result, error } = await query.select();
      const executionTime = Date.now() - startTime;

      if (error) {
        this.recordMetrics(queryKey, executionTime, true);
        const standardError = standardErrorHandler.handleError(error, 'database');
        return {
          data: null,
          error: standardError,
          success: false,
          executionTime
        };
      }

      this.recordMetrics(queryKey, executionTime, false);
      this.invalidateTableCache(table);

      return {
        data: result as T[],
        error: null,
        success: true,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordMetrics(queryKey, executionTime, true);
      
      const standardError = standardErrorHandler.handleError(error, 'database');
      return {
        data: null,
        error: standardError,
        success: false,
        executionTime
      };
    }
  }

  /**
   * Execute RLS-aware query with user context
   */
  async selectUserData<T>(
    table: string,
    columns: string = '*',
    additionalFilters?: Record<string, any>,
    config: QueryConfig = {}
  ): Promise<QueryResult<T[]>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: null,
        error: standardErrorHandler.handleError(
          'Authentication required',
          'authentication'
        ),
        success: false
      };
    }

    const filters = {
      user_id: user.id,
      ...additionalFilters
    };

    return this.select<T>(table, columns, filters, config);
  }

  /**
   * Generate cache key for queries
   */
  private generateQueryKey(
    operation: string,
    table: string,
    columns: string,
    params?: any
  ): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${operation}:${table}:${columns}:${paramsStr}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * Invalidate cache for a specific table
   */
  private invalidateTableCache(table: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(`:${table}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Add user_id to data if the table needs it
   */
  private addUserIdIfNeeded(data: any, userId: string, table: string): any {
    // Tables that typically need user_id
    const userTables = [
      'competitor_analyses',
      'api_keys',
      'documents',
      'profiles',
      'competitor_groups'
    ];

    if (userTables.includes(table) && !data.user_id) {
      return { ...data, user_id: userId };
    }

    return data;
  }

  /**
   * Record query metrics for monitoring
   */
  private recordMetrics(queryKey: string, executionTime: number, hasError: boolean): void {
    const existing = this.queryMetrics.get(queryKey) || { count: 0, avgTime: 0, errors: 0 };
    
    const newCount = existing.count + 1;
    const newAvgTime = (existing.avgTime * existing.count + executionTime) / newCount;
    const newErrors = existing.errors + (hasError ? 1 : 0);

    this.queryMetrics.set(queryKey, {
      count: newCount,
      avgTime: newAvgTime,
      errors: newErrors
    });
  }

  /**
   * Get query performance metrics
   */
  getQueryMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    this.queryMetrics.forEach((value, key) => {
      metrics[key] = {
        ...value,
        errorRate: value.count > 0 ? (value.errors / value.count) * 100 : 0
      };
    });

    return metrics;
  }

  /**
   * Clear cache and metrics
   */
  clearCache(): void {
    this.cache.clear();
    this.queryMetrics.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This is a simplified version - in a real implementation you'd track hits/misses
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to implement hit/miss tracking
    };
  }
}

// Export singleton instance
export const dbQueryOptimizer = new DatabaseQueryOptimizer();
export default dbQueryOptimizer;