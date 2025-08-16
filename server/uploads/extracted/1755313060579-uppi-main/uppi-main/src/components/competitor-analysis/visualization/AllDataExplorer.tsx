import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { CompetitorAnalysis } from '@/types/competitor';

interface AllDataExplorerProps {
  analysis: CompetitorAnalysis;
}

// Utility to format values nicely for display
const formatValue = (val: any): React.ReactNode => {
  if (val == null) return <span className="text-muted-foreground">—</span>;
  if (typeof val === 'boolean') return <Badge variant="secondary">{val ? 'True' : 'False'}</Badge>;
  if (typeof val === 'number') return <span className="font-mono">{val}</span>;
  if (typeof val === 'string') return <span className="break-words">{val}</span>;
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-muted-foreground">[]</span>;
    // Show simple arrays as chips, complex arrays as JSON
    const simple = val.every(v => ['string','number','boolean'].includes(typeof v));
    if (simple) {
      return (
        <div className="flex flex-wrap gap-1">
          {val.slice(0, 20).map((v, i) => (
            <Badge key={i} variant="outline" className="text-xs">{String(v)}</Badge>
          ))}
          {val.length > 20 && (
            <Badge variant="secondary" className="text-xs">+{val.length - 20} more</Badge>
          )}
        </div>
      );
    }
  }
  // Fallback to pretty JSON for objects/complex arrays
  return (
    <pre className="text-xs bg-muted/40 rounded p-2 overflow-auto max-h-60">
      {JSON.stringify(val, null, 2)}
    </pre>
  );
};

/**
 * Extracts a count of data points returned per AI API/provider for this analysis.
 * - Tries multiple known shapes so it works across legacy and current pipelines
 * - Counts only defined, non-empty primitive fields (strings, numbers, booleans)
 * - For arrays: counts number of primitive items, otherwise counts 1 when non-empty
 * - For objects: counts number of first-level keys with defined values
 */
function extractProviderCounts(analysis: Record<string, unknown>): Array<{ provider: string; count: number }> {
  const counts = new Map<string, number>();

  const ensure = (p?: string | null) => {
    if (!p) return;
    if (!counts.has(p)) counts.set(p, 0);
  };
  const inc = (p?: string | null, delta = 1) => {
    if (!p) return;
    counts.set(p, (counts.get(p) ?? 0) + delta);
  };

  // Helper: conservative, shallow data point counting
  const metaKeys = new Set([
    'api_provider', 'provider', 'source', 'source_provider', 'status', 'error', 'session_id',
    'analyzed_at', 'analysis_method', 'confidence_scores', 'providers_used', 'providers_skipped',
  ]);
  const countDataPoints = (val: unknown): number => {
    if (val == null) return 0;
    if (typeof val === 'string') return val.trim().length > 0 ? 1 : 0;
    if (typeof val === 'number' || typeof val === 'boolean') return 1;
    if (Array.isArray(val)) {
      if (val.length === 0) return 0;
      // Count primitive array items; non-primitive arrays count as 1
      const primitiveCount = val.reduce((acc, item) => {
        if (item == null) return acc;
        const t = typeof item;
        if (t === 'string') return acc + ((item as string).trim().length > 0 ? 1 : 0);
        if (t === 'number' || t === 'boolean') return acc + 1;
        return acc;
      }, 0);
      return primitiveCount > 0 ? primitiveCount : 1;
    }
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      let c = 0;
      for (const [k, v] of Object.entries(obj)) {
        if (metaKeys.has(k)) continue;
        c += countDataPoints(v);
      }
      return c;
    }
    return 0;
  };

  // 1) providers_used hints (top level or inside analysis_data)
  const providersUsedTop = (analysis as any)?.providers_used as string[] | undefined;
  const analysisData = (analysis as any)?.analysis_data as Record<string, unknown> | undefined;
  const providersUsedNested = (analysisData as any)?.providers_used as string[] | undefined;
  for (const p of providersUsedTop ?? []) ensure(p);
  for (const p of providersUsedNested ?? []) ensure(p);

  // 2) results array with api_provider field
  const results = (analysisData as any)?.results as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(results)) {
    for (const item of results) {
      const provider = (item.api_provider || item.provider || (item as any).source_provider || (item as any).source) as string | undefined;
      const points = countDataPoints(item);
      if (provider) inc(provider, points);
    }
  }

  // 2b) KEYED MAP variant: { company: { data: {...}, cost, success, analysis_id } }
  // If no results array, infer provider from confidence_scores.overall (single key) or fallback to 'unknown'
  if (!Array.isArray(results) && analysisData && typeof analysisData === 'object') {
    const entries = Object.entries(analysisData);
    const looksKeyed = entries.every(([k, v]) => typeof v === 'object' && v !== null && ('data' in (v as any) || 'success' in (v as any)));
    if (looksKeyed) {
      const overall = (analysis as any)?.confidence_scores?.overall as Record<string, unknown> | undefined;
      const inferredProvider = overall && Object.keys(overall).length === 1 ? Object.keys(overall)[0] : (providersUsedNested?.[0] || providersUsedTop?.[0] || 'unknown');
      ensure(inferredProvider);
      for (const [, value] of entries) {
        const v = value as any;
        const payload = v?.data ?? v;
        const pts = countDataPoints(payload);
        if (pts > 0) inc(inferredProvider, pts);
      }
    }
  }

  // 3) provenance_map: field -> { provider, ... }
  const provenance = (analysisData as any)?.provenance_map as Record<string, { provider?: string }> | undefined;
  if (provenance && typeof provenance === 'object') {
    for (const v of Object.values(provenance)) {
      if (v && typeof v === 'object' && v.provider) inc(v.provider, 1);
    }
  }

  // 4) provider_results: { provider: [...]/object }
  const providerResults = (analysisData as any)?.provider_results as Record<string, unknown> | undefined;
  if (providerResults && typeof providerResults === 'object') {
    for (const [provider, value] of Object.entries(providerResults)) {
      if (Array.isArray(value)) {
        let sum = 0;
        for (const el of value) sum += countDataPoints(el);
        inc(provider, sum);
      } else {
        inc(provider, countDataPoints(value));
      }
    }
  }

  // 5) confidence_scores.overall keys imply participating providers (ensure presence)
  const overallScores = (analysis as any)?.confidence_scores?.overall as Record<string, unknown> | undefined;
  if (overallScores && typeof overallScores === 'object') {
    for (const provider of Object.keys(overallScores)) ensure(provider);
  }

  // 6) source_citations array: count citations per provider from source text
  const sourceCitations = (analysis as any)?.source_citations as Array<{ source?: string }> | undefined;
  if (Array.isArray(sourceCitations)) {
    for (const cite of sourceCitations) {
      const s = (cite?.source || '').toLowerCase();
      const provider = ['openai','anthropic','perplexity','gemini','groq','cohere'].find(p => s.includes(p));
      if (provider) inc(provider, 1);
    }
  }

  // Return sorted by count desc; if we only have providers with 0, filter them out unless all are zero
  const entries = Array.from(counts.entries());
  const nonZero = entries.filter(([, c]) => c > 0);
  const base = nonZero.length > 0 ? nonZero : entries;
  return base
    .map(([provider, count]) => ({ provider, count }))
    .sort((a, b) => b.count - a.count);
}

export const AllDataExplorer: React.FC<AllDataExplorerProps> = ({ analysis }) => {
  // Separate top-level fields from analysis_data
  const { analysis_data, ...topLevel } = analysis as any;

  // Sort keys alphabetically for predictable scan
  const topLevelEntries = Object.entries(topLevel).sort(([a],[b]) => a.localeCompare(b));

  const hasResultsArray = Array.isArray(analysis_data?.results);

  // Compute counts per provider for display in the Top Level section
  const providerCounts = extractProviderCounts(analysis as unknown as Record<string, unknown>);

  return (
    <div className="space-y-6">
      {/* Top-level Fields */}
      <Card>
        <CardHeader>
          <CardTitle>All Fields (Top Level)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* AI Providers Queried - dynamic count per provider */}
            <div className="md:col-span-2 lg:col-span-3 border rounded-lg p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">AI Providers Queried</div>
              {providerCounts.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {providerCounts.map(({ provider, count }) => (
                    <li key={provider} className="flex items-center gap-2">
                      <Badge variant="outline">{provider}</Badge>
                      <span className="text-sm text-muted-foreground">{count} data points</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">No provider data found for this analysis.</div>
              )}
            </div>
            {topLevelEntries.map(([key, value]) => (
              <div key={key} className="border rounded-lg p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{key.replace(/_/g, ' ')}</div>
                <div className="text-sm">{formatValue(value)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Data */}
      {analysis_data && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasResultsArray ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analysis_data.results.map((comp: any, idx: number) => (
                  <Card key={idx} className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {comp.name || `Competitor ${idx + 1}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(comp).map(([k, v]) => (
                          <div key={k} className="border rounded p-2">
                            <div className="text-xs text-muted-foreground mb-1">{k.replace(/_/g, ' ')}</div>
                            <div className="text-sm">{formatValue(v)}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div>
                <pre className="text-xs bg-muted/40 rounded p-3 overflow-auto max-h-96">
                  {JSON.stringify(analysis_data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AllDataExplorer;
