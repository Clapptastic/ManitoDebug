import { supabase } from '@/integrations/supabase/client';

export interface ErrorReport {
  id?: string;
  user_id?: string;
  error_type: 'client' | 'server' | 'network' | 'validation' | 'api';
  error_message: string;
  error_stack?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  environment?: 'development' | 'production';
  user_agent?: string;
  url?: string;
  created_at?: string;
}

class ErrorMonitoringService {
  private isDevelopment = import.meta.env.DEV;

  async logError(error: ErrorReport) {
    try {
      // Always log to console in development
      if (this.isDevelopment) {
        console.group(`🚨 ${error.severity.toUpperCase()} ERROR: ${error.error_type}`);
        console.error('Message:', error.error_message);
        console.error('Component:', error.component);
        console.error('Action:', error.action);
        console.error('Stack:', error.error_stack);
        console.error('Metadata:', error.metadata);
        console.groupEnd();
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare error record
      const errorRecord: ErrorReport = {
        ...error,
        user_id: user?.id,
        environment: this.isDevelopment ? 'development' : 'production',
        user_agent: navigator.userAgent,
        url: window.location.href,
        created_at: new Date().toISOString()
      };

      // Send to centralized backend logger (Edge Function)
      try {
        const payload = {
          message: errorRecord.error_message,
          severity: error.severity,
          error_type: error.error_type,
          source: 'frontend',
          component: error.component,
          route: window.location.pathname,
          stack: error.error_stack,
          metadata: error.metadata,
          session_id: (window as any)?.sessionStorage?.getItem?.('session_id') || undefined,
          url: errorRecord.url,
          user_agent: errorRecord.user_agent,
        };
        
        const { data, error: invokeError } = await supabase.functions.invoke('log-error-event', { 
          body: payload 
        });
        
        if (invokeError) {
          console.warn('Failed to send error to backend logger:', invokeError.message || invokeError);
          // Fallback: try to log directly to console with structured format
          console.error('[ERROR_LOGGER_FALLBACK]', JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            service: 'errorMonitoringService',
            message: 'Edge function log-error-event failed',
            error: invokeError,
            originalPayload: payload
          }));
        } else if (this.isDevelopment) {
          console.log('✅ Error successfully logged to backend:', data);
        }
      } catch (sendErr) {
        console.warn('Exception while invoking log-error-event:', sendErr);
        // Fallback: try to log directly to console with structured format
        console.error('[ERROR_LOGGER_EXCEPTION]', JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          service: 'errorMonitoringService',
          message: 'Exception during edge function invocation',
          error: sendErr instanceof Error ? { message: sendErr.message, stack: sendErr.stack } : sendErr,
          originalPayload: {
            message: errorRecord.error_message,
            severity: error.severity,
            error_type: error.error_type,
            source: 'frontend',
            component: error.component
          }
        }));
      }

      // Dev channel broadcast (optional)
      if (this.isDevelopment) {
        try {
          await supabase.channel('dev-errors').send({
            type: 'broadcast',
            event: 'error',
            payload: errorRecord
          });
        } catch (channelError) {
          console.error('Failed to send to channel:', channelError);
        }
      }

    } catch (monitoringError) {
      console.error('Error monitoring service failed:', monitoringError);
    }
  }

  // Convenience methods for different error types
  async logClientError(error: Error, component?: string, action?: string, metadata?: any) {
    await this.logError({
      error_type: 'client',
      error_message: error.message,
      error_stack: error.stack,
      component,
      action,
      metadata,
      severity: 'medium',
      environment: this.isDevelopment ? 'development' : 'production'
    });
  }

  async logNetworkError(error: any, endpoint?: string, metadata?: any) {
    await this.logError({
      error_type: 'network',
      error_message: error.message || 'Network request failed',
      error_stack: error.stack,
      component: 'NetworkLayer',
      action: `Request to ${endpoint}`,
      metadata: { endpoint, ...metadata },
      severity: 'high',
      environment: this.isDevelopment ? 'development' : 'production'
    });
  }

  async logValidationError(message: string, component?: string, data?: any) {
    await this.logError({
      error_type: 'validation',
      error_message: message,
      component,
      action: 'Data validation',
      metadata: { data },
      severity: 'low',
      environment: this.isDevelopment ? 'development' : 'production'
    });
  }

  async logApiError(error: any, provider?: string, endpoint?: string, metadata?: any) {
    await this.logError({
      error_type: 'api',
      error_message: error.message || 'API request failed',
      error_stack: error.stack,
      component: 'API Service',
      action: `${provider} API call`,
      metadata: { provider, endpoint, ...metadata },
      severity: 'high',
      environment: this.isDevelopment ? 'development' : 'production'
    });
  }

  async logCriticalError(error: Error, component?: string, action?: string, metadata?: any) {
    await this.logError({
      error_type: 'server',
      error_message: error.message,
      error_stack: error.stack,
      component,
      action,
      metadata,
      severity: 'critical',
      environment: this.isDevelopment ? 'development' : 'production'
    });
  }

  // Global error handler setup
  setupGlobalErrorHandling() {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logClientError(
        new Error(event.message),
        'GlobalErrorHandler',
        'Unhandled Error',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logClientError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        'GlobalErrorHandler',
        'Promise Rejection',
        { reason: event.reason }
      );
    });

    // React Error Boundary integration (when using error boundaries)
    (window as any).__ERROR_MONITORING__ = this;
  }

  // Performance monitoring
  async logPerformanceMetric(name: string, value: number, metadata?: any) {
    if (this.isDevelopment) {
      console.log(`📊 PERFORMANCE: ${name} = ${value}ms`, metadata);
    }

    // For now, just log to console until types are updated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log(`Performance metric logged: ${name} = ${value} for user ${user?.id}`);
    } catch (error) {
      console.error('Failed to log performance metric:', error);
    }
  }
}

export const errorMonitoringService = new ErrorMonitoringService();

// Initialize global error handling
if (typeof window !== 'undefined') {
  errorMonitoringService.setupGlobalErrorHandling();
}