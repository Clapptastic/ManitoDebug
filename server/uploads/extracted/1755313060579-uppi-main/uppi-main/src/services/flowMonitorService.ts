/**
 * Flow Monitoring Service (Stage 3 - minimal implementation)
 * Aggregates existing analysis tables to provide a lightweight flow overview.
 *
 * IMPORTANT:
 * - Read-only queries only; no schema changes.
 * - Keeps the original getFlowEventsForProfile() API intact to avoid regressions.
 */
import { supabase } from '@/integrations/supabase/client';

export type ProviderRunStatus = 'pending' | 'running' | 'completed' | 'failed' | string;

export enum NodeStatus {
  Ok = 'ok',
  Warn = 'warn',
  Error = 'error',
  Pending = 'pending',
}

export interface FlowOverview {
  analysisId?: string;
  providerRuns: {
    total: number;
    byStatus: Record<string, number>;
  };
  combinedExists: boolean;
  latestError: string | null;
  overallStatus: NodeStatus;
}

/**
 * Compute an overall status from provider run status counts.
 * Error beats Pending beats Ok.
 */
export function computeOverallStatus(byStatus: Record<string, number>): NodeStatus {
  const failed = byStatus['failed'] ?? 0;
  const pending = (byStatus['pending'] ?? 0) + (byStatus['running'] ?? 0);
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  if (failed > 0) return NodeStatus.Error;
  if (pending > 0) return NodeStatus.Pending;
  if (total === 0) return NodeStatus.Pending; // nothing has run yet
  return NodeStatus.Ok;
}

class FlowMonitorServiceImpl {
  /**
   * Legacy stub preserved (Stage 1) to avoid regressions.
   * Will be wired to RPC/queries for profile-level flows as needed.
   */
  async getFlowEventsForProfile(profileId: string, sinceIso?: string): Promise<unknown[]> {
    void profileId;
    void sinceIso;
    return [];
  }

  /**
   * Minimal analysis-level overview using existing tables with RLS.
   */
  async getOverviewByAnalysisId(analysisId?: string): Promise<FlowOverview> {
    if (!analysisId) {
      return {
        analysisId,
        providerRuns: { total: 0, byStatus: {} },
        combinedExists: false,
        latestError: null,
        overallStatus: NodeStatus.Pending,
      };
    }

    // 1) Provider runs summary
    const runsResp = await supabase
      .from('analysis_provider_runs')
      .select('status, error_message')
      .eq('analysis_id', analysisId)
      .order('updated_at', { ascending: false })
      .limit(200);

    const byStatus: Record<string, number> = {};
    let latestError: string | null = null;

    if (!runsResp.error && runsResp.data) {
      for (const r of runsResp.data as Array<{ status: ProviderRunStatus; error_message: string | null }>) {
        const key = String(r.status);
        byStatus[key] = (byStatus[key] || 0) + 1;
        if (!latestError && r.error_message) latestError = r.error_message;
      }
    }

    // 2) Combined analysis presence
    const combinedResp = await supabase
      .from('analysis_combined')
      .select('id')
      .eq('analysis_id', analysisId)
      .maybeSingle();

    const combinedExists = !!(combinedResp.data && !combinedResp.error);

    // 3) Compute overall status
    const overallStatus = computeOverallStatus(byStatus);

    return {
      analysisId,
      providerRuns: {
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
      },
      combinedExists,
      latestError,
      overallStatus,
    };
  }
}

export const FlowMonitorService = new FlowMonitorServiceImpl();
export type FlowMonitorServiceType = typeof FlowMonitorService;
