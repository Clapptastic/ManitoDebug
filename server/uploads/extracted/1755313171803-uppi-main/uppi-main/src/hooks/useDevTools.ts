
import { useState, useEffect, useCallback, useRef } from 'react';
import { isDevelopment } from '@/utils/devTools';
import { errorTracker, TrackedError } from '@/utils/errorTracker';

interface UseDevToolsReturn {
  captureError: (error: unknown, context?: string) => void;
  errorCount: number;
  resetErrors: () => void;
  lastError: Error | null;
  errors: Array<{error: unknown; context: string; timestamp: number}>;
  trackedErrors: TrackedError[];
}

/**
 * Hook for using dev tools features in components
 */
export const useDevTools = (): UseDevToolsReturn => {
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [trackedErrors, setTrackedErrors] = useState<TrackedError[]>([]);
  const errorsRef = useRef<Array<{error: unknown; context: string; timestamp: number}>>([]);
  
  // Function to capture and log errors
  const captureError = useCallback((error: unknown, context = 'component') => {
    if (!isDevelopment()) return error;
    
    const errorObj = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : 'Unknown error');
    
    console.error(`[DevTools] Error in ${context}:`, errorObj);
    
    // Add error to our tracking array
    const errorEntry = {
      error,
      context,
      timestamp: Date.now()
    };
    errorsRef.current.push(errorEntry);
    
    // Track error in the centralized error tracker
    errorTracker.trackError(errorObj, context);
    
    setErrorCount(count => count + 1);
    setLastError(errorObj);
    
    return errorObj;
  }, []);
  
  // Reset error count
  const resetErrors = useCallback(() => {
    setErrorCount(0);
    setLastError(null);
    errorsRef.current = [];
  }, []);
  
  // Subscribe to error tracker updates
  useEffect(() => {
    if (!isDevelopment()) return;
    
    const unsubscribe = errorTracker.subscribe((errors) => {
      setTrackedErrors(errors);
      setErrorCount(errors.length);
    });
    
    // Initial load of errors
    setTrackedErrors(errorTracker.getErrors());
    setErrorCount(errorTracker.getErrors().length);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Debug monitoring for DevTools performance
  useEffect(() => {
    if (!isDevelopment()) return;
    
    const interval = setInterval(() => {
      if (errorCount > 50) {
        console.warn('[DevTools] Warning: Large number of errors detected. Consider resetting error count.');
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [errorCount]);
  
  return {
    captureError,
    errorCount,
    resetErrors,
    lastError,
    errors: errorsRef.current,
    trackedErrors
  };
};

export default useDevTools;
