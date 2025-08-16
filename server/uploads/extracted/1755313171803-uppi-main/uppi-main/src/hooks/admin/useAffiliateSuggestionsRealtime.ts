import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * useAffiliateSuggestionsRealtime
 * Subscribes to realtime inserts on affiliate_link_suggestions and exposes a simple
 * notification count and the last suggestion payload for admin UIs.
 *
 * Security: relies on admin pages using this hook behind admin auth. RLS must restrict
 * table access to admins for select; INSERT is done by clients when logging suggestions.
 */
export interface AffiliateLinkSuggestion {
  id: string;
  domain: string;
  original_url?: string | null;
  provider?: string | null;
  detected_program_name?: string | null;
  status?: string | null; // e.g., pending, reviewed, ignored
  created_at?: string;
  created_by?: string;
}

export function useAffiliateSuggestionsRealtime({ enabled = true }: { enabled?: boolean }) {
  const [newCount, setNewCount] = useState(0);
  const [lastSuggestion, setLastSuggestion] = useState<AffiliateLinkSuggestion | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Prefetch pending count (non-blocking)
    (async () => {
      const { data } = await supabase
        .from('affiliate_link_suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      // count is available via data?.length when head: true isn't supported; fallback to 0
      // We keep UX simple: initialize to 0 and increment on new inserts.
    })();

    const channel = supabase
      .channel('affiliate_link_suggestions_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'affiliate_link_suggestions' },
        (payload: any) => {
          const row = payload.new as AffiliateLinkSuggestion;
          setNewCount((c) => c + 1);
          setLastSuggestion(row);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      try {
        channelRef.current && supabase.removeChannel(channelRef.current);
      } catch {}
    };
  }, [enabled]);

  return { newCount, lastSuggestion } as const;
}
