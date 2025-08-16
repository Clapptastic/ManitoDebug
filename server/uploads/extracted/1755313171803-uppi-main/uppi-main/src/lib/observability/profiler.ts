/**
 * Lightweight client-side profiler for RPC and Edge Function calls
 * - Measures duration and logs to console
 * - Fire-and-forget emits to optional edge function 'log-api-metric' (ignored if unavailable)
 * - Zero runtime coupling: safe no-op on failures
 */
import { supabase } from '@/lib/supabase/client';

export type ProfileMeta = Record<string, unknown>;

export async function profile<T>(
  label: string,
  action: () => Promise<T>,
  meta: ProfileMeta = {}
): Promise<T> {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    const result = await action();
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = Math.round(end - start);

    console.log(`[PROFILE] ${label} ok in ${duration}ms`, { ...meta, duration });

    // Fire-and-forget metric emit; do not block or throw
    supabase.functions
      .invoke('log-api-metric', {
        body: {
          endpoint: label,
          response_time_ms: duration,
          status_code: 200,
          metadata: meta,
        },
      })
      .catch(() => void 0);

    return result;
  } catch (error) {
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = Math.round(end - start);

    console.error(`[PROFILE] ${label} failed in ${duration}ms`, error, meta);

    // Fire-and-forget metric emit; do not block or throw
    supabase.functions
      .invoke('log-api-metric', {
        body: {
          endpoint: label,
          response_time_ms: duration,
          status_code: 500,
          metadata: { ...meta, error: (error as Error)?.message ?? String(error) },
        },
      })
      .catch(() => void 0);

    throw error;
  }
}
