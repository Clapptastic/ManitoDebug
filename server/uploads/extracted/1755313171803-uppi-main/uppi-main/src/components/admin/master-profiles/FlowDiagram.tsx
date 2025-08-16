import React from 'react';
import { NodeStatus, type FlowOverview } from '@/services/flowMonitorService';
import { cn } from '@/lib/utils';
export interface FlowDiagramProps {
  overview: FlowOverview;
}

/**
 * AdminFlowDiagram (Stage 3 - minimal)
 * Renders a compact, accessible summary of the flow using semantic markup.
 * Replace with @xyflow/react visualization in the enhanced iteration.
 */
const statusLabel: Record<NodeStatus, string> = {
  [NodeStatus.Ok]: 'OK',
  [NodeStatus.Warn]: 'Warning',
  [NodeStatus.Error]: 'Error',
  [NodeStatus.Pending]: 'Pending',
};

export function FlowDiagram({ overview }: FlowDiagramProps) {
  const { overallStatus, providerRuns, combinedExists, latestError } = overview;

  return (
    <section aria-labelledby="flow-diagram-heading" className="space-y-4">
      <header>
        <h2 id="flow-diagram-heading" className="text-lg font-semibold tracking-tight">
          Flow Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          Analysis health at-a-glance
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-md border border-border p-4">
          <h3 className="text-sm font-medium">Provider Runs</h3>
          <p className="text-sm text-muted-foreground">Total: {providerRuns.total}</p>
          <ul className="mt-2 text-sm">
            {Object.entries(providerRuns.byStatus).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </li>
            ))}
            {providerRuns.total === 0 && (
              <li className="text-muted-foreground">No runs yet</li>
            )}
          </ul>
        </article>

        <article className="rounded-md border border-border p-4">
          <h3 className="text-sm font-medium">Combined Result</h3>
          <p className={cn("text-sm", combinedExists ? "text-foreground" : "text-muted-foreground")}>
            {combinedExists ? 'Present' : 'Not generated'}
          </p>
        </article>

        <article className="rounded-md border border-border p-4">
          <h3 className="text-sm font-medium">Overall Status</h3>
          <p className="text-sm font-semibold">{statusLabel[overallStatus]}</p>
          {latestError && (
            <p className="mt-2 text-sm text-muted-foreground" role="note">
              Last error: {latestError}
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

export default FlowDiagram;
