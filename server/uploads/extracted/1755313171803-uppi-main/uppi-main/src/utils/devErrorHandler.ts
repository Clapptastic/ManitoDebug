import React from 'react';
import { toast } from '@/hooks/use-toast';
import { devTools } from '@/utils/devTools';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  route?: string;
  additionalInfo?: Record<string, any>;
}

interface DevErrorInfo {
  error: Error;
  context: ErrorContext;
  timestamp: string;
  userAgent: string;
  url: string;
  stackTrace: string;
}

class DevErrorHandler {
  private static instance: DevErrorHandler;
  private errorQueue: DevErrorInfo[] = [];
  private maxErrors = 10; // Keep last 10 errors in dev

  static getInstance(): DevErrorHandler {
    if (!DevErrorHandler.instance) {
      DevErrorHandler.instance = new DevErrorHandler();
    }
    return DevErrorHandler.instance;
  }

  private constructor() {
    // Only in development (not during tests)
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (import.meta.env.DEV && !isTest) {
      this.setupGlobalErrorHandlers();
    }
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        component: 'Global',
        action: 'unhandled_error',
        additionalInfo: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'Global',
          action: 'unhandled_promise_rejection'
        }
      );
    });

    // Hook into console.error to capture all error logs
    this.setupConsoleErrorCapture();
    
    // Hook into fetch to capture HTTP errors
    this.setupNetworkErrorCapture();
  }

  private setupConsoleErrorCapture() {
    const originalConsoleError = console.error;
    let capturing = false; // Prevent infinite recursion
    
    console.error = (...args: any[]) => {
      // Call original console.error first
      originalConsoleError.apply(console, args);
      
      // Prevent recursive calls
      if (capturing) return;
      capturing = true;
      
      try {
        // Try to parse and capture structured errors
        args.forEach(arg => {
          if (typeof arg === 'object' && arg !== null) {
            // Check for Supabase errors
            if (arg.code && arg.message) {
              this.captureErrorSilently(new Error(`Supabase Error (${arg.code}): ${arg.message}`), {
                component: 'Supabase',
                action: 'database_error',
                additionalInfo: {
                  code: arg.code,
                  details: arg.details,
                  hint: arg.hint,
                  type: 'permission_denied'
                }
              });
            }
            // Check for general error objects
            else if (arg.message) {
              this.captureErrorSilently(new Error(arg.message), {
                component: 'Console',
                action: 'console_error',
                additionalInfo: arg
              });
            }
          } else if (typeof arg === 'string' && arg.includes('Error')) {
            this.captureErrorSilently(new Error(arg), {
              component: 'Console',
              action: 'console_error_string'
            });
          }
        });
      } finally {
        capturing = false;
      }
    };
  }

  private setupNetworkErrorCapture() {
    // Hook into fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        const response = await originalFetch(...args);
        
        // Capture HTTP errors
        if (!response.ok) {
          const url = typeof args[0] === 'string' ? args[0] : 
                     args[0] instanceof URL ? args[0].toString() :
                     args[0].url || 'unknown';
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          // Try to get response body for more details
          try {
            const responseText = await response.clone().text();
            if (responseText) {
              const parsed = JSON.parse(responseText);
              if (parsed.message) errorMessage += ` - ${parsed.message}`;
              if (parsed.code) errorMessage += ` (${parsed.code})`;
            }
          } catch {
            // Ignore parsing errors
          }
          
          this.captureError(new Error(errorMessage), {
            component: 'Network',
            action: 'http_error',
            additionalInfo: {
              url,
              status: response.status,
              statusText: response.statusText,
              method: args[1]?.method || 'GET'
            }
          });
        }
        
        return response;
      } catch (error) {
        // Capture network errors
        const url = typeof args[0] === 'string' ? args[0] : 
                   args[0] instanceof URL ? args[0].toString() :
                   (args[0] as Request).url || 'unknown';
        this.captureError(error instanceof Error ? error : new Error(String(error)), {
          component: 'Network',
          action: 'network_error',
          additionalInfo: {
            url,
            method: args[1]?.method || 'GET'
          }
        });
        throw error;
      }
    };
  }

  captureError(error: Error, context: ErrorContext = {}) {
    if (!import.meta.env.DEV || !devTools.isEnabled()) return;
    this.captureErrorSilently(error, context);
  }

  private captureErrorSilently(error: Error, context: ErrorContext = {}) {
    if (!import.meta.env.DEV || !devTools.isEnabled()) return;

    const errorInfo: DevErrorInfo = {
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error.stack || 'No stack trace available'
    };

    // Add to queue
    this.errorQueue.unshift(errorInfo);
    if (this.errorQueue.length > this.maxErrors) {
      this.errorQueue.pop();
    }

    // Show dev toast with copy functionality
    this.showDevErrorToast(errorInfo);
  }

  private showDevErrorToast(errorInfo: DevErrorInfo) {
    if (!devTools.isEnabled()) return;
    const copyErrorReport = () => {
      const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      const canUseClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText && (typeof isSecureContext === 'boolean' ? isSecureContext : true);
      if (!canUseClipboard || isTest) {
        toast({
          title: "Copy Unavailable",
          description: "Clipboard not accessible in this environment.",
        });
        return;
      }
      const report = this.generateErrorReport(errorInfo);
      navigator.clipboard.writeText(report).then(() => {
        toast({
          title: "Error Report Copied!",
          description: "Paste this into your AI coding agent for help debugging.",
        });
      }).catch(() => {
        toast({
          title: "Copy Failed",
          description: "Unable to copy error report to clipboard.",
          variant: "destructive"
        });
      });
    };

    // Simple toast without action for compatibility
    toast({
      title: "🔥 Dev Error Captured",
      description: `${errorInfo.error.name}: ${errorInfo.error.message.substring(0, 100)}... Click to copy full report.`,
      duration: 10000, // 10 seconds in dev
    });
    
    // Auto-copy to clipboard (skip in tests or when clipboard unsupported)
    const __isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    const __canUseClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText && (typeof isSecureContext === 'boolean' ? isSecureContext : true);
    if (__canUseClipboard && !__isTest) {
      setTimeout(() => {
        copyErrorReport();
      }, 500);
    }
  }

  generateErrorReport(errorInfo: DevErrorInfo): string {
    const dependencies = [
      { name: '@supabase/supabase-js', version: '^2.49.4' },
      { name: 'react', version: '^18.3.1' },
      { name: 'react-dom', version: '^18.3.1' },
      { name: 'react-router-dom', version: '^6.26.2' },
      { name: 'typescript', version: 'latest' },
      { name: 'vite', version: '^3.0.5' },
      { name: 'tailwindcss', version: 'latest' }
    ];

    return `# DEVELOPMENT ERROR REPORT

## Quick Summary
**Error:** ${errorInfo.error.name}: ${errorInfo.error.message}
**Component:** ${errorInfo.context.component || 'Unknown'}
**Action:** ${errorInfo.context.action || 'Unknown'}
**Route:** ${errorInfo.context.route || window.location.pathname}
**Timestamp:** ${errorInfo.timestamp}

## Error Details
\`\`\`
${errorInfo.error.name}: ${errorInfo.error.message}

Stack Trace:
${errorInfo.stackTrace}
\`\`\`

## Context Information
- **User ID:** ${errorInfo.context.userId || 'Not authenticated'}
- **Current URL:** ${errorInfo.url}
- **User Agent:** ${errorInfo.userAgent}
- **Component:** ${errorInfo.context.component || 'Global'}
- **Action:** ${errorInfo.context.action || 'Unknown action'}

## Additional Context
${errorInfo.context.additionalInfo ? JSON.stringify(errorInfo.context.additionalInfo, null, 2) : 'No additional context'}

## Technology Stack
- **Framework:** React 18.3.1 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Radix UI  
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Routing:** React Router v6
- **State Management:** React Hooks + Zustand

## Key Dependencies
${dependencies.map(dep => `- ${dep.name}: ${dep.version}`).join('\n')}

## Project Structure
This is a SaaS platform with:
- Authentication (Supabase Auth)
- Company profile management
- AI-powered analysis features  
- Document management
- Real-time data sync
- Edge functions for backend logic

## Development Environment
- **Mode:** ${import.meta.env.MODE}
- **Dev:** ${import.meta.env.DEV}
- **Base URL:** ${import.meta.env.BASE_URL}

## Recent Error History
${this.errorQueue.slice(0, 3).map((err, i) => 
  `${i + 1}. ${err.error.name} in ${err.context.component} at ${new Date(err.timestamp).toLocaleTimeString()}`
).join('\n')}

---
*Generated by Dev Error Handler - Only visible in development mode*`;
  }

  getRecentErrors(): DevErrorInfo[] {
    return [...this.errorQueue];
  }

  clearErrors() {
    this.errorQueue = [];
  }

  // Utility method for manual error capturing
  static captureError(error: Error, context: ErrorContext = {}) {
    DevErrorHandler.getInstance().captureError(error, context);
  }
}

// Export singleton instance and utility functions
export const devErrorHandler = DevErrorHandler.getInstance();

export const captureDevError = (error: Error, context: ErrorContext = {}) => {
  devErrorHandler.captureError(error, context);
};

// Simple utility for manual error capturing in components
export const withDevErrorCapture = (component: string, action?: string) => {
  return (error: Error, additionalContext?: Record<string, any>) => {
    if (import.meta.env.DEV) {
      captureDevError(error, {
        component,
        action: action || 'unknown',
        route: window.location.pathname,
        additionalInfo: additionalContext
      });
    }
  };
};