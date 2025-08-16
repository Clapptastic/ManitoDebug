/**
 * BRIDGE FILE — Single Source of Truth is src/types/competitor-analysis.ts
 * This file re-exports all Competitor types to maintain backward compatibility
 * with legacy imports from '@/types/competitor/unified-types'.
 */

export type {
  CompetitorAnalysisEntity,
  SavedAnalysis,
  CompetitorAnalysisRequest,
  CompetitorData,
  CompetitorAnalysis,
  CompetitorAnalysisResult,
  Competitor,
  SWOTAnalysis,
  MarketAnalysis,
  AnalysisInsight,
  ApiKeyRequirement,
  SourceCitation,
  MetricCardProps,
  ScoreVisualizationProps,
  InsightCardProps,
  ReportSection,
  AnalysisProgress,
  ExportOptions
} from '@/types/competitor-analysis';
