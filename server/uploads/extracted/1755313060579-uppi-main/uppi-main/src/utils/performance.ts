/**
 * Performance optimization utilities for the application
 */

import { useCallback, useRef, useEffect } from 'react';

/**
 * Debounce hook for performance optimization
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const debounceRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Throttle hook for performance optimization
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const throttleRef = useRef<boolean>(false);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (!throttleRef.current) {
        callback(...args);
        throttleRef.current = true;
        setTimeout(() => {
          throttleRef.current = false;
        }, delay);
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
}

/**
 * Memory cleanup utility
 */
export function cleanupMemory() {
  // Force garbage collection if available (development only)
  if (process.env.NODE_ENV === 'development' && (globalThis as any).gc) {
    try {
      (globalThis as any).gc();
    } catch (e) {
      // Ignore if gc is not available
    }
  }
}

/**
 * Performance monitor utility
 */
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  static start(label: string): void {
    this.measurements.set(label, performance.now());
  }

  static end(label: string): number {
    const start = this.measurements.get(label);
    if (!start) {
      console.warn(`No measurement found for label: ${label}`);
      return 0;
    }
    
    const duration = performance.now() - start;
    this.measurements.delete(label);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          this.end(label);
        }) as unknown as T;
      }
      
      return result;
    } finally {
      if (!(fn() instanceof Promise)) {
        this.end(label);
      }
    }
  }
}

/**
 * Async performance monitoring
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  PerformanceMonitor.start(label);
  try {
    const result = await fn();
    return result;
  } finally {
    PerformanceMonitor.end(label);
  }
}