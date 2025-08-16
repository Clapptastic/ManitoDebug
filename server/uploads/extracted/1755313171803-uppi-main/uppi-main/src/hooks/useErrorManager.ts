/**
 * Unified Error Manager Hook
 * Single source of truth for error management in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { errorManager, type TrackedError, type ErrorCategory } from '@/services/core/ErrorManager';

export interface UseErrorManagerReturn {
  // Error state
  errors: TrackedError[];
  errorCount: number;
  hasErrors: boolean;
  
  // Error handling methods
  handleError: (error: unknown, category?: ErrorCategory | string, context?: string) => Promise<string>;
  trackError: (error: Error, context?: string) => Promise<void>;
  logError: (error: any, category: ErrorCategory, component?: string, action?: string, metadata?: any) => Promise<void>;
  
  // Error management
  clearErrors: () => void;
  clearError: (id: string) => void;
  
  // Convenience methods
  logApiError: (error: any, provider?: string, endpoint?: string, metadata?: any) => Promise<void>;
  logNetworkError: (error: any, endpoint?: string, metadata?: any) => Promise<void>;
  logValidationError: (message: string, component?: string, data?: any) => Promise<void>;
  
  // Performance
  logPerformanceMetric: (name: string, value: number, metadata?: any) => Promise<void>;
}

export const useErrorManager = (): UseErrorManagerReturn => {
  const [errors, setErrors] = useState<TrackedError[]>([]);
  const [errorCount, setErrorCount] = useState(0);

  // Subscribe to error updates
  useEffect(() => {
    const unsubscribe = errorManager.subscribe((updatedErrors) => {
      setErrors(updatedErrors);
      setErrorCount(updatedErrors.length);
    });

    // Initialize with current errors
    const initializeErrors = async () => {
      try {
        const currentErrors = await errorManager.getErrors();
        setErrors(currentErrors);
        setErrorCount(currentErrors.length);
      } catch (error) {
        console.error('Error initializing errors:', error);
      }
    };

    initializeErrors();
    return unsubscribe;
  }, []);

  // Unified error handling
  const handleError = useCallback(async (error: unknown, category?: ErrorCategory | string, context?: string): Promise<string> => {
    try {
      await errorManager.handleError(error as Error, context);
      return 'Error handled successfully';
    } catch (err) {
      console.error('Error handling failed:', err);
      return 'Error handling failed';
    }
  }, []);

  // Error tracking
  const trackError = useCallback(async (error: Error, context?: string) => {
    const trackedError: TrackedError = {
      id: Math.random().toString(36),
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: 'medium',
      count: 1,
      first_occurrence: new Date().toISOString(),
      last_occurrence: new Date().toISOString(),
      affected_users: [],
      error_type: error.name || 'Error'
    };
    await errorManager.trackError(trackedError);
  }, []);

  // Generic error logging
  const logError = useCallback(async (
    error: any, 
    category: ErrorCategory, 
    component?: string, 
    action?: string, 
    metadata?: any
  ) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    await errorManager.logError(errorObj, {
      category,
      component,
      action,
      ...metadata
    });
  }, []);

  // Error management
  const clearErrors = useCallback(async () => {
    await errorManager.clearErrors();
    setErrors([]);
    setErrorCount(0);
  }, []);

  const clearError = useCallback(async (id: string) => {
    const currentErrors = await errorManager.getErrors();
    const filteredErrors = currentErrors.filter(e => e.id !== id);
    setErrors(filteredErrors);
    setErrorCount(filteredErrors.length);
  }, []);

  // Convenience methods
  const logApiError = useCallback(async (error: any, provider?: string, endpoint?: string, metadata?: any) => {
    await logError(error, 'api', 'API', provider || 'unknown', { endpoint, ...metadata });
  }, [logError]);

  const logNetworkError = useCallback(async (error: any, endpoint?: string, metadata?: any) => {
    await logError(error, 'network', 'Network', 'request', { endpoint, ...metadata });
  }, [logError]);

  const logValidationError = useCallback(async (message: string, component?: string, data?: any) => {
    await logError(new Error(message), 'validation', component || 'Unknown', 'validation', data);
  }, [logError]);

  const logPerformanceMetric = useCallback(async (name: string, value: number, metadata?: any) => {
    await logError(new Error(`Performance metric: ${name} = ${value}`), 'performance', 'Performance', 'metric', { value, ...metadata });
  }, [logError]);

  return {
    // State
    errors,
    errorCount,
    hasErrors: errorCount > 0,
    
    // Methods
    handleError,
    trackError,
    logError,
    clearErrors,
    clearError,
    logApiError,
    logNetworkError,
    logValidationError,
    logPerformanceMetric
  };
};