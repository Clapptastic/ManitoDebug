// SINGLE SOURCE OF TRUTH: Analysis data selectors for normalized access across components
// This utility safely resolves fields from various shapes returned by providers:
// - Top-level columns on competitor_analyses
// - Nested analysis_data.{field}
// - Nested analysis_data.results[0].{field}
// - Provider-normalized results under analysis_data.api_responses.{provider}.normalized_result
//
// NOTE: Do not remove or duplicate this file. All analysis components should use these selectors
// to avoid scattered fallback logic.

export type AnyRecord = Record<string, any>;

function get(obj: AnyRecord | null | undefined, path: string[]): any {
  let cur: any = obj;
  for (const key of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[key];
  }
  return cur;
}

/**
 * Resolve a value for a key from analysis object using multiple fallbacks
 */
export function selectField(analysis: AnyRecord, key: string): any {
  if (!analysis) return undefined;

  // 1) Top-level
  const tl = (analysis as AnyRecord)[key];
  if (tl !== undefined && tl !== null && !(typeof tl === 'object' && 'message' in tl)) return tl;

  // 2) analysis_data.key
  const ad = get(analysis, ['analysis_data', key]);
  if (ad !== undefined && ad !== null && !(typeof ad === 'object' && 'message' in ad)) return ad;

  // 3) analysis_data.results[0].key
  const res0 = get(analysis, ['analysis_data', 'results', '0', key]);
  if (res0 !== undefined && res0 !== null) return res0;

  // 4) provider-normalized fallbacks
  const fused = get(analysis, ['analysis_data', 'api_responses', 'fused', 'normalized_result', key]);
  if (fused !== undefined) return typeof fused === 'object' && 'value' in fused ? fused.value : fused;

  const openai = get(analysis, ['analysis_data', 'api_responses', 'openai', 'normalized_result', key]);
  if (openai !== undefined) return typeof openai === 'object' && 'value' in openai ? openai.value : openai;

  const anthropic = get(analysis, ['analysis_data', 'api_responses', 'anthropic', 'normalized_result', key]);
  if (anthropic !== undefined) return typeof anthropic === 'object' && 'value' in anthropic ? anthropic.value : anthropic;

  return undefined;
}

/**
 * Resolve an array field robustly (always returns an array)
 */
export function selectArrayField<T = any>(analysis: AnyRecord, key: string): T[] {
  const v = selectField(analysis, key);
  if (Array.isArray(v)) return v as T[];
  return [];
}

/**
 * Quick helper for SWOT visibility checks
 */
export function hasAnySwot(analysis: AnyRecord): boolean {
  return (
    selectArrayField(analysis, 'strengths').length > 0 ||
    selectArrayField(analysis, 'weaknesses').length > 0 ||
    selectArrayField(analysis, 'opportunities').length > 0 ||
    selectArrayField(analysis, 'threats').length > 0
  );
}
