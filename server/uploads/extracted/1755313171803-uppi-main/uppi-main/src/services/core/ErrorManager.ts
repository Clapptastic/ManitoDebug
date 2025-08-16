import { supabase } from '@/integrations/supabase/client';

export interface ErrorEntry {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  user_id?: string;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category?: ErrorCategory;
  resolved?: boolean;
  resolution_notes?: string;
}

export interface TrackedError extends ErrorEntry {
  count: number;
  first_occurrence: string;
  last_occurrence: string;
  affected_users: string[];
  error_type: string;
}

export type ErrorCategory = 
  | 'api' 
  | 'database' 
  | 'validation' 
  | 'network' 
  | 'authentication' 
  | 'authorization' 
  | 'performance' 
  | 'ui' 
  | 'business_logic' 
  | 'external_service';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorOperations {
  logError(error: Error | string, context?: Record<string, any>, severity?: ErrorSeverity): Promise<void>;
  getErrors(category?: ErrorCategory, severity?: ErrorSeverity): Promise<TrackedError[]>;
  trackError(error: TrackedError): Promise<void>;
  handleError(error: Error, context?: string): Promise<void>;
  subscribe(callback: (errors: TrackedError[]) => void): () => void;
  getRecentErrors(limit?: number): Promise<ErrorEntry[]>;
  clearErrors(): Promise<void>;
}

export class ErrorManager implements ErrorOperations {
  private static instance: ErrorManager;
  private errorQueue: ErrorEntry[] = [];
  private isProcessing = false;
  private subscribers: Array<(errors: TrackedError[]) => void> = [];
  private errorCache = new Map<string, TrackedError>();

  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  async logError(error: Error | string, context?: Record<string, any>, severity: ErrorSeverity = 'medium'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const errorEntry: ErrorEntry = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: typeof error === 'string' ? error : error.message,
        stack: typeof error !== 'string' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        user_id: user?.id,
        context,
        severity,
        category: this.categorizeError(error, context),
        resolved: false
      };

      // Add to queue for processing
      this.errorQueue.push(errorEntry);
      
      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processErrorQueue();
      }

      // Log to console for immediate visibility
      console.error('Error logged:', errorEntry);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  async getErrors(category?: ErrorCategory, severity?: ErrorSeverity): Promise<TrackedError[]> {
    try {
      let query = supabase
        .from('edge_function_metrics')
        .select('*')
        .eq('function_name', 'error_log')
        .order('created_at', { ascending: false });

      if (severity) {
        query = query.eq('metadata->>severity', severity);
      }

      if (category) {
        query = query.eq('metadata->>category', category);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      return (data || []).map(this.transformToTrackedError);
    } catch (error) {
      console.error('Error fetching errors:', error);
      return [];
    }
  }

  async trackError(error: TrackedError): Promise<void> {
    try {
      await supabase
        .from('edge_function_metrics')
        .insert({
          function_name: 'error_track',
          status: 'error',
          execution_time_ms: 0,
          user_id: error.user_id,
          error_message: error.message,
          metadata: {
            stack: error.stack,
            context: error.context,
            severity: error.severity,
            category: error.category,
            count: error.count,
            first_occurrence: error.first_occurrence,
            last_occurrence: error.last_occurrence,
            affected_users: error.affected_users,
            error_type: error.error_type
          }
        });

      // Update cache
      this.errorCache.set(error.id, error);
      this.notifySubscribers();
    } catch (error) {
      console.error('Error tracking error:', error);
    }
  }

  async handleError(error: Error, context?: string): Promise<void> {
    const severity = this.determineSeverity(error);
    const category = this.categorizeError(error, { context });
    
    await this.logError(error, { context, handled: true }, severity);
    
    // For critical errors, also track them
    if (severity === 'critical') {
      const trackedError: TrackedError = {
        id: `tracked_${Date.now()}`,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        severity,
        category,
        count: 1,
        first_occurrence: new Date().toISOString(),
        last_occurrence: new Date().toISOString(),
        affected_users: [],
        error_type: error.name || 'UnknownError',
        context: { context, handled: true }
      };
      
      await this.trackError(trackedError);
    }
  }

  subscribe(callback: (errors: TrackedError[]) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  async getRecentErrors(limit = 50): Promise<ErrorEntry[]> {
    try {
      const { data, error } = await supabase
        .from('edge_function_metrics')
        .select('*')
        .eq('function_name', 'error_log')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        message: item.error_message || 'Unknown error',
        stack: (item.metadata as any)?.stack,
        timestamp: item.created_at,
        user_id: item.user_id,
        context: (item.metadata as any)?.context,
        severity: (item.metadata as any)?.severity || 'medium',
        category: (item.metadata as any)?.category,
        resolved: (item.metadata as any)?.resolved || false
      }));
    } catch (error) {
      console.error('Error fetching recent errors:', error);
      return [];
    }
  }

  async clearErrors(): Promise<void> {
    try {
      this.errorQueue = [];
      this.errorCache.clear();
      console.log('Error queue and cache cleared');
    } catch (error) {
      console.error('Error clearing errors:', error);
    }
  }

  // Additional error handling methods
  async logApiError(error: Error, endpoint: string, statusCode?: number): Promise<void> {
    await this.logError(error, { 
      type: 'api_error', 
      endpoint, 
      statusCode 
    }, 'high');
  }

  async logDatabaseError(error: Error, query?: string, table?: string): Promise<void> {
    await this.logError(error, { 
      type: 'database_error', 
      query, 
      table 
    }, 'critical');
  }

  async logNetworkError(error: Error, url?: string): Promise<void> {
    await this.logError(error, { 
      type: 'network_error', 
      url 
    }, 'medium');
  }

  async logValidationError(error: Error, field?: string, value?: any): Promise<void> {
    await this.logError(error, { 
      type: 'validation_error', 
      field, 
      value 
    }, 'low');
  }

  async logPerformanceMetric(metric: string, value: number, threshold: number): Promise<void> {
    if (value > threshold) {
      await this.logError(`Performance threshold exceeded: ${metric}`, {
        type: 'performance_issue',
        metric,
        value,
        threshold
      }, 'medium');
    }
  }

  // Private helper methods
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      while (this.errorQueue.length > 0) {
        const errorBatch = this.errorQueue.splice(0, 10); // Process in batches
        
        for (const error of errorBatch) {
          try {
            await supabase
              .from('edge_function_metrics')
              .insert({
                function_name: 'error_log',
                status: 'error',
                execution_time_ms: 0,
                user_id: error.user_id,
                error_message: error.message,
                metadata: {
                  stack: error.stack,
                  context: error.context,
                  severity: error.severity,
                  category: error.category,
                  timestamp: error.timestamp
                }
              });
          } catch (insertError) {
            console.error('Failed to insert error log:', insertError);
          }
        }
      }
    } catch (processError) {
      console.error('Error processing error queue:', processError);
    } finally {
      this.isProcessing = false;
    }
  }

  private categorizeError(error: Error | string, context?: Record<string, any>): ErrorCategory {
    const message = typeof error === 'string' ? error : error.message;
    const errorName = typeof error === 'string' ? '' : error.name;
    
    // API errors
    if (message.includes('fetch') || message.includes('network') || context?.type === 'api_error') {
      return 'api';
    }
    
    // Database errors
    if (message.includes('database') || message.includes('SQL') || context?.type === 'database_error') {
      return 'database';
    }
    
    // Validation errors
    if (errorName === 'ValidationError' || context?.type === 'validation_error') {
      return 'validation';
    }
    
    // Network errors
    if (message.includes('network') || message.includes('connection') || context?.type === 'network_error') {
      return 'network';
    }
    
    // Authentication errors
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authentication';
    }
    
    // Performance errors
    if (context?.type === 'performance_issue') {
      return 'performance';
    }
    
    return 'business_logic';
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('security')) {
      return 'critical';
    }
    
    if (message.includes('database') || message.includes('auth') || message.includes('payment')) {
      return 'high';
    }
    
    if (message.includes('validation') || message.includes('format')) {
      return 'low';
    }
    
    return 'medium';
  }

  private transformToTrackedError(item: any): TrackedError {
    return {
      id: item.id,
      message: item.error_message || 'Unknown error',
      stack: (item.metadata as any)?.stack,
      timestamp: item.created_at,
      user_id: item.user_id,
      context: (item.metadata as any)?.context,
      severity: (item.metadata as any)?.severity || 'medium',
      category: (item.metadata as any)?.category,
      count: (item.metadata as any)?.count || 1,
      first_occurrence: (item.metadata as any)?.first_occurrence || item.created_at,
      last_occurrence: (item.metadata as any)?.last_occurrence || item.created_at,
      affected_users: (item.metadata as any)?.affected_users || [],
      error_type: (item.metadata as any)?.error_type || 'UnknownError',
      resolved: (item.metadata as any)?.resolved || false
    };
  }

  private notifySubscribers(): void {
    const errors = Array.from(this.errorCache.values());
    this.subscribers.forEach(callback => {
      try {
        callback(errors);
      } catch (error) {
        console.error('Error in error manager subscriber:', error);
      }
    });
  }
}

export const errorManager = ErrorManager.getInstance();