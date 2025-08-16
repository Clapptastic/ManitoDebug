import { supabase } from '@/integrations/supabase/client';

export interface QueryMetric {
  id: string;
  query: string;
  execution_time_ms: number;
  timestamp: string;
  user_id?: string;
  status: 'success' | 'error';
  error_message?: string;
  table_name?: string;
  operation_type?: string;
}

export interface PerformanceMetrics {
  avgQueryTime: number;
  totalQueries: number;
  errorRate: number;
  slowQueries: QueryMetric[];
  peakHours: { hour: number; count: number }[];
  popularTables: { table: string; count: number }[];
}

export interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  errorRate: number;
  lastCheck: string;
  components: ComponentHealthData[];
  systemHealth?: SystemHealthData; // Add self-reference for nested structure
}

export interface ComponentHealthData {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: string;
  errorCount: number;
  metrics?: Record<string, number>;
}

export interface EdgeFunctionMetric {
  id: string;
  function_name: string;
  execution_time_ms: number;
  status: string;
  timestamp: string;
  memory_usage_mb?: number;
  error_message?: string;
  user_id?: string;
}

export interface EdgeFunctionStats {
  totalInvocations: number;
  totalExecutions: number; // Add missing property
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
  errorCount: number; // Add missing property
  peakUsageTime: string;
  memoryUsage: {
    average: number;
    peak: number;
  };
}

export interface MonitoringOperations {
  trackQuery(query: string, executionTimeMs: number, status?: 'success' | 'error', errorMessage?: string): Promise<void>;
  getPerformanceMetrics(timeframe?: '1h' | '24h' | '7d'): Promise<PerformanceMetrics>;
  getSlowQueries(limit?: number): Promise<QueryMetric[]>;
  getDatabaseMetrics(): Promise<any>;
  getSystemHealth(): Promise<SystemHealthData>;
  getEdgeFunctionMetrics(): Promise<EdgeFunctionMetric[]>;
  getEdgeFunctionStats(): Promise<EdgeFunctionStats>;
  updateComponentHealth(component: string, health: ComponentHealthData): Promise<void>;
  startPerformanceMonitoring(): void;
  stopPerformanceMonitoring(): void;
}

export class MonitoringManager implements MonitoringOperations {
  private static instance: MonitoringManager;
  private metricsQueue: QueryMetric[] = [];
  private isProcessing = false;
  private monitoringInterval: number | null = null;
  private healthChecks = new Map<string, ComponentHealthData>();

  public static getInstance(): MonitoringManager {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager();
    }
    return MonitoringManager.instance;
  }

  async trackQuery(query: string, executionTimeMs: number, status: 'success' | 'error' = 'success', errorMessage?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const metric: QueryMetric = {
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        execution_time_ms: executionTimeMs,
        timestamp: new Date().toISOString(),
        user_id: user?.id,
        status,
        error_message: errorMessage,
        table_name: this.extractTableName(query),
        operation_type: this.extractOperationType(query)
      };

      this.metricsQueue.push(metric);
      
      if (!this.isProcessing) {
        this.processMetricsQueue();
      }
    } catch (error) {
      console.error('Failed to track query metric:', error);
    }
  }

  async getPerformanceMetrics(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<PerformanceMetrics> {
    try {
      const hours = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : 168;
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      // Get metrics from edge function metrics table
      const { data, error } = await supabase
        .from('edge_function_metrics')
        .select('*')
        .eq('function_name', 'query_metric')
        .gte('created_at', startTime.toISOString());

      if (error) throw error;

      // Transform edge function metrics to query metrics format
      const queryMetrics: QueryMetric[] = (data || []).map(item => ({
        id: item.id,
        query: (item.metadata as any)?.query || 'Unknown Query',
        execution_time_ms: item.execution_time_ms,
        timestamp: (item.metadata as any)?.original_timestamp || item.created_at,
        user_id: item.user_id,
        status: item.status as 'success' | 'error',
        error_message: item.error_message,
        table_name: (item.metadata as any)?.table_name,
        operation_type: (item.metadata as any)?.operation_type
      }));

      const totalQueries = queryMetrics.length;
      const successfulQueries = queryMetrics.filter(m => m.status === 'success');
      const avgQueryTime = successfulQueries.length > 0 
        ? successfulQueries.reduce((sum, m) => sum + m.execution_time_ms, 0) / successfulQueries.length
        : 0;
      
      const errorRate = totalQueries > 0 
        ? (queryMetrics.filter(m => m.status === 'error').length / totalQueries) * 100 
        : 0;

      const slowQueries = queryMetrics
        .filter(m => m.execution_time_ms > 1000) // Queries slower than 1 second
        .sort((a, b) => b.execution_time_ms - a.execution_time_ms)
        .slice(0, 10);

      const peakHours = this.calculatePeakHours(queryMetrics);
      const popularTables = this.calculatePopularTables(queryMetrics);

      return {
        avgQueryTime,
        totalQueries,
        errorRate,
        slowQueries,
        peakHours,
        popularTables
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        avgQueryTime: 0,
        totalQueries: 0,
        errorRate: 0,
        slowQueries: [],
        peakHours: [],
        popularTables: []
      };
    }
  }

  async getSlowQueries(limit = 10): Promise<QueryMetric[]> {
    try {
      const { data, error } = await supabase
        .from('edge_function_metrics')
        .select('*')
        .eq('function_name', 'query_metric')
        .gte('execution_time_ms', 1000)
        .order('execution_time_ms', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        query: (item.metadata as any)?.query || 'Unknown Query',
        execution_time_ms: item.execution_time_ms,
        timestamp: (item.metadata as any)?.original_timestamp || item.created_at,
        user_id: item.user_id,
        status: item.status as 'success' | 'error',
        error_message: item.error_message,
        table_name: (item.metadata as any)?.table_name,
        operation_type: (item.metadata as any)?.operation_type
      }));
    } catch (error) {
      console.error('Error getting slow queries:', error);
      return [];
    }
  }

  async getDatabaseMetrics(): Promise<any> {
    try {
      // Get database performance metrics
      const { data, error } = await supabase.functions.invoke('get-database-metrics');
      
      if (error) throw error;
      
      return data || {
        connections: { active: 0, max: 100 },
        tableStats: [],
        indexUsage: [],
        queryPerformance: { avgTime: 0, slowQueries: 0 }
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      return {
        connections: { active: 0, max: 100 },
        tableStats: [],
        indexUsage: [],
        queryPerformance: { avgTime: 0, slowQueries: 0 }
      };
    }
  }

  async getSystemHealth(): Promise<SystemHealthData> {
    try {
      const healthData: SystemHealthData = {
        status: 'healthy',
        responseTime: 0,
        uptime: 99.9,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        components: []
      };

      // Check database health
      const dbStart = Date.now();
      try {
        await supabase.from('profiles').select('id').limit(1);
        const dbResponseTime = Date.now() - dbStart;
        healthData.components.push({
          name: 'Database',
          status: dbResponseTime < 1000 ? 'healthy' : 'degraded',
          responseTime: dbResponseTime,
          lastCheck: new Date().toISOString(),
          errorCount: 0
        });
        healthData.responseTime += dbResponseTime;
      } catch (error) {
        healthData.components.push({
          name: 'Database',
          status: 'down',
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          errorCount: 1
        });
        healthData.status = 'degraded';
      }

      // Check API health
      const apiStart = Date.now();
      try {
        await supabase.auth.getSession();
        const apiResponseTime = Date.now() - apiStart;
        healthData.components.push({
          name: 'API',
          status: apiResponseTime < 500 ? 'healthy' : 'degraded',
          responseTime: apiResponseTime,
          lastCheck: new Date().toISOString(),
          errorCount: 0
        });
        healthData.responseTime += apiResponseTime;
      } catch (error) {
        healthData.components.push({
          name: 'API',
          status: 'down',
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          errorCount: 1
        });
        healthData.status = 'degraded';
      }

      // Average response time
      healthData.responseTime = healthData.responseTime / healthData.components.length;

      // Check if any component is down
      if (healthData.components.some(c => c.status === 'down')) {
        healthData.status = 'down';
      } else if (healthData.components.some(c => c.status === 'degraded')) {
        healthData.status = 'degraded';
      }

      return healthData;
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        status: 'down',
        responseTime: 0,
        uptime: 0,
        errorRate: 100,
        lastCheck: new Date().toISOString(),
        components: []
      };
    }
  }

  async getEdgeFunctionMetrics(): Promise<EdgeFunctionMetric[]> {
    try {
      const { data, error } = await supabase
        .from('edge_function_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        function_name: item.function_name,
        execution_time_ms: item.execution_time_ms,
        status: item.status,
        timestamp: item.created_at,
        memory_usage_mb: item.memory_usage_mb,
        error_message: item.error_message,
        user_id: item.user_id
      }));
    } catch (error) {
      console.error('Error getting edge function metrics:', error);
      return [];
    }
  }

  async getEdgeFunctionStats(): Promise<EdgeFunctionStats> {
    try {
      const metrics = await this.getEdgeFunctionMetrics();
      
      const totalInvocations = metrics.length;
      const successfulInvocations = metrics.filter(m => m.status === 'success');
      const averageExecutionTime = successfulInvocations.length > 0
        ? successfulInvocations.reduce((sum, m) => sum + m.execution_time_ms, 0) / successfulInvocations.length
        : 0;
      
      const successRate = totalInvocations > 0 
        ? (successfulInvocations.length / totalInvocations) * 100
        : 0;
      
      const errorRate = 100 - successRate;
      
      const memoryMetrics = metrics.filter(m => m.memory_usage_mb);
      const averageMemory = memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + (m.memory_usage_mb || 0), 0) / memoryMetrics.length
        : 0;
      
      const peakMemory = memoryMetrics.length > 0
        ? Math.max(...memoryMetrics.map(m => m.memory_usage_mb || 0))
        : 0;

      // Find peak usage time (hour with most invocations)
      const hourCounts = new Map<number, number>();
      metrics.forEach(m => {
        const hour = new Date(m.timestamp).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });
      
      const peakHour = Array.from(hourCounts.entries())
        .reduce((max, [hour, count]) => count > max.count ? { hour, count } : max, { hour: 0, count: 0 });

      return {
        totalInvocations,
        totalExecutions: totalInvocations, // Add missing property
        averageExecutionTime,
        successRate,
        errorRate,
        errorCount: metrics.filter(m => m.status !== 'success').length, // Add missing property
        peakUsageTime: `${peakHour.hour}:00`,
        memoryUsage: {
          average: averageMemory,
          peak: peakMemory
        }
      };
    } catch (error) {
      console.error('Error getting edge function stats:', error);
      return {
        totalInvocations: 0,
        totalExecutions: 0,
        averageExecutionTime: 0,
        successRate: 0,
        errorRate: 0,
        errorCount: 0,
        peakUsageTime: '00:00',
        memoryUsage: { average: 0, peak: 0 }
      };
    }
  }

  async updateComponentHealth(component: string, health: ComponentHealthData): Promise<void> {
    this.healthChecks.set(component, health);
  }

  startPerformanceMonitoring(): void {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = window.setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        
        // Log performance issues
        if (health.status !== 'healthy') {
          console.warn('System health degraded:', health);
        }
        
        // Check for slow queries with error handling to prevent infinite loops
        try {
          const slowQueries = await this.getSlowQueries(5);
          if (slowQueries.length > 0) {
            console.warn('Slow queries detected:', slowQueries);
          }
        } catch (queryError) {
          console.error('Error checking slow queries:', queryError);
        }
        
      } catch (error) {
        console.error('Performance monitoring error:', error);
        // Don't rethrow to prevent interval from stopping
      }
    }, 60000); // Check every minute
  }

  stopPerformanceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Private helper methods
  private async processMetricsQueue(): Promise<void> {
    if (this.isProcessing || this.metricsQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      while (this.metricsQueue.length > 0) {
        const metricsBatch = this.metricsQueue.splice(0, 10);
        
        // Store in edge function metrics
        for (const metric of metricsBatch) {
          try {
            await supabase
              .from('edge_function_metrics')
              .insert({
                function_name: 'query_metric',
                status: metric.status,
                execution_time_ms: metric.execution_time_ms,
                user_id: metric.user_id,
                error_message: metric.error_message,
                metadata: {
                  query: metric.query,
                  original_timestamp: metric.timestamp,
                  table_name: metric.table_name,
                  operation_type: metric.operation_type
                }
              });
          } catch (insertError) {
            console.error('Failed to insert query metric:', insertError);
          }
        }
      }
    } catch (processError) {
      console.error('Error processing metrics queue:', processError);
    } finally {
      this.isProcessing = false;
    }
  }

  private extractTableName(query: string): string {
    const match = query.match(/(?:from|into|update|delete\s+from)\s+["`]?(\w+)["`]?/i);
    return match ? match[1] : 'unknown';
  }

  private extractOperationType(query: string): string {
    const query_lower = query.toLowerCase().trim();
    if (query_lower.startsWith('select')) return 'SELECT';
    if (query_lower.startsWith('insert')) return 'INSERT';
    if (query_lower.startsWith('update')) return 'UPDATE';
    if (query_lower.startsWith('delete')) return 'DELETE';
    return 'OTHER';
  }

  private calculatePeakHours(metrics: QueryMetric[]): { hour: number; count: number }[] {
    const hourCounts = new Map<number, number>();
    
    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    return Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculatePopularTables(metrics: QueryMetric[]): { table: string; count: number }[] {
    const tableCounts = new Map<string, number>();
    
    metrics.forEach(metric => {
      if (metric.table_name && metric.table_name !== 'unknown') {
        tableCounts.set(metric.table_name, (tableCounts.get(metric.table_name) || 0) + 1);
      }
    });

    return Array.from(tableCounts.entries())
      .map(([table, count]) => ({ table, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

export const monitoringManager = MonitoringManager.getInstance();