
/**
 * Logger utility for the application
 */

interface LoggerOptions {
  enabled?: boolean;
}

export interface Logger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  logAuthEvent: (event: string, details: any) => void;
  logRouteProtection?: (userId: string, path: string, isProtected: boolean, message: string) => void;
  logAuthState?: (isAuthenticated: boolean, userId?: string, role?: string) => void;
  logAdminCheck?: (email: string, isAdmin: boolean, role?: string) => void;
}

export const useLogger = (namespace: string, options: LoggerOptions = {}): Logger => {
  const { enabled = true } = options;

  const formatMessage = (message: string): string => {
    return `[${namespace}] ${message}`;
  };

  const log = (level: string, message: string, data?: any) => {
    if (!enabled) return;

    const formattedMessage = formatMessage(message);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data || '');
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
    }
  };

  const logAuthEvent = (event: string, details: any) => {
    if (!enabled) return;
    console.info(`[AUTH] ${event}`, details);
  };
  
  const logRouteProtection = (userId: string, path: string, isProtected: boolean, message: string) => {
    if (!enabled) return;
    console.info(`[ROUTE] User: ${userId}, Path: ${path}, Protected: ${isProtected}, ${message}`);
  };
  
  const logAuthState = (isAuthenticated: boolean, userId?: string, role?: string) => {
    if (!enabled) return;
    console.info(`[AUTH-STATE] Authenticated: ${isAuthenticated}, User: ${userId || 'none'}, Role: ${role || 'none'}`);
  };
  
  const logAdminCheck = (email: string, isAdmin: boolean, role?: string) => {
    if (!enabled) return;
    console.info(`[ADMIN] Email: ${email}, IsAdmin: ${isAdmin}, Role: ${role || 'none'}`);
  };

  return {
    debug: (message: string, data?: any) => log('debug', message, data),
    info: (message: string, data?: any) => log('info', message, data),
    warn: (message: string, data?: any) => log('warn', message, data),
    error: (message: string, data?: any) => log('error', message, data),
    logAuthEvent,
    logRouteProtection,
    logAuthState,
    logAdminCheck
  };
};

export default useLogger;
