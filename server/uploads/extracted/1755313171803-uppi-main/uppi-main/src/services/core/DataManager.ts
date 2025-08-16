/**
 * Unified Data Management Service
 * Consolidates all data fetching, caching, and real-time functionality
 * Single source of truth for data operations across the application
 */

import { supabase } from '@/integrations/supabase/client';
import { errorManager } from './ErrorManager';
import { cacheManager } from './CacheManager';
import { subscriptionManager } from './SubscriptionManager';

// Data Management Types
export type ValidTableName = 
  | 'api_keys' 
  | 'competitor_analyses' 
  | 'competitor_analysis_progress'
  | 'profiles' 
  | 'organizations' 
  | 'code_embeddings' 
  | 'competitor_group_entries' 
  | 'competitor_groups' 
  | 'documentation' 
  | 'edge_function_metrics' 
  | 'embeddings_status' 
  | 'query_metrics' 
  | 'system_components'
  | 'error_logs'
  | 'performance_metrics'
  | 'chat_sessions'
  | 'chat_messages'
  | 'documents';

export interface DataFetchOptions {
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  single?: boolean;
}

// CacheEntry now handled by CacheManager

export interface DataOperations {
  // Core data fetching
  fetchData<T = any>(table: ValidTableName, options?: DataFetchOptions): Promise<T[]>;
  fetchSingle<T = any>(table: ValidTableName, id: string, options?: DataFetchOptions): Promise<T | null>;
  
  // Data mutations
  insertData<T = any>(table: ValidTableName, data: Partial<T>): Promise<T>;
  updateData<T = any>(table: ValidTableName, id: string, data: Partial<T>): Promise<T>;
  deleteData(table: ValidTableName, id: string): Promise<void>;
  
  // Batch operations
  batchInsert<T = any>(table: ValidTableName, data: Partial<T>[]): Promise<T[]>;
  batchUpdate<T = any>(table: ValidTableName, updates: { id: string; data: Partial<T> }[]): Promise<T[]>;
  batchDelete(table: ValidTableName, ids: string[]): Promise<void>;
  
  // Caching
  getCached<T = any>(key: string): T | null;
  setCached<T = any>(key: string, data: T, ttl?: number): void;
  clearCache(key?: string): void;
  
  // Real-time subscriptions
  subscribe<T = any>(
    table: ValidTableName, 
    callback: (data: T[], event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
    filters?: Record<string, any>
  ): () => void;
  
  // Optimistic updates
  optimisticUpdate<T = any>(
    table: ValidTableName, 
    id: string, 
    optimisticData: Partial<T>, 
    updateFn: () => Promise<T>
  ): Promise<T>;
  
  // Search and filtering
  searchData<T = any>(table: ValidTableName, searchTerm: string, columns: string[]): Promise<T[]>;
  filterData<T = any>(table: ValidTableName, filters: Record<string, any>): Promise<T[]>;
  
  // Utilities
  refreshData(table: ValidTableName): Promise<void>;
  preloadData(tables: ValidTableName[]): Promise<void>;
}

class DataManager implements DataOperations {
  // Using centralized managers
  // private cache - now handled by cacheManager
  // private subscriptions - now handled by subscriptionManager

  // Core data fetching
  async fetchData<T = any>(table: ValidTableName, options: DataFetchOptions = {}): Promise<T[]> {
    try {
      const cached = cacheManager.getTableData<T[]>(table, options);
      
      if (cached) {
        return cached;
      }

      // Skip direct table access for api_keys - use RPC functions instead
      if (table === 'api_keys') {
        console.debug('DataManager: Direct api_keys table access blocked. Use manage_api_key RPC function instead.');
        return [] as T[];
      }

      let query = supabase.from(table as any).select(options.select || '*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        await errorManager.logDatabaseError(error, 'DataManager', `fetchData:${table}`);
        throw error;
      }

      const result = data as T[] || [];
      cacheManager.setTableData(table, result, options);
      
      return result;
    } catch (error) {
      await errorManager.handleError(error, 'database');
      return [];
    }
  }

  async fetchSingle<T = any>(table: ValidTableName, id: string, options: DataFetchOptions = {}): Promise<T | null> {
    try {
      const cached = cacheManager.getItem<T>(table, id);
      
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from(table as any)
        .select(options.select || '*')
        .eq('id', id)
        .single();


      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        await errorManager.logDatabaseError(error, 'DataManager', `fetchSingle:${table}`);
        throw error;
      }

      const result = data as T;
      cacheManager.setItem(table, id, result);
      
      return result;
    } catch (error) {
      await errorManager.handleError(error, 'database');
      return null;
    }
  }

  // Data mutations
  async insertData<T = any>(table: ValidTableName, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(table as any)
        .insert(data)
        .select()
        .single();

      if (error) {
        await errorManager.logDatabaseError(error, 'DataManager', `insertData:${table}`);
        throw error;
      }

      // Clear related cache entries
      cacheManager.invalidateTable(table);
      
      return result as T;
    } catch (error) {
      await errorManager.handleError(error, 'database');
      throw error;
    }
  }

  async updateData<T = any>(table: ValidTableName, id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(table as any)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        await errorManager.logDatabaseError(error, 'DataManager', `updateData:${table}`);
        throw error;
      }

      // Clear related cache entries
      cacheManager.invalidateTable(table);
      cacheManager.invalidateItem(table, id);
      
      return result as T;
    } catch (error) {
      await errorManager.handleError(error, 'database');
      throw error;
    }
  }

  async deleteData(table: ValidTableName, id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id);

      if (error) {
        await errorManager.logDatabaseError(error, 'DataManager', `deleteData:${table}`);
        throw error;
      }

      // Clear related cache entries
      cacheManager.invalidateTable(table);
      cacheManager.invalidateItem(table, id);
    } catch (error) {
      await errorManager.handleError(error, 'database');
      throw error;
    }
  }

  // Batch operations
  async batchInsert<T = any>(table: ValidTableName, data: Partial<T>[]): Promise<T[]> {
    try {
      const { data: result, error } = await supabase
        .from(table as any)
        .insert(data)
        .select();

      if (error) {
        await errorManager.logDatabaseError(error, 'DataManager', `batchInsert:${table}`);
        throw error;
      }

      // Clear related cache entries
      cacheManager.invalidateTable(table);
      
      return result as T[];
    } catch (error) {
      await errorManager.handleError(error, 'database');
      throw error;
    }
  }

  async batchUpdate<T = any>(table: ValidTableName, updates: { id: string; data: Partial<T> }[]): Promise<T[]> {
    try {
      const results: T[] = [];
      
      // Process updates in parallel with a reasonable batch size
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const batchPromises = batch.map(update => this.updateData<T>(table, update.id, update.data));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      
      return results;
    } catch (error) {
      await errorManager.handleError(error, 'database');
      throw error;
    }
  }

  async batchDelete(table: ValidTableName, ids: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .in('id', ids);

      if (error) {
        await errorManager.logDatabaseError(error, 'DataManager', `batchDelete:${table}`);
        throw error;
      }

      // Clear related cache entries
      cacheManager.invalidateTable(table);
      ids.forEach(id => cacheManager.invalidateItem(table, id));
    } catch (error) {
      await errorManager.handleError(error, 'database');
      throw error;
    }
  }

  // Caching - delegated to CacheManager
  getCached<T = any>(key: string): T | null {
    return cacheManager.get<T>(key);
  }

  setCached<T = any>(key: string, data: T, ttl?: number): void {
    cacheManager.set(key, data, { ttl });
  }

  clearCache(key?: string): void {
    if (key) {
      cacheManager.delete(key);
    } else {
      cacheManager.clear();
    }
  }

  // Real-time subscriptions - delegated to SubscriptionManager
  subscribe<T = any>(
    table: ValidTableName, 
    callback: (data: T[], event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
    filters?: Record<string, any>
  ): () => void {
    const subscriptionKey = `${table}:${JSON.stringify(filters || {})}`;
    
    const filterString = filters ? 
      Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`).join(',') : 
      undefined;

    return subscriptionManager.subscribe(
      subscriptionKey,
      {
        table,
        filter: filterString
      },
      async (payload) => {
        // Clear cache for this table
        cacheManager.invalidateTable(table);
        
        // Fetch updated data and notify callback
        try {
          const updatedData = await this.fetchData<T>(table, { filters });
          callback(updatedData, payload.eventType as any);
        } catch (error) {
          await errorManager.handleError(error, 'realtime');
        }
      }
    );
  }

  // Optimistic updates
  async optimisticUpdate<T = any>(
    table: ValidTableName, 
    id: string, 
    optimisticData: Partial<T>, 
    updateFn: () => Promise<T>
  ): Promise<T> {
    const originalData = cacheManager.getItem<T>(table, id);
    
    // Apply optimistic update
    if (originalData) {
      cacheManager.setItem(table, id, { ...originalData, ...optimisticData });
    }

    try {
      // Perform actual update
      const result = await updateFn();
      
      // Update cache with real data
      cacheManager.setItem(table, id, result);
      
      return result;
    } catch (error) {
      // Rollback optimistic update
      if (originalData) {
        cacheManager.setItem(table, id, originalData);
      } else {
        cacheManager.invalidateItem(table, id);
      }
      
      throw error;
    }
  }

  // Search and filtering
  async searchData<T = any>(table: ValidTableName, searchTerm: string, columns: string[]): Promise<T[]> {
    try {
      // Build text search query
      const searchQuery = columns.map(col => `${col}.ilike.%${searchTerm}%`).join(',');
      
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .or(searchQuery);

      if (error) {
        await errorManager.logDatabaseError(error, 'DataManager', `searchData:${table}`);
        throw error;
      }

      return data as T[] || [];
    } catch (error) {
      await errorManager.handleError(error, 'database');
      return [];
    }
  }

  async filterData<T = any>(table: ValidTableName, filters: Record<string, any>): Promise<T[]> {
    return this.fetchData<T>(table, { filters });
  }

  // Utilities
  async refreshData(table: ValidTableName): Promise<void> {
    cacheManager.invalidateTable(table);
    await this.fetchData(table);
  }

  async preloadData(tables: ValidTableName[]): Promise<void> {
    try {
      await Promise.all(tables.map(table => this.fetchData(table)));
    } catch (error) {
      await errorManager.handleError(error, 'database');
    }
  }

  // Helper methods
  private generateCacheKey(table: string, options: any = {}): string {
    return cacheManager.generateKey(table, options);
  }

  // Cleanup method
  destroy(): void {
    // Managers handle their own cleanup
    console.log('DataManager destroyed - cleanup delegated to managers');
  }
}

// Export singleton instance
export const dataManager = new DataManager();
export default dataManager;