/**
 * API Interceptor with comprehensive logging and error tracking
 * Automatically logs all API calls and responses for debugging
 */

import { logger } from '@/services/logging';

// Response interceptor for comprehensive API logging
const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  const startTime = performance.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log request start
  logger.debug(`API Request Started: ${method} ${url}`, {
    requestId,
    method,
    url,
    headers: init?.headers,
    body: init?.body ? 'present' : 'none'
  });

  try {
    const response = await originalFetch(input, init);
    const duration = performance.now() - startTime;

    // Clone response to read body without consuming it
    const responseClone = response.clone();
    let responseBody: any = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await responseClone.json();
      } else if (contentType?.includes('text/')) {
        responseBody = await responseClone.text();
      }
    } catch (bodyError) {
      // Ignore body parsing errors
    }

    // Log successful response
    logger.logApiCall(method, url, response.status, duration);

    // Log detailed response for debugging
    logger.debug(`API Response: ${method} ${url}`, {
      requestId,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration.toFixed(2)}ms`,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      responseBody: responseBody ? (typeof responseBody === 'string' ? responseBody.substring(0, 500) : responseBody) : null
    });

    // Track slow API calls
    if (duration > 3000) {
      logger.warn(`Slow API Call Detected: ${method} ${url}`, {
        requestId,
        duration: `${duration.toFixed(2)}ms`,
        threshold: '3000ms'
      });
    }

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Log network errors
    logger.error(`API Request Failed: ${method} ${url}`, error, {
      requestId,
      duration: `${duration.toFixed(2)}ms`,
      networkError: true
    });

    throw error;
  }
};

// Supabase client interceptor
export const createSupabaseInterceptor = (supabase: any) => {
  // Intercept Supabase function calls
  const originalInvoke = supabase.functions.invoke;
  
  supabase.functions.invoke = async (functionName: string, options?: any) => {
    const startTime = performance.now();
    const requestId = `sb_func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.debug(`Supabase Function Call: ${functionName}`, {
      requestId,
      functionName,
      options: options ? 'present' : 'none'
    });

    try {
      const result = await originalInvoke.call(supabase.functions, functionName, options);
      const duration = performance.now() - startTime;

      if (result.error) {
        logger.error(`Supabase Function Error: ${functionName}`, result.error, {
          requestId,
          duration: `${duration.toFixed(2)}ms`,
          functionName,
          errorData: result.error
        });
      } else {
        logger.info(`Supabase Function Success: ${functionName}`, {
          requestId,
          duration: `${duration.toFixed(2)}ms`,
          functionName,
          dataPresent: !!result.data
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Supabase Function Exception: ${functionName}`, error, {
        requestId,
        duration: `${duration.toFixed(2)}ms`,
        functionName
      });
      throw error;
    }
  };

  // Intercept database operations
  const originalFrom = supabase.from;
  
  supabase.from = (table: string) => {
    const builder = originalFrom.call(supabase, table);
    const requestId = `sb_db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Intercept common operations
    ['select', 'insert', 'update', 'delete', 'upsert'].forEach(operation => {
      const originalOp = builder[operation];
      if (originalOp) {
        builder[operation] = (...args: any[]) => {
          const result = originalOp.apply(builder, args);
          
          // Add execution interceptor to the promise
          const originalThen = result.then;
          result.then = function (onResolve: any, onReject: any) {
            const startTime = performance.now();
            
            return originalThen.call(this, 
              (data: any) => {
                const duration = performance.now() - startTime;
                
                if (data.error) {
                  logger.error(`Supabase DB Error: ${operation} on ${table}`, data.error, {
                    requestId,
                    operation,
                    table,
                    duration: `${duration.toFixed(2)}ms`
                  });
                } else {
                  logger.debug(`Supabase DB Success: ${operation} on ${table}`, {
                    requestId,
                    operation,
                    table,
                    duration: `${duration.toFixed(2)}ms`,
                    rowCount: Array.isArray(data.data) ? data.data.length : data.data ? 1 : 0
                  });
                }
                
                return onResolve ? onResolve(data) : data;
              },
              (error: any) => {
                const duration = performance.now() - startTime;
                logger.error(`Supabase DB Exception: ${operation} on ${table}`, error, {
                  requestId,
                  operation,
                  table,
                  duration: `${duration.toFixed(2)}ms`
                });
                
                return onReject ? onReject(error) : Promise.reject(error);
              }
            );
          };
          
          return result;
        };
      }
    });

    return builder;
  };

  return supabase;
};

export default { createSupabaseInterceptor };