/**
 * SYSTEM HEALTH MONITORING HOOK
 * React hook for monitoring system health and performance
 */

import { useState, useEffect, useCallback } from 'react';
import { systemHealthMonitor, SystemHealthMetrics, PerformanceLog, TransactionStatus } from '@/services/monitoring/SystemHealthMonitoringService';

export interface UseSystemHealthOptions {
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

export function useSystemHealth(options: UseSystemHealthOptions = {}) {
  const { refreshInterval = 30000, autoRefresh = true } = options;
  
  const [healthData, setHealthData] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealthData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await systemHealthMonitor.getSystemHealthOverview();
      setHealthData(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    fetchHealthData();
    const interval = setInterval(fetchHealthData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchHealthData, refreshInterval, autoRefresh]);

  return {
    healthData,
    loading,
    error,
    lastRefresh,
    refresh: fetchHealthData
  };
}

export function usePerformanceLogs(component?: string, limit: number = 100) {
  const [logs, setLogs] = useState<PerformanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await systemHealthMonitor.getPerformanceLogs(limit, component);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance logs');
    } finally {
      setLoading(false);
    }
  }, [component, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refresh: fetchLogs
  };
}

export function useTransactionLogs(status?: string, limit: number = 50) {
  const [transactions, setTransactions] = useState<TransactionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await systemHealthMonitor.getTransactionLogs(limit, status);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction logs');
    } finally {
      setLoading(false);
    }
  }, [status, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refresh: fetchTransactions
  };
}

/**
 * Hook for performance monitoring wrapper
 */
export function usePerformanceMonitoring() {
  const logPerformance = useCallback(
    async (
      operationName: string,
      executionTimeMs: number,
      component: string = 'frontend',
      status: 'success' | 'error' | 'timeout' = 'success',
      metadata?: any
    ) => {
      return await systemHealthMonitor.logPerformanceMetric(
        operationName,
        executionTimeMs,
        component,
        status,
        metadata
      );
    },
    []
  );

  const withPerformanceMonitoring = useCallback(
    async <T>(
      operationName: string,
      operation: () => Promise<T>,
      component: string = 'frontend',
      metadata?: any
    ): Promise<T> => {
      return await systemHealthMonitor.withPerformanceMonitoring(
        operationName,
        operation,
        component,
        metadata
      );
    },
    []
  );

  return {
    logPerformance,
    withPerformanceMonitoring
  };
}

/**
 * Hook for transaction monitoring
 */
export function useTransactionMonitoring() {
  const startTransaction = useCallback(
    async (operationType: string, totalSteps: number, metadata?: any) => {
      return await systemHealthMonitor.startTransactionLog(operationType, totalSteps, metadata);
    },
    []
  );

  const updateStep = useCallback(
    async (transactionId: string, stepNumber: number, stepData?: any, rollbackData?: any) => {
      return await systemHealthMonitor.updateTransactionStep(transactionId, stepNumber, stepData, rollbackData);
    },
    []
  );

  const completeTransaction = useCallback(
    async (transactionId: string, success: boolean = true) => {
      return await systemHealthMonitor.completeTransaction(transactionId, success);
    },
    []
  );

  const rollbackTransaction = useCallback(
    async (transactionId: string, errorMessage?: string) => {
      return await systemHealthMonitor.rollbackTransaction(transactionId, errorMessage);
    },
    []
  );

  const withTransactionMonitoring = useCallback(
    async <T>(
      operationType: string,
      totalSteps: number,
      operation: (updateStep: (step: number, data?: any, rollbackData?: any) => Promise<boolean>) => Promise<T>,
      metadata?: any
    ): Promise<T> => {
      return await systemHealthMonitor.withTransactionMonitoring(
        operationType,
        totalSteps,
        operation,
        metadata
      );
    },
    []
  );

  return {
    startTransaction,
    updateStep,
    completeTransaction,
    rollbackTransaction,
    withTransactionMonitoring
  };
}

/**
 * Hook for real-time subscription tracking
 */
export function useRealtimeTracking() {
  const trackSubscription = useCallback(
    async (
      channelName: string,
      subscriptionType: string,
      action: 'subscribe' | 'unsubscribe' | 'heartbeat',
      metadata?: any
    ) => {
      return await systemHealthMonitor.trackRealtimeSubscription(
        channelName,
        subscriptionType,
        action,
        metadata
      );
    },
    []
  );

  // Helper for automatically tracking subscription lifecycle
  const useTrackedSubscription = useCallback(
    (channelName: string, subscriptionType: string, metadata?: any) => {
      useEffect(() => {
        // Track subscription start
        trackSubscription(channelName, subscriptionType, 'subscribe', metadata);

        // Set up heartbeat interval
        const heartbeatInterval = setInterval(() => {
          trackSubscription(channelName, subscriptionType, 'heartbeat', metadata);
        }, 30000); // Every 30 seconds

        return () => {
          // Track subscription end
          trackSubscription(channelName, subscriptionType, 'unsubscribe', metadata);
          clearInterval(heartbeatInterval);
        };
      }, [channelName, subscriptionType]); // Remove metadata dependency to prevent infinite loops
    },
    [trackSubscription]
  );

  return {
    trackSubscription,
    useTrackedSubscription
  };
}

/**
 * Hook for simple health status display
 */
export function useHealthStatus() {
  const [status, setStatus] = useState<{
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    lastUpdated: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const healthStatus = await systemHealthMonitor.getHealthStatus();
        setStatus(healthStatus);
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return { status, loading };
}