import { toast } from '@/hooks/use-toast';
import { errorMonitoringService } from '@/services/monitoring/errorMonitoringService';

export interface ErrorContext {
  component: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error | string;
  context: ErrorContext;
  userAgent?: string;
  url?: string;
  resolved: boolean;
}

class ErrorHandler {
  private errors: ErrorReport[] = [];
  private maxErrors = 100;

  handleError(error: Error | string, context: ErrorContext): string {
    const errorReport: ErrorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: false
    };

    // Store error locally
    this.errors.unshift(errorReport);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Use production-safe error logging
    import('../utils/security/productionErrorHandler').then(({ logErrorSecurely }) => {
      logErrorSecurely(error, context);
    }).catch(() => {
      // Fallback logging if import fails
      console.error(`[${context.component}:${context.action}]`, {
        error: error instanceof Error ? error.message : error,
        context,
        timestamp: errorReport.timestamp,
        id: errorReport.id
      });
    });

    // Show user-friendly toast based on severity
    this.showUserNotification(error, context);

    // Optionally send to logging service
    this.logToService(errorReport);

    // Forward to centralized backend logger (non-blocking)
    try {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      void errorMonitoringService.logError({
        error_type: 'client',
        error_message: errorObj.message,
        error_stack: (errorObj as Error).stack,
        component: context.component,
        action: context.action,
        metadata: context.metadata,
        severity: context.severity === 'critical' ? 'critical' : (context.severity === 'high' ? 'high' : (context.severity === 'medium' ? 'medium' : 'low')),
      });
    } catch {}

    return errorReport.id;
  }

  private showUserNotification(error: Error | string, context: ErrorContext) {
    const message = this.getUserFriendlyMessage(error, context);
    
    switch (context.severity) {
      case 'critical':
        toast({
          title: 'Critical Error',
          description: message,
          variant: 'destructive',
        });
        break;
      case 'high':
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        break;
      case 'medium':
        toast({
          title: 'Warning',
          description: message,
        });
        break;
      case 'low':
        // Silent logging for low-severity errors
        break;
    }
  }

  private getUserFriendlyMessage(error: Error | string, context: ErrorContext): string {
    const errorString = typeof error === 'string' ? error : error.message;
    
    // Map common errors to user-friendly messages
    if (errorString.includes('auth')) {
      return 'Authentication required. Please sign in to continue.';
    }
    
    if (errorString.includes('network') || errorString.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (errorString.includes('rate limit')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    
    if (context.component === 'CompetitorAnalysis') {
      if (context.action === 'startAnalysis') {
        return 'Failed to start competitor analysis. Please check your API settings and try again.';
      }
      if (context.action === 'saveAnalysis') {
        return 'Failed to save analysis results. Your work has been preserved locally.';
      }
    }
    
    // Generic fallback
    return `Something went wrong with ${context.action}. Please try again or contact support if the problem persists.`;
  }

  private async logToService(errorReport: ErrorReport) {
    try {
      // Only log if user is authenticated and severity is medium or higher
      if (errorReport.context.severity === 'low') return;
      
      // This would integrate with your error logging service
      // For now, we'll just store it locally
      const existingLogs = localStorage.getItem('error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.unshift({
        ...errorReport,
        timestamp: errorReport.timestamp.toISOString()
      });
      
      // Keep only last 50 errors in localStorage
      if (logs.length > 50) {
        logs.splice(50);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (loggingError) {
      console.warn('Failed to log error to service:', loggingError);
    }
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  markResolved(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  clearErrors(): void {
    this.errors = [];
  }

  getErrorsByComponent(component: string): ErrorReport[] {
    return this.errors.filter(e => e.context.component === component);
  }

  getUnresolvedErrors(): ErrorReport[] {
    return this.errors.filter(e => !e.resolved);
  }

  // Utility method for retrying operations with exponential backoff
  async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000,
    context?: ErrorContext
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          if (context) {
            this.handleError(lastError, {
              ...context,
              metadata: {
                ...context.metadata,
                attempts: attempt,
                retryFailed: true
              }
            });
          }
          throw lastError;
        }
        
        // Exponential backoff: baseDelay * 2^(attempt-1)
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Convenience functions
export const handleError = (error: Error | string, context: ErrorContext) => 
  errorHandler.handleError(error, context);

export const retryOperation = <T>(
  operation: () => Promise<T>,
  maxAttempts?: number,
  baseDelay?: number,
  context?: ErrorContext
) => errorHandler.retry(operation, maxAttempts, baseDelay, context);

// React hook for error handling
export const useErrorHandler = () => {
  return {
    handleError: errorHandler.handleError.bind(errorHandler),
    retry: errorHandler.retry.bind(errorHandler),
    getErrors: errorHandler.getErrors.bind(errorHandler),
    markResolved: errorHandler.markResolved.bind(errorHandler),
    clearErrors: errorHandler.clearErrors.bind(errorHandler)
  };
};

export default errorHandler;
