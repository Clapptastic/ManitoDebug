/**
 * Comprehensive logging service for application monitoring
 * Provides structured logging with multiple output targets
 */

export interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: Date;
  context?: any;
  error?: Error;
}

class Logger {
  private logLevel: keyof LogLevel = 'INFO';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    // Set log level based on environment
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      this.logLevel = 'DEBUG';
    }
  }

  private shouldLog(level: keyof LogLevel): boolean {
    const levels: LogLevel = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
    return levels[level] <= levels[this.logLevel];
  }

  private addLog(level: keyof LogLevel, message: string, error?: Error, context?: any): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };

    // Add to internal log storage
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with formatting
    const timestamp = logEntry.timestamp.toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    
    switch (level) {
      case 'ERROR':
        console.error(`[${timestamp}] ERROR: ${message}${contextStr}`, error || '');
        break;
      case 'WARN':
        console.warn(`[${timestamp}] WARN: ${message}${contextStr}`);
        break;
      case 'INFO':
        console.info(`[${timestamp}] INFO: ${message}${contextStr}`);
        break;
      case 'DEBUG':
        console.debug(`[${timestamp}] DEBUG: ${message}${contextStr}`);
        break;
    }
  }

  error(message: string, error?: Error | any, context?: any): void {
    this.addLog('ERROR', message, error instanceof Error ? error : undefined, context);
  }

  warn(message: string, context?: any): void {
    this.addLog('WARN', message, undefined, context);
  }

  info(message: string, context?: any): void {
    this.addLog('INFO', message, undefined, context);
  }

  debug(message: string, context?: any): void {
    this.addLog('DEBUG', message, undefined, context);
  }

  /**
   * Log fatal errors for critical issues
   */
  fatal(message: string, error?: Error, context?: any): void {
    this.addLog('ERROR', message, error, context);
  }

  /**
   * Log API calls for monitoring
   */
  logApiCall(method: string, url: string, status: number, duration: number): void {
    const message = `API ${method} ${url} - ${status} (${duration.toFixed(2)}ms)`;
    const context = { method, url, status, duration };
    
    if (status >= 400) {
      this.error(message, undefined, context);
    } else if (duration > 2000) {
      this.warn(`Slow ${message}`, context);
    } else {
      this.debug(message, context);
    }
  }

  /**
   * Get recent logs
   */
  getLogs(level?: keyof LogLevel, limit = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Set log level
   */
  setLogLevel(level: keyof LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get current log level
   */
  getLogLevel(): keyof LogLevel {
    return this.logLevel;
  }
}

export const logger = new Logger();