import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Shield, 
  Users, 
  CheckCircle,
  Eye
} from 'lucide-react';
import type { ReportSection, CompetitorAnalysis } from './types/reportTypes';

interface AnalysisReportNavigationProps {
  sections: ReportSection[];
  analysis: CompetitorAnalysis;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const AnalysisReportNavigation: React.FC<AnalysisReportNavigationProps> = ({
  sections,
  analysis,
  activeSection,
  onSectionChange
}) => {
  // Calculate badges for each section based on available data
  const getSectionBadge = (sectionId: string): string | undefined => {
    switch (sectionId) {
      case 'executive':
        return analysis.data_quality_score ? `${Math.round(analysis.data_quality_score)}%` : undefined;
      case 'swot':
        const swotItems = [
          ...(analysis.strengths || []),
          ...(analysis.weaknesses || []),
          ...(analysis.opportunities || []),
          ...(analysis.threats || [])
        ].length;
        return swotItems > 0 ? `${swotItems}` : undefined;
      case 'market':
        return analysis.market_share_estimate ? `${analysis.market_share_estimate}%` : undefined;
      case 'financial':
        return analysis.revenue_estimate ? 'Est.' : undefined;
      case 'technology':
        return analysis.patent_count ? `${analysis.patent_count}` : undefined;
      case 'competitive':
        const compAdvantages = (analysis.competitive_advantages || []).length;
        return compAdvantages > 0 ? `${compAdvantages}` : undefined;
      case 'sources':
        const citations = analysis.source_citations?.length || 0;
        return citations > 0 ? `${citations}` : undefined;
      default:
        return undefined;
    }
  };

  const getBadgeVariant = (sectionId: string) => {
    if (activeSection === sectionId) return 'default';
    return 'secondary';
  };

  return (
    <div className="sticky top-4 z-10 bg-background/80 backdrop-blur-sm border rounded-lg p-1">
      <Tabs value={activeSection} onValueChange={onSectionChange}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1 bg-transparent">
          {sections.map((section) => {
            const IconComponent = section.icon;
            const badge = getSectionBadge(section.id);
            
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-[60px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative group"
              >
                <div className="flex items-center gap-1">
                  <IconComponent className="h-4 w-4" />
                  <span className="sr-only">{section.title}</span>
                  {badge && (
                    <Badge 
                      variant={getBadgeVariant(section.id)}
                      className="text-xs scale-75 absolute -top-1 -right-1"
                    >
                      {badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {section.title}
                </span>
                
                {/* Active indicator */}
                {activeSection === section.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-foreground rounded-full" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};