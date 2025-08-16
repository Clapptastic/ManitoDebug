/**
 * Resilience utilities: retry with jitter, simple rate limiting, and circuit breaker
 *
 * Lightweight, in-memory implementations suitable for frontend usage.
 * Documented and typed for reuse. Not persisted across reloads.
 */

export interface RetryOptions {
  retries?: number; // total attempts = retries + 1
  baseMs?: number; // initial backoff
  maxMs?: number;  // max backoff cap
  jitter?: boolean; // add random jitter
}

export async function retryWithJitter<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    retries = 3,
    baseMs = 200,
    maxMs = 2000,
    jitter = true,
  } = opts;

  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
      const delay = jitter ? exp * (0.5 + Math.random()) : exp;
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
  throw lastErr;
}

// Simple token bucket style rate limiter per key
export interface RateLimitConfig {
  limit: number;       // max actions per interval
  intervalMs: number;  // window size
}

const rateState: Map<string, { windowStart: number; count: number; cfg: RateLimitConfig }> = new Map();

export async function ensureRateLimit(key: string, cfg: RateLimitConfig): Promise<void> {
  const now = Date.now();
  const state = rateState.get(key);
  if (!state) {
    rateState.set(key, { windowStart: now, count: 1, cfg });
    return;
  }
  const elapsed = now - state.windowStart;
  if (elapsed > cfg.intervalMs) {
    // reset window
    state.windowStart = now;
    state.count = 1;
    state.cfg = cfg;
    return;
  }
  if (state.count >= cfg.limit) {
    const waitMs = cfg.intervalMs - elapsed;
    const error = new Error(`Rate limit exceeded for ${key}. Try again in ${Math.ceil(waitMs / 1000)}s.`);
    (error as any).code = 'RATE_LIMITED';
    throw error;
  }
  state.count += 1;
}

// Circuit breaker
export interface CircuitConfig {
  failureThreshold: number; // failures to open circuit
  cooldownMs: number;       // time before half-open
}

type CircuitState = 'closed' | 'open' | 'half_open';

interface CircuitInternal {
  state: CircuitState;
  failures: number;
  lastOpenedAt: number;
  cfg: CircuitConfig;
}

const circuits: Map<string, CircuitInternal> = new Map();

export function getCircuitBreaker(key: string, cfg: CircuitConfig) {
  const init = () => {
    const c: CircuitInternal = { state: 'closed', failures: 0, lastOpenedAt: 0, cfg };
    circuits.set(key, c);
    return c;
  };
  const circuit = circuits.get(key) || init();

  async function execute<T>(op: () => Promise<T>): Promise<T> {
    const now = Date.now();

    if (circuit.state === 'open') {
      if (now - circuit.lastOpenedAt >= circuit.cfg.cooldownMs) {
        circuit.state = 'half_open';
      } else {
        const err = new Error(`Circuit open for ${key}. Please try later.`);
        (err as any).code = 'CIRCUIT_OPEN';
        throw err;
      }
    }

    try {
      const res = await op();
      // success path
      circuit.failures = 0;
      circuit.state = 'closed';
      return res;
    } catch (err) {
      circuit.failures += 1;
      if (circuit.failures >= circuit.cfg.failureThreshold) {
        circuit.state = 'open';
        circuit.lastOpenedAt = now;
      } else if (circuit.state === 'half_open') {
        // trip again
        circuit.state = 'open';
        circuit.lastOpenedAt = now;
      }
      throw err;
    }
  }

  return { execute };
}
