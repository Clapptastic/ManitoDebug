/**
 * Unified Monitoring Manager Hook
 * Single source of truth for all monitoring functionality in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  monitoringManager, 
  type QueryMetric, 
  type SystemHealthData, 
  type ComponentHealthData,
  type EdgeFunctionMetric,
  type EdgeFunctionStats 
} from '@/services/core/MonitoringManager';

export interface UseMonitoringManagerReturn {
  // Database monitoring
  queryMetrics: QueryMetric[];
  tableStats: any[];
  
  // System health
  systemHealth: SystemHealthData | null;
  components: ComponentHealthData[];
  
  // Edge functions
  edgeFunctionMetrics: EdgeFunctionMetric[];
  edgeFunctionStats: EdgeFunctionStats;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshMetrics: () => Promise<void>;
  refreshSystemHealth: () => Promise<void>;
  refreshEdgeFunctions: () => Promise<void>;
  updateComponentHealth: (componentId: string, status: ComponentHealthData['status'], responseTime?: number) => Promise<void>;
  
  // Real-time monitoring
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export const useMonitoringManager = (): UseMonitoringManagerReturn => {
  const [queryMetrics, setQueryMetrics] = useState<QueryMetric[]>([]);
  const [tableStats, setTableStats] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [components, setComponents] = useState<ComponentHealthData[]>([]);
  const [edgeFunctionMetrics, setEdgeFunctionMetrics] = useState<EdgeFunctionMetric[]>([]);
  const [edgeFunctionStats, setEdgeFunctionStats] = useState<EdgeFunctionStats>({
    totalInvocations: 0,
    totalExecutions: 0,
    averageExecutionTime: 0,
    successRate: 0,
    errorRate: 0,
    errorCount: 0,
    peakUsageTime: '00:00',
    memoryUsage: { average: 0, peak: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Database monitoring
  const refreshMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await monitoringManager.getDatabaseMetrics();
      setQueryMetrics(metrics.queryMetrics);
      setTableStats(metrics.tableStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  // System health monitoring
  const refreshSystemHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const health = await monitoringManager.getSystemHealth();
      setSystemHealth(health.systemHealth);
      setComponents(health.components);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh system health');
    } finally {
      setLoading(false);
    }
  }, []);

  // Edge function monitoring
  const refreshEdgeFunctions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [metrics, stats] = await Promise.all([
        monitoringManager.getEdgeFunctionMetrics(),
        monitoringManager.getEdgeFunctionStats()
      ]);
      setEdgeFunctionMetrics(metrics);
      setEdgeFunctionStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh edge functions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Component health updates
  const updateComponentHealth = useCallback(async (
    componentId: string, 
    status: ComponentHealthData['status'], 
    responseTime?: number
  ) => {
    try {
      const healthData: ComponentHealthData = {
        name: componentId,
        status,
        responseTime,
        lastCheck: new Date().toISOString(),
        errorCount: status === 'down' ? 1 : 0
      };
      await monitoringManager.updateComponentHealth(componentId, healthData);
      await refreshSystemHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update component health');
    }
  }, [refreshSystemHealth]);

  // Real-time monitoring
  const startMonitoring = useCallback(() => {
    monitoringManager.startPerformanceMonitoring();
  }, []);

  const stopMonitoring = useCallback(() => {
    monitoringManager.stopPerformanceMonitoring();
  }, []);

  // Initial data load
  useEffect(() => {
    refreshMetrics();
    refreshSystemHealth();
    refreshEdgeFunctions();
  }, [refreshMetrics, refreshSystemHealth, refreshEdgeFunctions]);

  return {
    // Data
    queryMetrics,
    tableStats,
    systemHealth,
    components,
    edgeFunctionMetrics,
    edgeFunctionStats,
    
    // State
    loading,
    error,
    
    // Actions
    refreshMetrics,
    refreshSystemHealth,
    refreshEdgeFunctions,
    updateComponentHealth,
    startMonitoring,
    stopMonitoring
  };
};