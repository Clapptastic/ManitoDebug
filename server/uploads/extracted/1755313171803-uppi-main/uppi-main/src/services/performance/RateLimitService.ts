/**
 * Rate limiting and throttling utilities
 * Implements client-side rate limiting to prevent API abuse
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (context?: any) => string;
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

class RateLimitService {
  private limits = new Map<string, RateLimitState>();

  /**
   * Check if request is within rate limits
   */
  isWithinLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const state = this.limits.get(key);

    if (!state || now > state.resetTime) {
      // Reset or initialize rate limit window
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }

    if (state.count >= config.maxRequests) {
      return false;
    }

    state.count++;
    return true;
  }

  /**
   * Get time until rate limit resets
   */
  getTimeUntilReset(key: string): number {
    const state = this.limits.get(key);
    if (!state) return 0;
    
    return Math.max(0, state.resetTime - Date.now());
  }

  /**
   * Rate limited function wrapper
   */
  async withRateLimit<T>(
    operation: () => Promise<T>,
    config: RateLimitConfig,
    context?: any
  ): Promise<T> {
    const key = config.keyGenerator ? config.keyGenerator(context) : 'default';
    
    if (!this.isWithinLimit(key, config)) {
      const waitTime = this.getTimeUntilReset(key);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    return operation();
  }

  /**
   * Clear rate limit for a specific key
   */
  clearLimit(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAllLimits(): void {
    this.limits.clear();
  }
}

export const rateLimitService = new RateLimitService();

/**
 * Debounced function wrapper
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), waitMs);
  };
}

/**
 * Throttled function wrapper
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallTime >= limitMs) {
      lastCallTime = now;
      func(...args);
    }
  };
}

/**
 * Adaptive throttling based on system performance
 */
export class AdaptiveThrottle {
  private baseDelay: number;
  private currentDelay: number;
  private performanceHistory: number[] = [];
  private maxHistorySize = 10;

  constructor(baseDelay: number = 100) {
    this.baseDelay = baseDelay;
    this.currentDelay = baseDelay;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.updatePerformanceHistory(duration);
      this.adjustDelay();
      
      if (this.currentDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.currentDelay));
      }
      
      return result;
    } catch (error) {
      // Increase delay on error
      this.currentDelay = Math.min(this.currentDelay * 1.5, this.baseDelay * 5);
      throw error;
    }
  }

  private updatePerformanceHistory(duration: number): void {
    this.performanceHistory.push(duration);
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
  }

  private adjustDelay(): void {
    if (this.performanceHistory.length < 3) return;

    const avgDuration = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
    
    // Adjust delay based on average performance
    if (avgDuration > 1000) { // Slow responses
      this.currentDelay = Math.min(this.currentDelay * 1.2, this.baseDelay * 3);
    } else if (avgDuration < 200) { // Fast responses
      this.currentDelay = Math.max(this.currentDelay * 0.8, this.baseDelay * 0.5);
    }
  }

  getCurrentDelay(): number {
    return this.currentDelay;
  }

  reset(): void {
    this.currentDelay = this.baseDelay;
    this.performanceHistory = [];
  }
}