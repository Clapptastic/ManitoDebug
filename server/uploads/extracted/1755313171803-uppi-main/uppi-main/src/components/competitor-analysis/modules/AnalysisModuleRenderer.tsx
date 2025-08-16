import React from 'react';
import { getDefaultModules, AnalysisModuleDescriptor } from './ModuleRegistry';

export interface AnalysisModuleRendererProps<T = unknown> {
  analysis: T;
  modules?: AnalysisModuleDescriptor<T>[];
}

// Renders a grid of analysis modules; consumers can pass a custom registry or use the default
export const AnalysisModuleRenderer = <T,>({ analysis, modules }: AnalysisModuleRendererProps<T>) => {
  const registry = (modules && modules.length > 0) ? modules : getDefaultModules<T>();
  const rendered = registry
    .map((m) => ({ id: m.id, node: m.render({ analysis }) }))
    .filter((x) => x.node !== null);

  if (rendered.length === 0) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground p-6 text-sm text-muted-foreground">
        No structured datapoints found yet. Try running a comprehensive analysis or refreshing the report.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {rendered.map((r) => (
        <div key={r.id}>{r.node}</div>
      ))}
    </div>
  );
};
