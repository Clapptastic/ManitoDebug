import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { AnalysisReportHeader } from './AnalysisReportHeader';
import { AnalysisReportNavigation } from './AnalysisReportNavigation';
import { ExecutiveSummarySection } from './sections/ExecutiveSummarySection';
import { SwotAnalysisSection } from './sections/SwotAnalysisSection';
import { MarketAnalysisSection } from './sections/MarketAnalysisSection';
import { FinancialAnalysisSection } from './sections/FinancialAnalysisSection';
import { TechnologyAnalysisSection } from './sections/TechnologyAnalysisSection';
import { CompetitiveAnalysisSection } from './sections/CompetitiveAnalysisSection';
import { PersonnelAnalysisSection } from './sections/PersonnelAnalysisSection';
import { SourceCitations } from '../SourceCitations';
import { ReportSkeleton, ErrorFallback } from './ui/LoadingStates';
import { useAnalysisReport } from './hooks/useAnalysisReport';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Shield, 
  Users, 
  CheckCircle 
} from 'lucide-react';
import type { ReportSection } from './types/reportTypes';

interface AnalysisReportContainerProps {
  analysisId?: string;
}

export const AnalysisReportContainer: React.FC<AnalysisReportContainerProps> = ({ analysisId }) => {
  const [activeSection, setActiveSection] = useState('executive');
  const { analysis, loading, refreshing, error, refreshAnalysis, exportAnalysis, fetchAnalysis } = useAnalysisReport(analysisId);

  const sections: ReportSection[] = [
    { id: 'executive', title: 'Executive', icon: BarChart3, component: ExecutiveSummarySection },
    { id: 'swot', title: 'SWOT', icon: Target, component: SwotAnalysisSection },
    { id: 'market', title: 'Market', icon: TrendingUp, component: MarketAnalysisSection },
    { id: 'financial', title: 'Financial', icon: DollarSign, component: FinancialAnalysisSection },
    { id: 'technology', title: 'Technology', icon: Zap, component: TechnologyAnalysisSection },
    { id: 'competitive', title: 'Competitive', icon: Shield, component: CompetitiveAnalysisSection },
    { id: 'personnel', title: 'Personnel', icon: Users, component: PersonnelAnalysisSection },
    { id: 'sources', title: 'Sources', icon: CheckCircle, component: ExecutiveSummarySection }
  ];

  if (loading) {
    return <ReportSkeleton />;
  }

  if (error) {
    return <ErrorFallback error={error} onRetry={fetchAnalysis} />;
  }

  if (!analysis) {
    return null;
  }

  const ActiveComponent = sections.find(s => s.id === activeSection)?.component || ExecutiveSummarySection;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <AnalysisReportHeader
          analysis={analysis}
          refreshing={refreshing}
          onRefresh={refreshAnalysis}
        />

        <AnalysisReportNavigation
          sections={sections}
          analysis={analysis}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <div className="min-h-[600px]">
          {activeSection === 'sources' ? (
            <SourceCitations 
              citations={analysis.source_citations || []}
              confidenceScores={analysis.confidence_scores}
            />
          ) : (
            <ActiveComponent analysis={analysis} />
          )}
        </div>
      </div>
    </div>
  );
};