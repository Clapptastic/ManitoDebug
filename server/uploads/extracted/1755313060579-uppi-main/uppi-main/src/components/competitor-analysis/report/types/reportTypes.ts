/**
 * Report types for competitor analysis reporting system
 * Consolidated from legacy types and unified for consistency
 */

// Re-export from master types file for backward compatibility
export type { 
  CompetitorAnalysisEntity as CompetitorAnalysis,
  SourceCitation
} from '@/types/competitor-analysis';

// Local metadata type
export interface AnalysisMetadata {
  title: string;
  description?: string;
  tags?: string[];
  lastUpdated: string;
}

// Report-specific types
export interface ReportSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ analysis: CompetitorAnalysisEntity }>;
}

export interface ReportInsight {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'competitive' | 'financial' | 'market' | 'technology' | 'personnel';
  confidence: number;
  source: string;
}

export interface ReportMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  comparison?: {
    baseline: number;
    change: number;
  };
}

export interface CompetitorScore {
  overall: number;
  categories: {
    competitive: number;
    financial: number;
    market: number;
    technology: number;
    personnel: number;
  };
}

// UI Component Props - Updated to match actual usage
export interface InsightCardProps {
  insight?: ReportInsight;
  title?: string;
  insights?: string[];
  type?: string;
  confidence?: any;
  sources?: any;
  onExpand?: () => void;
}

export interface MetricCardProps {
  metric?: ReportMetric;
  title?: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'neutral';
  confidence?: any;
  competitorId?: string;
  showInsufficientDataAction?: boolean;
  className?: string;
}

export interface ScoreVisualizationProps {
  score?: CompetitorScore;
  title?: string;
  scores?: Array<{ label: string; value: number; confidence: any }>;
  className?: string;
}

// Import for consistency
import type { CompetitorAnalysisEntity } from '@/types/competitor-analysis';