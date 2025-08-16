import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

/**
 * Performance monitoring component for production metrics
 * Tracks page load times, API calls, and resource usage
 */
export function PerformanceMonitor() {
  const logPerformanceMetric = useCallback(async (metricName: string, value: number, metadata?: any) => {
    try {
      await supabase.functions.invoke('performance-monitor', {
        body: {
          metric_name: metricName,
          value,
          timestamp: new Date().toISOString(),
          metadata
        }
      });
    } catch (error) {
      console.warn('Failed to log performance metric:', error);
    }
  }, []);

  useEffect(() => {
    // Monitor page load performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: PerformanceEntry) => {
        if (entry.entryType === 'navigation') {
          logPerformanceMetric('page_load_time', entry.duration, {
            page: window.location.pathname,
            type: 'navigation'
          });
        } else if (entry.entryType === 'resource' && entry.name.includes('api')) {
          logPerformanceMetric('api_response_time', entry.duration, {
            resource: entry.name,
            type: 'api_call'
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'resource'] });

    // Monitor memory usage
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usageRatio > 0.8) { // Log if using >80% of memory
          logPerformanceMetric('memory_usage_high', usageRatio, {
            used_heap_size: memory.usedJSHeapSize,
            heap_size_limit: memory.jsHeapSizeLimit
          });
        }
      }
    };

    const memoryInterval = setInterval(checkMemoryUsage, 30000); // Check every 30 seconds

    return () => {
      observer.disconnect();
      clearInterval(memoryInterval);
    };
  }, [logPerformanceMetric]);

  return null; // This is a monitoring component with no visual output
}