import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RunType = 'competitor_analysis' | 'trend_analysis' | 'market_research';

// Local JSON type compatible with Supabase jsonb
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface AnalysisRunRow {
  id: string;
  run_type: RunType;
  session_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  execution_time_ms: number | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  input_data: unknown;
  output_data: unknown;
}

export function useRecentAnalysisRuns(runType: RunType) {
  const [runs, setRuns] = useState<AnalysisRunRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setRuns([]);
        return;
      }

      const { data, error } = await supabase
        .from('analysis_runs')
        .select('id, run_type, session_id, status, execution_time_ms, created_at, completed_at, error_message, input_data, output_data')
        .eq('run_type', runType)
        .order('created_at', { ascending: false })
        .limit(5);

      const rows = (data ?? []).map((r: any) => ({
        ...r,
        run_type: (r.run_type as RunType),
      })) as AnalysisRunRow[];
      setRuns(rows);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load recent runs');
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [runType]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return { runs, loading, error, refetch: fetchRuns };
}
