import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type GateProviderStatus = Record<string, { active: boolean; status?: string }>;

export interface GateResponse {
  success: boolean;
  global_enabled: boolean;
  unlocked: boolean;
  can_proceed: boolean;
  providers: GateProviderStatus;
  reasons?: string[];
}

export const useCompetitorGate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GateResponse | null>(null);

  const checkGate = useCallback(async (providersSelected?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('competitor-analysis-gate', {
        body: { action: 'check', providersSelected }
      });
      if (error) throw error;
      setData(data as GateResponse);
      return data as GateResponse;
    } catch (e: any) {
      setError(e?.message || 'Gate check failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setData]);

  const unlockGate = useCallback(async (providersSelected?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('competitor-analysis-gate', {
        body: { action: 'unlock', providersSelected }
      });
      if (error) throw error;
      setData(data as GateResponse);
      return data as GateResponse;
    } catch (e: any) {
      setError(e?.message || 'Gate unlock failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Build a stable, dynamic provider list: prefer defaults, then append any others
  const providerList = useMemo(() => {
    const map = data?.providers || {};
    const defaultOrder = ['openai', 'anthropic', 'perplexity', 'gemini', 'serpapi', 'mistral', 'cohere'];
    const keys = Object.keys(map);
    const ordered = [
      ...defaultOrder.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !defaultOrder.includes(k))
    ];
    return ordered.map((p) => ({ key: p, ...map[p] }));
  }, [data]);

  return { loading, error, data, providerList, checkGate, unlockGate };
};
