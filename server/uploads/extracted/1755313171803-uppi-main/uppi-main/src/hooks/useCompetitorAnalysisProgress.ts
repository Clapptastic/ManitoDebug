import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * useCompetitorAnalysisProgress
 *
 * Fetches initial progress for a competitor analysis session and subscribes to realtime updates.
 * Requires DB realtime to be enabled for public.competitor_analysis_progress (handled via migration).
 *
 * RLS: The backend function get_competitor_analysis_progress enforces auth via SECURITY DEFINER.
 */
export interface AnalysisProgressRow {
  id: string;
  session_id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress_percentage: number | null;
  total_competitors: number | null;
  completed_competitors: number | null;
  current_competitor: string | null;
  error_message: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export function useCompetitorAnalysisProgress(sessionId: string | null) {
  const [progress, setProgress] = useState<AnalysisProgressRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_competitor_analysis_progress', {
        session_id_param: sessionId,
      });
      if (error) throw error;
      // RPC returns an array of rows (table function). Use the most recent if multiple
      const rows: AnalysisProgressRow[] = Array.isArray(data) ? (data as any) : [];
      setProgress(rows[0] ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Subscribe to realtime changes filtered by session_id
  useEffect(() => {
    if (!sessionId) return;
    
    let isActive = true;
    const channel = supabase
      .channel(`progress-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competitor_analysis_progress',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          // Ignore updates if component has unmounted
          if (!isActive) return;
          
          const newRow = (payload as any).new ?? (payload as any).old;
          if (newRow && newRow.session_id === sessionId) {
            setProgress((prev) => ({ ...(prev ?? {} as any), ...newRow } as AnalysisProgressRow));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug(`Progress subscription active for session: ${sessionId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.warn(`Progress subscription error for session: ${sessionId}`);
        }
      });

    return () => {
      isActive = false;
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.debug('Progress subscription cleanup:', error);
      }
    };
  }, [sessionId]);

  const percentage = useMemo(() => {
    if (!progress) return 0;
    if (typeof progress.progress_percentage === 'number') return Number(progress.progress_percentage);
    const total = progress.total_competitors ?? 0;
    const done = progress.completed_competitors ?? 0;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [progress]);

  return { progress, percentage, loading, error, refetch: fetchProgress } as const;
}
