import { useMemo } from 'react';

interface AnyRecord {
  [key: string]: any;
}

export interface MarketSentiment {
  score: number; // 0-100
  hasData: boolean;
}

/**
 * Derives a market sentiment score from an analysis entity.
 * Priority order:
 * 1) analysis.confidence_scores.overall (0-1 or 0-100)
 * 2) analysis.analysis_data.confidence_scores.overall
 * 3) analysis.analysis_data.results[0].confidence_scores.overall
 * 4) Derived from SWOT counts (strengths vs weaknesses)
 */
export function useMarketSentiment(analysis?: AnyRecord): MarketSentiment {
  return useMemo(() => {
    if (!analysis) return { score: 0, hasData: false };

    const pickOverall = (v: any): number | undefined => {
      if (typeof v === 'number') return v <= 1 ? v * 100 : v;
      return undefined;
    };

    const overall =
      pickOverall(analysis?.confidence_scores?.overall) ??
      pickOverall(analysis?.analysis_data?.confidence_scores?.overall) ??
      pickOverall(analysis?.analysis_data?.results?.[0]?.confidence_scores?.overall);

    if (typeof overall === 'number') {
      const clamped = Math.max(0, Math.min(100, overall));
      return { score: clamped, hasData: true };
    }

    const strengths = (analysis?.strengths ?? analysis?.analysis_data?.strengths ?? analysis?.analysis_data?.results?.[0]?.strengths) || [];
    const weaknesses = (analysis?.weaknesses ?? analysis?.analysis_data?.weaknesses ?? analysis?.analysis_data?.results?.[0]?.weaknesses) || [];

    if (Array.isArray(strengths) || Array.isArray(weaknesses)) {
      const s = Array.isArray(strengths) ? strengths.length : 0;
      const w = Array.isArray(weaknesses) ? weaknesses.length : 0;
      // Base at 50, adjust by +/- 10 per delta, clamp 0..100
      const derived = Math.max(0, Math.min(100, 50 + (s - w) * 10));
      return { score: derived, hasData: true };
    }

    return { score: 0, hasData: false };
  }, [analysis]);
}
