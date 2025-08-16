import { supabase } from '@/integrations/supabase/client';

interface ErrorLogEntry {
  error_type: string;
  error_message: string;
  error_context?: any;
  user_id?: string;
  timestamp: string;
  stack_trace?: string;
  url?: string;
  user_agent?: string;
}

interface ErrorRecoveryOptions {
  retry?: boolean;
  fallback?: () => void;
  notify?: boolean;
  redirect?: string;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  async logError(
    error: Error | string,
    context?: any,
    options?: ErrorRecoveryOptions
  ): Promise<void> {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const stackTrace = typeof error === 'object' ? error.stack : undefined;

      const errorEntry: ErrorLogEntry = {
        error_type: 'application_error',
        error_message: errorMessage,
        error_context: {
          ...context,
          component: context?.component || 'unknown',
          action: context?.action || 'unknown',
          props: context?.props || {}
        },
        timestamp: new Date().toISOString(),
        stack_trace: stackTrace,
        url: window.location.href,
        user_agent: navigator.userAgent
      };

      // Log to console for development
      console.error('🚨 Application Error:', errorEntry);

      // Log to database via RPC function
      await supabase.rpc('log_application_error', {
        error_type: errorEntry.error_type,
        error_message: errorEntry.error_message,
        error_context: errorEntry.error_context
      });

      // Handle recovery options
      if (options?.retry) {
        this.handleRetry(errorMessage, context, options);
      }

      if (options?.fallback) {
        options.fallback();
      }

      if (options?.notify) {
        this.notifyUser(errorMessage);
      }

      if (options?.redirect) {
        window.location.href = options.redirect;
      }

    } catch (loggingError) {
      // Fallback logging if database logging fails
      console.error('Failed to log error to database:', loggingError);
      console.error('Original error:', error);
    }
  }

  private handleRetry(
    errorKey: string,
    context: any,
    options: ErrorRecoveryOptions
  ): void {
    const attempts = this.retryAttempts.get(errorKey) || 0;
    
    if (attempts < this.maxRetries) {
      this.retryAttempts.set(errorKey, attempts + 1);
      
      setTimeout(() => {
        if (context?.retryFunction) {
          context.retryFunction();
        }
      }, Math.pow(2, attempts) * 1000); // Exponential backoff
    } else {
      this.retryAttempts.delete(errorKey);
      this.notifyUser('Maximum retry attempts reached. Please refresh the page.');
    }
  }

  private notifyUser(message: string): void {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg z-50';
    toast.textContent = `Error: ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 5000);
  }

  // API call wrapper with error handling
  async safeApiCall<T>(
    apiCall: () => Promise<T>,
    context?: any,
    options?: ErrorRecoveryOptions
  ): Promise<T | null> {
    try {
      return await apiCall();
    } catch (error) {
      await this.logError(error as Error, {
        ...context,
        api_call: true
      }, options);
      
      return null;
    }
  }

  // Database operation wrapper
  async safeDatabaseOperation<T>(
    operation: () => Promise<T>,
    context?: any
  ): Promise<{ data: T | null; error: boolean }> {
    try {
      const data = await operation();
      return { data, error: false };
    } catch (error) {
      await this.logError(error as Error, {
        ...context,
        database_operation: true
      });
      
      return { data: null, error: true };
    }
  }

  // Edge function call wrapper
  async safeEdgeFunctionCall<T>(
    functionName: string,
    payload?: any,
    context?: any
  ): Promise<{ data: T | null; error: boolean; message?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      return { data, error: false };
    } catch (error) {
      await this.logError(error as Error, {
        ...context,
        edge_function: functionName,
        payload
      });
      
      return { 
        data: null, 
        error: true, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Form validation error handler
  handleFormValidationError(
    fieldErrors: Record<string, string[]>,
    formContext?: any
  ): void {
    const errorMessage = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ');

    this.logError(`Form validation failed: ${errorMessage}`, {
      ...formContext,
      form_validation: true,
      field_errors: fieldErrors
    });
  }

  // Network error handler
  async handleNetworkError(
    error: Error,
    context?: any,
    options?: ErrorRecoveryOptions
  ): Promise<void> {
    const isOnline = navigator.onLine;
    
    await this.logError(error, {
      ...context,
      network_error: true,
      is_online: isOnline,
      connection_type: (navigator as any).connection?.effectiveType || 'unknown'
    }, {
      ...options,
      notify: true
    });

    if (!isOnline) {
      this.notifyUser('You appear to be offline. Please check your internet connection.');
    }
  }

  // Performance monitoring
  measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = performance.now();
    
    return operation().finally(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 5000) { // Log slow operations (>5s)
        this.logError(`Slow operation detected: ${operationName}`, {
          performance_issue: true,
          operation_name: operationName,
          duration_ms: duration
        });
      }
    });
  }

  // Memory usage monitoring
  monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (usageRatio > 0.9) { // Log if using >90% of memory
        this.logError('High memory usage detected', {
          memory_usage: true,
          used_heap_size: memory.usedJSHeapSize,
          heap_size_limit: memory.jsHeapSizeLimit,
          usage_ratio: usageRatio
        });
      }
    }
  }

  // Initialize monitoring
  initialize(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError(event.error || event.message, {
        global_error: true,
        filename: event.filename,
        line_number: event.lineno,
        column_number: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, {
        unhandled_rejection: true,
        promise: true
      });
    });

    // Monitor memory usage periodically
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 60000); // Every minute
  }
}

export const errorHandler = ErrorHandlingService.getInstance();

// React hook for error handling
export function useErrorHandler() {
  const logError = (error: Error | string, context?: any, options?: ErrorRecoveryOptions) => {
    return errorHandler.logError(error, context, options);
  };

  const safeApiCall = <T>(apiCall: () => Promise<T>, context?: any, options?: ErrorRecoveryOptions) => {
    return errorHandler.safeApiCall(apiCall, context, options);
  };

  const safeDatabaseOperation = <T>(operation: () => Promise<T>, context?: any) => {
    return errorHandler.safeDatabaseOperation(operation, context);
  };

  const safeEdgeFunctionCall = <T>(functionName: string, payload?: any, context?: any) => {
    return errorHandler.safeEdgeFunctionCall<T>(functionName, payload, context);
  };

  return {
    logError,
    safeApiCall,
    safeDatabaseOperation,
    safeEdgeFunctionCall
  };
}