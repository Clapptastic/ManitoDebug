/**
 * Consolidated Data Manager Hook
 * Single source of truth for data management functionality in React components
 * Phase 1.2 & 2.2: Data Management Consolidation
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  dataManager,
  type ValidTableName,
  type DataFetchOptions
} from '@/services/core/DataManager';
import { toast } from '@/hooks/use-toast';

export interface UseDataManagerReturn<T = any> {
  // Data state
  data: T[];
  item: T | null;
  loading: boolean;
  error: string | null;
  
  // Core operations
  fetchData: (table: ValidTableName, options?: DataFetchOptions) => Promise<T[]>;
  fetchSingle: (table: ValidTableName, id: string, options?: DataFetchOptions) => Promise<T | null>;
  insertData: (table: ValidTableName, data: Partial<T>) => Promise<T>;
  updateData: (table: ValidTableName, id: string, data: Partial<T>) => Promise<T>;
  deleteData: (table: ValidTableName, id: string) => Promise<void>;
  
  // Batch operations
  batchInsert: (table: ValidTableName, data: Partial<T>[]) => Promise<T[]>;
  batchUpdate: (table: ValidTableName, updates: { id: string; data: Partial<T> }[]) => Promise<T[]>;
  batchDelete: (table: ValidTableName, ids: string[]) => Promise<void>;
  
  // Search and filtering
  searchData: (table: ValidTableName, searchTerm: string, columns: string[]) => Promise<T[]>;
  filterData: (table: ValidTableName, filters: Record<string, any>) => Promise<T[]>;
  
  // Cache management
  refreshData: (table: ValidTableName) => Promise<void>;
  clearCache: (key?: string) => void;
  
  // Real-time subscriptions
  subscribe: (
    table: ValidTableName,
    callback: (data: T[], event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
    filters?: Record<string, any>
  ) => () => void;
  
  // State management
  setData: (data: T[]) => void;
  setItem: (item: T | null) => void;
  clearError: () => void;
}

export const useDataManager = <T = any>(
  initialTable?: ValidTableName,
  initialOptions?: DataFetchOptions
): UseDataManagerReturn<T> => {
  const [data, setData] = useState<T[]>([]);
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data if table provided
  useEffect(() => {
    if (initialTable) {
      fetchData(initialTable, initialOptions);
    }
  }, [initialTable]);

  // Core operations
  const fetchData = useCallback(async (table: ValidTableName, options?: DataFetchOptions): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dataManager.fetchData<T>(table, options);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      
      toast({
        title: 'Fetch Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSingle = useCallback(async (table: ValidTableName, id: string, options?: DataFetchOptions): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dataManager.fetchSingle<T>(table, id, options);
      setItem(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch item';
      setError(errorMessage);
      
      toast({
        title: 'Fetch Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const insertData = useCallback(async (table: ValidTableName, dataToInsert: Partial<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dataManager.insertData<T>(table, dataToInsert);
      
      // Update local state
      setData(prev => [result, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Data inserted successfully',
        variant: 'default'
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to insert data';
      setError(errorMessage);
      
      toast({
        title: 'Insert Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateData = useCallback(async (table: ValidTableName, id: string, dataToUpdate: Partial<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dataManager.updateData<T>(table, id, dataToUpdate);
      
      // Update local state
      setData(prev => prev.map(item => 
        (item as any).id === id ? result : item
      ));
      
      if (item && (item as any).id === id) {
        setItem(result);
      }
      
      toast({
        title: 'Success',
        description: 'Data updated successfully',
        variant: 'default'
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update data';
      setError(errorMessage);
      
      toast({
        title: 'Update Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [item]);

  const deleteData = useCallback(async (table: ValidTableName, id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await dataManager.deleteData(table, id);
      
      // Update local state
      setData(prev => prev.filter(item => (item as any).id !== id));
      
      if (item && (item as any).id === id) {
        setItem(null);
      }
      
      toast({
        title: 'Success',
        description: 'Data deleted successfully',
        variant: 'default'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete data';
      setError(errorMessage);
      
      toast({
        title: 'Delete Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [item]);

  // Batch operations
  const batchInsert = useCallback(async (table: ValidTableName, dataArray: Partial<T>[]): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await dataManager.batchInsert<T>(table, dataArray);
      
      // Update local state
      setData(prev => [...results, ...prev]);
      
      toast({
        title: 'Success',
        description: `${results.length} items inserted successfully`,
        variant: 'default'
      });
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch insert failed';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast, setLoading, setError, setData]);

  const batchUpdate = useCallback(async (table: ValidTableName, updates: { id: string; data: Partial<T> }[]): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await dataManager.batchUpdate<T>(table, updates);
      
      // Update local state
      const updateMap = new Map(results.map(result => [(result as any).id, result]));
      setData(prev => prev.map(item => {
        const updated = updateMap.get((item as any).id);
        return updated || item;
      }));
      
      toast({
        title: 'Success',
        description: `${results.length} items updated successfully`,
        variant: 'default'
      });
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch update data';
      setError(errorMessage);
      
      toast({
        title: 'Batch Update Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchDelete = useCallback(async (table: ValidTableName, ids: string[]): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await dataManager.batchDelete(table, ids);
      
      // Update local state
      const idsSet = new Set(ids);
      setData(prev => prev.filter(item => !idsSet.has((item as any).id)));
      
      if (item && idsSet.has((item as any).id)) {
        setItem(null);
      }
      
      toast({
        title: 'Success',
        description: `${ids.length} items deleted successfully`,
        variant: 'default'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch delete data';
      setError(errorMessage);
      
      toast({
        title: 'Batch Delete Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [item]);

  // Search and filtering
  const searchData = useCallback(async (table: ValidTableName, searchTerm: string, columns: string[]): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await dataManager.searchData<T>(table, searchTerm, columns);
      setData(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search data';
      setError(errorMessage);
      
      toast({
        title: 'Search Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const filterData = useCallback(async (table: ValidTableName, filters: Record<string, any>): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await dataManager.filterData<T>(table, filters);
      setData(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter data';
      setError(errorMessage);
      
      toast({
        title: 'Filter Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Cache management
  const refreshData = useCallback(async (table: ValidTableName): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await dataManager.refreshData(table);
      // Optionally refetch data
      await fetchData(table);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
      
      toast({
        title: 'Refresh Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const clearCache = useCallback((key?: string): void => {
    dataManager.clearCache(key);
  }, []);

  // Real-time subscriptions
  const subscribe = useCallback((
    table: ValidTableName,
    callback: (data: T[], event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
    filters?: Record<string, any>
  ): (() => void) => {
    return dataManager.subscribe<T>(table, callback, filters);
  }, []);

  // State management helpers
  const setDataState = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  const setItemState = useCallback((newItem: T | null) => {
    setItem(newItem);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    data,
    item,
    loading,
    error,
    
    // Core operations
    fetchData,
    fetchSingle,
    insertData,
    updateData,
    deleteData,
    
    // Batch operations
    batchInsert,
    batchUpdate,
    batchDelete,
    
    // Search and filtering
    searchData,
    filterData,
    
    // Cache management
    refreshData,
    clearCache,
    
    // Real-time subscriptions
    subscribe,
    
    // State management
    setData: setDataState,
    setItem: setItemState,
    clearError
  };
};