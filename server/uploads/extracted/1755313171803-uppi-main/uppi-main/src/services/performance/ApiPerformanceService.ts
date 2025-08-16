/**
 * CONSOLIDATED API Performance Monitoring Service
 * Single source of truth for API performance tracking
 */

import { supabase } from '@/lib/supabase/client';
import { errorHandler } from '@/services/error-handling/ErrorHandlingService';

export interface ApiPerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  warning: number;
  critical: number;
  timeout: number;
}

class ApiPerformanceService {
  private static instance: ApiPerformanceService;
  private readonly thresholds: PerformanceThresholds = {
    warning: 2000,   // 2 seconds
    critical: 5000,  // 5 seconds
    timeout: 30000   // 30 seconds
  };

  private metricsBuffer: ApiPerformanceMetric[] = [];
  private readonly bufferSize = 50;
  private flushTimer: NodeJS.Timeout | null = null;

  public static getInstance(): ApiPerformanceService {
    if (!ApiPerformanceService.instance) {
      ApiPerformanceService.instance = new ApiPerformanceService();
    }
    return ApiPerformanceService.instance;
  }

  /**
   * Track API performance metrics
   */
  public async trackApiCall(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const metric: ApiPerformanceMetric = {
      endpoint,
      method,
      responseTime,
      statusCode,
      success: statusCode >= 200 && statusCode < 400,
      timestamp: new Date(),
      metadata
    };

    // Add to buffer for batch processing
    this.metricsBuffer.push(metric);

    // Check performance thresholds
    this.checkPerformanceThresholds(metric);

    // Flush buffer if needed
    if (this.metricsBuffer.length >= this.bufferSize) {
      await this.flushMetrics();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Get performance statistics for a specific endpoint
   */
  public async getEndpointStats(
    endpoint: string, 
    timeRangeHours: number = 24
  ): Promise<{
    avgResponseTime: number;
    successRate: number;
    totalRequests: number;
    errorRate: number;
  }> {
    try {
      const since = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000));
      
      const { data, error } = await supabase
        .from('api_metrics')
        .select('response_time_ms, status_code')
        .eq('endpoint', endpoint)
        .gte('created_at', since.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          avgResponseTime: 0,
          successRate: 0,
          totalRequests: 0,
          errorRate: 0
        };
      }

      const totalRequests = data.length;
      const successfulRequests = data.filter(d => d.status_code >= 200 && d.status_code < 400).length;
      const avgResponseTime = data.reduce((sum, d) => sum + d.response_time_ms, 0) / totalRequests;

      return {
        avgResponseTime: Math.round(avgResponseTime),
        successRate: (successfulRequests / totalRequests) * 100,
        totalRequests,
        errorRate: ((totalRequests - successfulRequests) / totalRequests) * 100
      };
    } catch (error) {
      errorHandler.logError(error as Error, {
        component: 'ApiPerformanceService',
        action: 'getEndpointStats',
        endpoint
      });
      return {
        avgResponseTime: 0,
        successRate: 0,
        totalRequests: 0,
        errorRate: 0
      };
    }
  }

  /**
   * Get system-wide performance overview
   */
  public async getSystemPerformanceOverview(): Promise<{
    averageResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
    errorRateByEndpoint: Array<{ endpoint: string; errorRate: number }>;
    totalRequests: number;
  }> {
    try {
      const since = new Date(Date.now() - (24 * 60 * 60 * 1000)); // Last 24 hours

      const { data, error } = await supabase
        .from('api_metrics')
        .select('endpoint, response_time_ms, status_code')
        .gte('created_at', since.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          averageResponseTime: 0,
          slowestEndpoints: [],
          errorRateByEndpoint: [],
          totalRequests: 0
        };
      }

      // Calculate overall average
      const averageResponseTime = data.reduce((sum, d) => sum + d.response_time_ms, 0) / data.length;

      // Group by endpoint
      const endpointStats = data.reduce((acc, metric) => {
        if (!acc[metric.endpoint]) {
          acc[metric.endpoint] = { times: [], errors: 0, total: 0 };
        }
        acc[metric.endpoint].times.push(metric.response_time_ms);
        acc[metric.endpoint].total++;
        if (metric.status_code >= 400) {
          acc[metric.endpoint].errors++;
        }
        return acc;
      }, {} as Record<string, { times: number[]; errors: number; total: number }>);

      // Calculate slowest endpoints
      const slowestEndpoints = Object.entries(endpointStats)
        .map(([endpoint, stats]) => ({
          endpoint,
          avgTime: Math.round(stats.times.reduce((sum, time) => sum + time, 0) / stats.times.length)
        }))
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 5);

      // Calculate error rates
      const errorRateByEndpoint = Object.entries(endpointStats)
        .map(([endpoint, stats]) => ({
          endpoint,
          errorRate: (stats.errors / stats.total) * 100
        }))
        .filter(stat => stat.errorRate > 0)
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 5);

      return {
        averageResponseTime: Math.round(averageResponseTime),
        slowestEndpoints,
        errorRateByEndpoint,
        totalRequests: data.length
      };
    } catch (error) {
      errorHandler.logError(error as Error, {
        component: 'ApiPerformanceService',
        action: 'getSystemPerformanceOverview'
      });
      return {
        averageResponseTime: 0,
        slowestEndpoints: [],
        errorRateByEndpoint: [],
        totalRequests: 0
      };
    }
  }

  /**
   * Check if performance exceeds thresholds and alert if needed
   */
  private checkPerformanceThresholds(metric: ApiPerformanceMetric): void {
    if (metric.responseTime > this.thresholds.critical) {
      console.warn(`🚨 CRITICAL: ${metric.endpoint} took ${metric.responseTime}ms (>${this.thresholds.critical}ms)`);
      
      // Log to monitoring service
      errorHandler.logError(`Critical API performance: ${metric.endpoint}`, {
        component: 'ApiPerformanceService',
        action: 'performance_threshold_exceeded',
        performance_level: 'critical',
        response_time: metric.responseTime,
        endpoint: metric.endpoint,
        threshold: this.thresholds.critical
      });
    } else if (metric.responseTime > this.thresholds.warning) {
      console.warn(`⚠️ WARNING: ${metric.endpoint} took ${metric.responseTime}ms (>${this.thresholds.warning}ms)`);
    }

    if (!metric.success) {
      console.error(`❌ API ERROR: ${metric.endpoint} returned ${metric.statusCode}`);
    }
  }

  /**
   * Flush metrics buffer to database
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metricsToFlush = [...this.metricsBuffer];
      this.metricsBuffer = [];

      // Clear the flush timer
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }

      const { error } = await supabase
        .from('api_metrics')
        .insert(
          metricsToFlush.map(metric => ({
            endpoint: metric.endpoint,
            method: metric.method,
            response_time_ms: metric.responseTime,
            status_code: metric.statusCode,
            user_id: null, // Will be set by RLS if user is authenticated
            metadata: metric.metadata || {},
            created_at: metric.timestamp.toISOString()
          }))
        );

      if (error) {
        console.error('Failed to flush performance metrics:', error);
        // Put metrics back in buffer for retry
        this.metricsBuffer.unshift(...metricsToFlush);
      }
    } catch (error) {
      console.error('Error flushing performance metrics:', error);
    }
  }

  /**
   * Schedule a flush operation
   */
  private scheduleFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flushMetrics();
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Force flush all pending metrics
   */
  public async flush(): Promise<void> {
    await this.flushMetrics();
  }

  /**
   * Destroy the service and clean up resources
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushMetrics(); // Final flush
  }
}

// Export singleton instance
export const apiPerformanceService = ApiPerformanceService.getInstance();

/**
 * Utility function to wrap API calls with performance tracking
 */
export function withPerformanceTracking<T>(
  endpoint: string,
  method: string = 'GET'
) {
  return async (apiCall: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();
    let statusCode = 200;
    
    try {
      const result = await apiCall();
      return result;
    } catch (error: any) {
      statusCode = error.status || error.statusCode || 500;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiPerformanceService.trackApiCall(endpoint, method, responseTime, statusCode);
    }
  };
}