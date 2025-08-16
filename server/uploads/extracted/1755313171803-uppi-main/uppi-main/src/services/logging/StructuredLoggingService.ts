/**
 * CONSOLIDATED Structured Logging Service
 * Single source of truth for application logging
 */

import { supabase } from '@/lib/supabase/client';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  errorStack?: string;
  requestId?: string;
}

export interface LogFilter {
  level?: LogLevel;
  component?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  limit?: number;
}

class StructuredLoggingService {
  private static instance: StructuredLoggingService;
  private logBuffer: LogEntry[] = [];
  private readonly bufferSize = 100;
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly flushInterval = 10000; // 10 seconds

  public static getInstance(): StructuredLoggingService {
    if (!StructuredLoggingService.instance) {
      StructuredLoggingService.instance = new StructuredLoggingService();
    }
    return StructuredLoggingService.instance;
  }

  /**
   * Log a debug message
   */
  public debug(
    message: string, 
    component?: string, 
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.DEBUG, message, component, undefined, metadata);
  }

  /**
   * Log an info message
   */
  public info(
    message: string, 
    component?: string, 
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.INFO, message, component, undefined, metadata);
  }

  /**
   * Log a warning message
   */
  public warn(
    message: string, 
    component?: string, 
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.WARN, message, component, undefined, metadata);
  }

  /**
   * Log an error message
   */
  public error(
    message: string, 
    component?: string, 
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.ERROR, message, component, undefined, {
      ...metadata,
      errorStack: error?.stack,
      errorName: error?.name
    });
  }

  /**
   * Log a critical error message
   */
  public critical(
    message: string, 
    component?: string, 
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.CRITICAL, message, component, undefined, {
      ...metadata,
      errorStack: error?.stack,
      errorName: error?.name
    });
  }

  /**
   * Log an admin operation
   */
  public adminOperation(
    action: string,
    component: string,
    metadata?: Record<string, any>
  ): void {
    this.log(LogLevel.INFO, `Admin operation: ${action}`, component, action, {
      ...metadata,
      isAdminOperation: true
    });
  }

  /**
   * Log an API operation
   */
  public apiOperation(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    metadata?: Record<string, any>
  ): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API ${method} ${endpoint} - ${statusCode}`, 'API', 'api_call', {
      ...metadata,
      endpoint,
      method,
      statusCode,
      responseTime,
      isApiOperation: true
    });
  }

  /**
   * Log a security event
   */
  public securityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ): void {
    const level = severity === 'critical' ? LogLevel.CRITICAL : 
                  severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
    
    this.log(level, `Security event: ${event}`, 'Security', 'security_event', {
      ...metadata,
      securitySeverity: severity,
      isSecurityEvent: true
    });
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    component?: string,
    action?: string,
    metadata?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      component,
      action,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      metadata,
      requestId: this.generateRequestId()
    };

    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(logEntry);
    }

    // Add to buffer for database logging
    this.logBuffer.push(logEntry);

    // Flush if buffer is full or if it's a critical message
    if (this.logBuffer.length >= this.bufferSize || level === LogLevel.CRITICAL) {
      this.flushLogs();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    const component = entry.component ? `[${entry.component}]` : '';
    const message = `${prefix} ${component} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(message, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.metadata);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.metadata);
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 CRITICAL: ${message}`, entry.metadata);
        break;
    }
  }

  /**
   * Flush logs to database
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const logsToFlush = [...this.logBuffer];
      this.logBuffer = [];

      // Clear the flush timer
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }

      // Try to send to admin operation logs if it's an admin operation
      const adminLogs = logsToFlush.filter(log => 
        log.metadata?.isAdminOperation || 
        log.metadata?.isSecurityEvent
      );

      const regularLogs = logsToFlush.filter(log => 
        !log.metadata?.isAdminOperation && 
        !log.metadata?.isSecurityEvent
      );

      // Send admin logs to admin_operation_logs table
      if (adminLogs.length > 0) {
        await this.flushAdminLogs(adminLogs);
      }

      // Send regular logs to audit_logs table
      if (regularLogs.length > 0) {
        await this.flushRegularLogs(regularLogs);
      }

    } catch (error) {
      console.error('Error flushing logs:', error);
      // Don't put logs back in buffer to avoid infinite loops
    }
  }

  /**
   * Flush admin-specific logs
   */
  private async flushAdminLogs(logs: LogEntry[]): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('log-admin-operation', {
        body: {
          logs: logs.map(log => ({
            operation_type: log.action || log.message,
            resource_type: log.component,
            resource_id: log.metadata?.resourceId,
            details: {
              level: log.level,
              message: log.message,
              metadata: log.metadata,
              timestamp: log.timestamp.toISOString()
            },
            session_id: log.sessionId
          }))
        }
      });

      if (error) {
        console.error('Failed to flush admin logs:', error);
      }
    } catch (error) {
      console.error('Error flushing admin logs:', error);
    }
  }

  /**
   * Flush regular logs
   */
  private async flushRegularLogs(logs: LogEntry[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(
          logs.map(log => ({
            action: log.action || log.level,
            resource_type: log.component || 'application',
            resource_id: log.metadata?.resourceId,
            metadata: {
              level: log.level,
              message: log.message,
              component: log.component,
              timestamp: log.timestamp.toISOString(),
              requestId: log.requestId,
              ...log.metadata
            },
            user_id: log.userId,
            session_id: log.sessionId,
            created_at: log.timestamp.toISOString()
          }))
        );

      if (error) {
        console.error('Failed to flush regular logs:', error);
      }
    } catch (error) {
      console.error('Error flushing regular logs:', error);
    }
  }

  /**
   * Schedule a log flush
   */
  private scheduleFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * Get current user ID from session
   */
  private getCurrentUserId(): string | undefined {
    try {
      // This will be available in the React context
      return undefined; // Will be set by the calling component
    } catch {
      return undefined;
    }
  }

  /**
   * Get current session ID
   */
  private getSessionId(): string | undefined {
    try {
      return Math.random().toString(36).substring(2, 15);
    } catch {
      return undefined;
    }
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Query logs from database
   */
  public async queryLogs(filter: LogFilter = {}): Promise<LogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter.component) {
        query = query.eq('resource_type', filter.component);
      }

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate.toISOString());
      }

      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate.toISOString());
      }

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(record => ({
        level: (record.metadata as any)?.level || LogLevel.INFO,
        message: (record.metadata as any)?.message || record.action,
        timestamp: new Date(record.created_at),
        component: record.resource_type,
        action: record.action,
        userId: record.user_id,
        sessionId: record.session_id,
        metadata: record.metadata as Record<string, any>,
        requestId: (record.metadata as any)?.requestId
      }));

    } catch (error) {
      console.error('Error querying logs:', error);
      return [];
    }
  }

  /**
   * Force flush all pending logs
   */
  public async flush(): Promise<void> {
    await this.flushLogs();
  }

  /**
   * Destroy the service and clean up resources
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushLogs(); // Final flush
  }
}

// Export singleton instance
export const structuredLogger = StructuredLoggingService.getInstance();

/**
 * Utility function to create a logger for a specific component
 */
export function createComponentLogger(componentName: string) {
  return {
    debug: (message: string, metadata?: Record<string, any>) => 
      structuredLogger.debug(message, componentName, metadata),
    info: (message: string, metadata?: Record<string, any>) => 
      structuredLogger.info(message, componentName, metadata),
    warn: (message: string, metadata?: Record<string, any>) => 
      structuredLogger.warn(message, componentName, metadata),
    error: (message: string, error?: Error, metadata?: Record<string, any>) => 
      structuredLogger.error(message, componentName, error, metadata),
    critical: (message: string, error?: Error, metadata?: Record<string, any>) => 
      structuredLogger.critical(message, componentName, error, metadata)
  };
}