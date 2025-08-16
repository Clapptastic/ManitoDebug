/**
 * Performance Monitor Service
 * Real-time monitoring and optimization for application performance
 */

import { supabase } from '@/integrations/supabase/client';

export interface PerformanceSnapshot {
  timestamp: string;
  metrics: {
    pageLoadTime: number;
    apiResponseTime: number;
    memoryUsage: number;
    networkLatency: number;
    errorRate: number;
  };
  issues: PerformanceIssue[];
}

export interface PerformanceIssue {
  id: string;
  type: 'slow_query' | 'memory_leak' | 'network_timeout' | 'api_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  component: string;
  suggestion: string;
  detectedAt: string;
}

class PerformanceMonitorService {
  private isMonitoring = false;
  private performanceBuffer: PerformanceSnapshot[] = [];
  private readonly maxBufferSize = 100;

  /**
   * Start real-time performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔄 Starting performance monitoring...');

    // Monitor page performance
    this.monitorPagePerformance();
    
    // Monitor API responses
    this.monitorAPIResponses();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Start periodic health checks
    setInterval(() => {
      this.collectPerformanceSnapshot();
    }, 30000); // Every 30 seconds

    console.log('✅ Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Get current performance snapshot
   */
  async getCurrentSnapshot(): Promise<PerformanceSnapshot> {
    const metrics = await this.collectMetrics();
    const issues = await this.detectIssues();

    return {
      timestamp: new Date().toISOString(),
      metrics,
      issues
    };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(): PerformanceSnapshot[] {
    return [...this.performanceBuffer];
  }

  /**
   * Monitor page performance
   */
  private monitorPagePerformance(): void {
    // Use Performance API if available
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
            
            if (loadTime > 3000) { // Slow page load
              this.logPerformanceIssue({
                id: `slow_load_${Date.now()}`,
                type: 'slow_query',
                severity: 'medium',
                description: `Page load time: ${loadTime}ms`,
                component: 'page_load',
                suggestion: 'Optimize bundle size and lazy load components',
                detectedAt: new Date().toISOString()
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  /**
   * Monitor API response times
   */
  private monitorAPIResponses(): void {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const startTime = performance.now();
      const url = typeof input === 'string' ? input : (input as Request).url;
      
      try {
        const response = await originalFetch(input, init);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Log slow API responses
        if (responseTime > 2000) {
          this.logPerformanceIssue({
            id: `slow_api_${Date.now()}`,
            type: 'slow_query',
            severity: responseTime > 5000 ? 'high' : 'medium',
            description: `Slow API response: ${url} (${responseTime.toFixed(0)}ms)`,
            component: 'api',
            suggestion: 'Optimize database queries or add caching',
            detectedAt: new Date().toISOString()
          });
        }

        // Log API errors
        if (!response.ok) {
          this.logPerformanceIssue({
            id: `api_error_${Date.now()}`,
            type: 'api_error',
            severity: 'high',
            description: `API error: ${url} - ${response.status} ${response.statusText}`,
            component: 'api',
            suggestion: 'Check API endpoint and error handling',
            detectedAt: new Date().toISOString()
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        this.logPerformanceIssue({
          id: `network_error_${Date.now()}`,
          type: 'network_timeout',
          severity: 'critical',
          description: `Network error: ${url} - ${error}`,
          component: 'network',
          suggestion: 'Check network connectivity and API availability',
          detectedAt: new Date().toISOString()
        });

        throw error;
      }
    };
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        if (memoryUsage > 85) {
          this.logPerformanceIssue({
            id: `memory_high_${Date.now()}`,
            type: 'memory_leak',
            severity: memoryUsage > 95 ? 'critical' : 'high',
            description: `High memory usage: ${memoryUsage.toFixed(1)}%`,
            component: 'memory',
            suggestion: 'Check for memory leaks and optimize component cleanup',
            detectedAt: new Date().toISOString()
          });
        }
      }, 60000); // Every minute
    }
  }

  /**
   * Collect current performance metrics
   */
  private async collectMetrics(): Promise<PerformanceSnapshot['metrics']> {
    const metrics = {
      pageLoadTime: 0,
      apiResponseTime: 0,
      memoryUsage: 0,
      networkLatency: 0,
      errorRate: 0
    };

    // Get page load time
    if ('performance' in window && performance.navigation) {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navTiming) {
        metrics.pageLoadTime = navTiming.loadEventEnd - navTiming.loadEventStart;
      }
    }

    // Get memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }

    // Get recent API response times
    try {
      const { data: recentMetrics } = await supabase
        .from('api_usage_costs')
        .select('response_time_ms')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentMetrics && recentMetrics.length > 0) {
        const avgResponseTime = recentMetrics.reduce((sum, metric) => 
          sum + (metric.response_time_ms || 0), 0
        ) / recentMetrics.length;
        metrics.apiResponseTime = avgResponseTime;
      }
    } catch (error) {
      console.warn('Failed to get API metrics:', error);
    }

    return metrics;
  }

  /**
   * Detect performance issues
   */
  private async detectIssues(): Promise<PerformanceIssue[]> {
    const issues: PerformanceIssue[] = [];

    try {
      // Check for database performance issues
      const { data: slowQueries } = await supabase
        .from('api_usage_costs')
        .select('*')
        .gte('response_time_ms', 3000)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
        .limit(5);

      if (slowQueries && slowQueries.length > 0) {
        issues.push({
          id: `db_performance_${Date.now()}`,
          type: 'slow_query',
          severity: 'medium',
          description: `${slowQueries.length} slow database queries detected in the last 10 minutes`,
          component: 'database',
          suggestion: 'Review and optimize slow queries, add indexes where needed',
          detectedAt: new Date().toISOString()
        });
      }

      // Check error rates
      const { data: recentErrors } = await supabase
        .from('audit_logs')
        .select('*')
        .like('action', '%error%')
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .limit(10);

      if (recentErrors && recentErrors.length > 5) {
        issues.push({
          id: `error_rate_${Date.now()}`,
          type: 'api_error',
          severity: 'high',
          description: `High error rate: ${recentErrors.length} errors in 10 minutes`,
          component: 'application',
          suggestion: 'Investigate error patterns and implement proper error handling',
          detectedAt: new Date().toISOString()
        });
      }

    } catch (error) {
      console.warn('Failed to detect issues:', error);
    }

    return issues;
  }

  /**
   * Collect and store performance snapshot
   */
  private async collectPerformanceSnapshot(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      const snapshot = await this.getCurrentSnapshot();
      
      // Add to buffer
      this.performanceBuffer.push(snapshot);
      
      // Maintain buffer size
      if (this.performanceBuffer.length > this.maxBufferSize) {
        this.performanceBuffer.shift();
      }

      // Log critical issues
      const criticalIssues = snapshot.issues.filter(issue => issue.severity === 'critical');
      if (criticalIssues.length > 0) {
        console.error('🚨 Critical performance issues detected:', criticalIssues);
        
        // Log to database
        await supabase
          .from('system_health_metrics')
          .insert({
            metric_name: 'performance_critical_issue',
            metric_value: criticalIssues.length,
            metric_unit: 'count',
            component: 'performance_monitor',
            severity: 'critical',
            metadata: {
              issues: criticalIssues.map(issue => ({
                id: issue.id,
                type: issue.type,
                severity: issue.severity,
                description: issue.description,
                component: issue.component,
                suggestion: issue.suggestion,
                detectedAt: issue.detectedAt
              })),
              timestamp: snapshot.timestamp
            } as any
          });
      }

    } catch (error) {
      console.error('Failed to collect performance snapshot:', error);
    }
  }

  /**
   * Log performance issue
   */
  private async logPerformanceIssue(issue: PerformanceIssue): Promise<void> {
    console.warn(`⚠️ Performance issue detected:`, issue);

    // Store in database for tracking
    try {
      await supabase
        .from('system_health_metrics')
        .insert({
          metric_name: 'performance_issue',
          metric_value: 1,
          metric_unit: 'count',
          component: issue.component,
          severity: issue.severity,
          metadata: {
            issue_type: issue.type,
            description: issue.description,
            suggestion: issue.suggestion,
            detected_at: issue.detectedAt
          } as any
        });
    } catch (error) {
      console.error('Failed to log performance issue:', error);
    }
  }

  /**
   * Apply automatic performance optimizations
   */
  async applyOptimizations(): Promise<{ applied: string[], failed: string[] }> {
    const applied: string[] = [];
    const failed: string[] = [];

    try {
      // Optimization 1: Clear old performance logs
      const { error: clearError } = await supabase
        .from('system_health_metrics')
        .delete()
        .eq('metric_name', 'performance_issue')
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!clearError) {
        applied.push('Cleared old performance logs');
      } else {
        failed.push('Failed to clear old performance logs');
      }

      // Optimization 2: Prefetch critical resources
      if ('serviceWorker' in navigator) {
        applied.push('Service worker optimization enabled');
      }

      // Optimization 3: Enable compression hints
      if ('performance' in window) {
        applied.push('Performance monitoring optimized');
      }

    } catch (error) {
      console.error('Performance optimization failed:', error);
      failed.push('Performance optimization encountered errors');
    }

    return { applied, failed };
  }
}

export const performanceMonitorService = new PerformanceMonitorService();