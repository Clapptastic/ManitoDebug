/**
 * Prompt Service
 * Fetches system prompts via the `prompt-get` Edge Function with in-memory caching.
 * This ensures user/org-specific prompts are centrally managed and versioned.
 */

import { supabase } from '@/integrations/supabase/client';

export interface PromptGetResponse {
  key: string;
  provider: string;
  domain: string;
  description: string | null;
  is_active: boolean;
  version: number | null;
  content: string | null;
  metadata: Record<string, unknown> | null;
  variables: unknown[];
  updated_at: string | null;
  source?: 'db' | 'cache';
}

// Simple module-level cache with TTL
const CACHE_TTL_MS = 60_000; // 60s
const cache = new Map<string, { data: PromptGetResponse; expiresAt: number }>();

function getCache(key: string): PromptGetResponse | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function setCache(key: string, data: PromptGetResponse) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Retrieve a prompt by key from the prompt-get edge function.
 * @param key Unique prompt key in `prompts` table
 * @returns PromptGetResponse or null if not found
 */
export async function getPromptByKey(key: string): Promise<PromptGetResponse | null> {
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke('prompt-get', {
      body: { key },
    });

    if (error) {
      console.warn(`[promptService] prompt-get error for key="${key}":`, error);
      return null;
    }

    if (!data) {
      console.warn(`[promptService] No data returned for key="${key}"`);
      return null;
    }

    // Shape comes as { source, ...payload }
    const { source, ...payload } = (data || {}) as any;
    if (!payload || !payload.key) return null;

    const response: PromptGetResponse = {
      ...(payload as PromptGetResponse),
      source,
    };

    setCache(key, response);
    return response;
  } catch (error) {
    console.error(`[promptService] Exception calling prompt-get for key="${key}":`, error);
    return null;
  }
}

/**
 * Flow-aware prompt retrieval - NEW for Phase 2
 * Retrieves prompts based on flow assignments with fallback to global prompts
 * @param key Unique prompt key
 * @param flowName Name of the flow (e.g., 'competitor_analysis')
 * @param fallbackToGlobal Whether to fallback to global prompt if no flow assignment
 * @returns Enhanced PromptGetResponse with flow context
 */
export async function getPromptByKeyForFlow(
  key: string, 
  flowName: string,
  fallbackToGlobal: boolean = true
): Promise<PromptGetResponse | null> {
  const cacheKey = `${key}:${flowName}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.functions.invoke('prompt-get-flow-aware', {
    body: { 
      key, 
      flowName,
      fallbackToGlobal 
    },
  });

  if (error) {
    console.warn(`[promptService] flow-aware prompt-get error for key="${key}", flow="${flowName}":`, error);
    
    // Fallback to regular prompt-get if flow-aware function fails
    if (fallbackToGlobal) {
      console.log(`[promptService] Falling back to regular prompt-get for key="${key}"`);
      return getPromptByKey(key);
    }
    
    return null;
  }

  if (!data || !data.key) return null;

  const response: PromptGetResponse = {
    ...data,
    source: data.source || 'flow-aware'
  };

  setCache(cacheKey, response);
  return response;
}
