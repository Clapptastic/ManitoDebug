
/**
 * CONSOLIDATED TYPE EXPORTS
 * Single source of truth for all application types
 */

// Core unified types (SINGLE SOURCE OF TRUTH)
export * from './core/unified';

// Specific domain types
export type { 
  Organization,
  Profile
} from './database';
export * from './typeCoverage';

// API Keys - use unified only
export * from './api-keys/unified';

// Admin types  
export * from './admin';

// Competitor analysis - avoid conflicts
export type {
  CompetitorAnalysisEntity,
  SavedAnalysis,
  CompetitorAnalysisRequest,
  SourceCitation,
  MetricCardProps,
  ScoreVisualizationProps,
  InsightCardProps,
  ReportSection,
  AnalysisProgress,
  ExportOptions
} from './competitor-analysis';

// Legacy compatibility exports (DO NOT ADD NEW ONES)
export type { TypeCoverageData } from './typeCoverage';
export type { CompetitorData } from './core/interfaces';

// CONSOLIDATED: Error Boundary - use ErrorBoundaryWithFeedback as single source
export { ErrorBoundaryWithFeedback as ErrorBoundary } from '@/components/common/ErrorBoundaryWithFeedback';

// System UI types
export interface DashboardMetrics {
  totalAnalyses: number;
  completedAnalyses: number;
  activeApiKeys: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
}
