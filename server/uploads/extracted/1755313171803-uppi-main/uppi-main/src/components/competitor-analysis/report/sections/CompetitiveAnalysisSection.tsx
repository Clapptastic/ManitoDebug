import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Sword, 
  Target, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Handshake,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MetricCard } from '../ui/MetricCard';
import { InsightCard } from '../ui/InsightCard';
import type { CompetitorAnalysis } from '../types/reportTypes';

interface CompetitiveAnalysisSectionProps {
  analysis: CompetitorAnalysis;
}

export const CompetitiveAnalysisSection: React.FC<CompetitiveAnalysisSectionProps> = ({ analysis }) => {
  const [showAllPartnerships, setShowAllPartnerships] = useState(false);
  const analysisResults = analysis.analysis_data?.results || [];
  const primaryResult = analysisResults[0] || analysis;

  // Fallbacks: pull missing fields from nested analysis_data
  const ad: any = (analysis as any).analysis_data || {};
  const overall_threat_level: string = (analysis as any).overall_threat_level || ad.overall_threat_level || 'medium';
  const brand_strength_score: number = (analysis as any).brand_strength_score ?? ad.brand_strength_score ?? 0;
  const competitive_advantages: string[] = (analysis as any).competitive_advantages ?? ad.competitive_advantages ?? [];
  const competitive_disadvantages: string[] = (analysis as any).competitive_disadvantages ?? ad.competitive_disadvantages ?? [];
  const partnerships: string[] = (analysis as any).partnerships ?? ad.partnerships ?? [];

  const getThreatColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Competitive Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Threat Level"
          value={overall_threat_level || 'Unknown'}
          subtitle="Competitive threat"
          icon={Shield}
          className={getThreatColor(overall_threat_level || 'medium')}
          competitorId={analysis.id}
          showInsufficientDataAction={true}
        />
        
        <MetricCard
          title="Brand Strength"
          value={`${Math.round(brand_strength_score || 0)}%`}
          subtitle="Market presence"
          icon={TrendingUp}
          confidence={analysis.confidence_scores?.brand_strength_score}
        />
        
        <MetricCard
          title="Competitive Advantages"
          value={competitive_advantages?.length || 0}
          subtitle="Key strengths"
          icon={Target}
        />
        
        <MetricCard
          title="Partnerships"
          value={partnerships?.length || 0}
          subtitle="Strategic alliances"
          icon={Handshake}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Competitive Advantages */}
        {competitive_advantages && competitive_advantages.length > 0 && (
          <InsightCard
            title="Competitive Advantages"
            insights={competitive_advantages}
            type="strength"
            confidence={analysis.confidence_scores?.competitive_advantages}
            sources={analysis.source_citations?.filter(s => s.field === 'competitive_advantages')}
          />
        )}

        {/* Competitive Disadvantages */}
        {competitive_disadvantages && competitive_disadvantages.length > 0 && (
          <InsightCard
            title="Competitive Disadvantages"
            insights={competitive_disadvantages}
            type="weakness"
            confidence={analysis.confidence_scores?.competitive_disadvantages}
            sources={analysis.source_citations?.filter(s => s.field === 'competitive_disadvantages')}
          />
        )}
      </div>

      {/* Strategic Partnerships */}
      {partnerships && partnerships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              Strategic Partnerships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(showAllPartnerships ? partnerships : partnerships.slice(0, 6)).map((partnership, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-blue-100 rounded">
                      <Handshake className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-medium">{partnership}</h4>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Strategic Partner
                  </Badge>
                </div>
              ))}
            </div>
            
            {partnerships.length > 6 && (
              <div className="text-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllPartnerships(!showAllPartnerships)}
                  className="gap-2"
                >
                  {showAllPartnerships ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Less Partnerships
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show All {partnerships.length} Partnerships
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Competitive Analysis Summary */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-orange-600" />
            Competitive Positioning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Threat Level Analysis */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${getThreatColor(overall_threat_level || 'medium')}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Overall Threat Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    This competitor poses a <strong>{(overall_threat_level || 'medium').toLowerCase()}</strong> threat level to your market position.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-3">
              <h4 className="font-medium text-muted-foreground">Key Competitive Insights</h4>
              
              {competitive_advantages && competitive_advantages.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Key Strengths</p>
                    <p className="text-xs text-muted-foreground">
                      {competitive_advantages.length} competitive advantages identified
                    </p>
                  </div>
                </div>
              )}
              
              {competitive_disadvantages && competitive_disadvantages.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Potential Weaknesses</p>
                    <p className="text-xs text-muted-foreground">
                      {competitive_disadvantages.length} areas for potential competitive advantage
                    </p>
                  </div>
                </div>
              )}
              
              {analysis.partnerships && analysis.partnerships.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Strategic Network</p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.partnerships.length} strategic partnerships leveraged
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};