import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { performanceService } from '@/services/performance/PerformanceService';
import { rateLimitService } from '@/services/performance/RateLimitService';

interface PerformanceContextType {
  cacheStats: { size: number; keys: string[] };
  clearCache: (pattern?: string) => void;
  preloadData: (userId: string) => Promise<void>;
  isLoading: boolean;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

interface PerformanceProviderProps {
  children: ReactNode;
}

/**
 * Performance provider that manages optimization services
 */
export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const [cacheStats, setCacheStats] = useState({ size: 0, keys: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Update cache stats periodically
    const interval = setInterval(() => {
      setCacheStats(performanceService.getCacheStats());
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const clearCache = (pattern?: string) => {
    performanceService.clearCache(pattern);
    setCacheStats(performanceService.getCacheStats());
  };

  const preloadData = async (userId: string) => {
    setIsLoading(true);
    try {
      await performanceService.preloadCriticalData(userId);
    } catch (error) {
      console.warn('Failed to preload data:', error);
    } finally {
      setIsLoading(false);
      setCacheStats(performanceService.getCacheStats());
    }
  };

  const value = {
    cacheStats,
    clearCache,
    preloadData,
    isLoading
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
}

/**
 * Hook for optimized queries with caching
 */
export function useOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await performanceService.optimizedQuery(queryFn, queryKey);
        
        if (!cancelled) {
          setData(result.data);
          setError(result.error);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [queryKey, ...deps]);

  return { data, error, loading };
}