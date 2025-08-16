import { useCallback } from 'react';
import { useErrorHandler } from '@/services/error-handling/ErrorHandlingService';

/**
 * Custom hook for error boundary integration
 * Provides standardized error handling for components
 */
export function useErrorBoundary() {
  const { logError } = useErrorHandler();

  const captureError = useCallback((error: Error, errorInfo?: any) => {
    // Log to our centralized error handling service
    logError(error, {
      component: 'ErrorBoundary',
      action: 'component_error_caught',
      errorInfo,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }, [logError]);

  const resetError = useCallback(() => {
    // Could trigger page refresh or navigation to safe state
    console.log('Error boundary reset triggered');
  }, []);

  return {
    captureError,
    resetError
  };
}