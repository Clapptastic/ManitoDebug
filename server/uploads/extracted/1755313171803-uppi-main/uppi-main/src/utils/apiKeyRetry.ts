/**
 * Retry utility specifically for API key operations
 * Handles common API key loading and validation failures
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

export async function retryApiKeyOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 API key operation attempt ${attempt}/${maxAttempts}`);
      const result = await operation();
      console.log(`✅ API key operation succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ API key operation failed on attempt ${attempt}:`, error);
      
      // Don't retry on authentication errors or permission issues
      if (error instanceof Error) {
        if (error.message.includes('not authenticated') || 
            error.message.includes('permission denied') ||
            error.message.includes('unauthorized')) {
          console.log('🚫 Not retrying due to auth/permission error');
          throw error;
        }
      }
      
      // Don't wait after the last attempt
      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error(`💥 API key operation failed after ${maxAttempts} attempts`);
  throw lastError;
}

export function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    'network error',
    'timeout',
    'connection',
    'failed to fetch',
    'ECONNRESET',
    'ETIMEDOUT'
  ];
  
  return retryableMessages.some(msg => 
    error.message.toLowerCase().includes(msg)
  );
}