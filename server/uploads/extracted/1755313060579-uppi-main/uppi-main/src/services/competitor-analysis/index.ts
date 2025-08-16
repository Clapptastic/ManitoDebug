/**
 * SINGLE SOURCE OF TRUTH: Competitor Analysis Service Exports
 * Phase 1.3 Remediation: Consolidated service exports
 */

// Export the unified service as default and named exports
export { unifiedCompetitorAnalysisService as default } from './unified';
export { unifiedCompetitorAnalysisService, UnifiedCompetitorAnalysisService } from './unified';

// Backward compatibility export
export { unifiedCompetitorAnalysisService as competitorAnalysisService } from './unified';

// Type exports
export type {
  CompetitorAnalysis,
  CompetitorAnalysisResult,
  SavedAnalysis
} from '@/types/competitor-analysis';