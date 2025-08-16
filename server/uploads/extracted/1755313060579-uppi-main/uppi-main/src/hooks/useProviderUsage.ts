import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProviderUsage {
  provider: string;
  usage: {
    used: number;
    limit: number;
    percentage: number;
    currency: string;
    period: string;
    note?: string;
  };
}

// Simple in-memory cache and in-flight deduper per provider
const CACHE_TTL_MS = 60_000; // 1 minute
const usageCache = new Map<string, { data: any; ts: number; inFlight?: Promise<any> }>();

export function useProviderUsage(provider: 'openai' | 'anthropic') {
  const [usage, setUsage] = useState<ProviderUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    if (!provider) return;

    // Check if user has API key for this provider first
    try {
      const { data: apiKeys, error: keyCheckError } = await supabase.rpc('manage_api_key', {
        operation: 'select',
        user_id_param: (await supabase.auth.getUser()).data.user?.id
      });

      if (keyCheckError || !apiKeys) {
        setError(`No ${provider.toUpperCase()} API key configured`);
        setIsLoading(false);
        return;
      }

      const hasProviderKey = Array.isArray(apiKeys) 
        ? apiKeys.some((key: any) => key.provider === provider && key.is_active)
        : false;

      if (!hasProviderKey) {
        setError(`No ${provider.toUpperCase()} API key configured`);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      setError(`Failed to check API key configuration`);
      setIsLoading(false);
      return;
    }

    // Serve from cache if fresh
    const cached = usageCache.get(provider);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS && cached.data) {
      setUsage(cached.data);
      return;
    }

    // De-duplicate concurrent requests
    if (cached?.inFlight) {
      await cached.inFlight.catch(() => {});
      const after = usageCache.get(provider);
      if (after?.data) setUsage(after.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    const functionName = provider === 'openai' ? 'get-openai-usage' : 'get-anthropic-usage';

    const promise = supabase.functions.invoke(functionName).then(({ data, error: functionError }) => {
      if (functionError) throw new Error(functionError.message);
      if (data?.error) throw new Error(data.error);
      usageCache.set(provider, { data, ts: Date.now() });
      setUsage(data);
    }).catch((err) => {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage data';
      setError(errorMessage);
      // Only show toast for unexpected errors, not missing API keys
      if (!errorMessage.includes('not found') && !errorMessage.includes('not configured')) {
        toast({ title: 'Usage Fetch Error', description: errorMessage, variant: 'destructive' });
      }
    }).finally(() => {
      const cur = usageCache.get(provider);
      if (cur) usageCache.set(provider, { data: cur.data, ts: cur.ts });
      setIsLoading(false);
    });

    usageCache.set(provider, { data: cached?.data, ts: cached?.ts ?? 0, inFlight: promise });
    await promise;
  };

  useEffect(() => {
    fetchUsage();
  }, [provider]);

  return { usage, isLoading, error, refetch: fetchUsage };
}