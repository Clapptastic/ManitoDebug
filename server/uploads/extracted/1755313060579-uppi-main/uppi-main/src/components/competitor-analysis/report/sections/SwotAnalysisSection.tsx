import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  ShieldAlert
} from 'lucide-react';
import { InsightCard } from '../ui/InsightCard';
import type { CompetitorAnalysis } from '../types/reportTypes';

interface SwotAnalysisSectionProps {
  analysis: CompetitorAnalysis;
}

export const SwotAnalysisSection: React.FC<SwotAnalysisSectionProps> = ({ analysis }) => {
  const analysisResults = analysis.analysis_data?.results || [];
  const primaryResult = analysisResults[0] || analysis;

  const swotData = {
    strengths: analysis.strengths || primaryResult.strengths || [],
    weaknesses: analysis.weaknesses || primaryResult.weaknesses || [],
    opportunities: analysis.opportunities || primaryResult.opportunities || [],
    threats: analysis.threats || primaryResult.threats || []
  };

  const totalItems = Object.values(swotData).flat().length;

  return (
    <div className="space-y-8">
      {/* SWOT Overview */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-background to-muted/30">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">SWOT Analysis</h2>
            <p className="text-muted-foreground">
              Comprehensive analysis of {analysis.name}'s competitive position
            </p>
            {totalItems > 0 && (
              <Badge variant="secondary" className="mt-2">
                {totalItems} insights identified
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="p-3 bg-green-50 rounded-lg mb-2 inline-block">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium">Strengths</p>
              <p className="text-xl font-bold text-green-600">{swotData.strengths.length}</p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-red-50 rounded-lg mb-2 inline-block">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm font-medium">Weaknesses</p>
              <p className="text-xl font-bold text-red-600">{swotData.weaknesses.length}</p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-blue-50 rounded-lg mb-2 inline-block">
                <Lightbulb className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium">Opportunities</p>
              <p className="text-xl font-bold text-blue-600">{swotData.opportunities.length}</p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-orange-50 rounded-lg mb-2 inline-block">
                <ShieldAlert className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium">Threats</p>
              <p className="text-xl font-bold text-orange-600">{swotData.threats.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SWOT Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightCard
          title="Strengths"
          insights={swotData.strengths}
          type="strength"
          confidence={analysis.confidence_scores?.strengths}
          sources={analysis.source_citations?.filter(s => s.field === 'strengths')}
        />
        
        <InsightCard
          title="Weaknesses"
          insights={swotData.weaknesses}
          type="weakness"
          confidence={analysis.confidence_scores?.weaknesses}
          sources={analysis.source_citations?.filter(s => s.field === 'weaknesses')}
        />
        
        <InsightCard
          title="Opportunities"
          insights={swotData.opportunities}
          type="opportunity"
          confidence={analysis.confidence_scores?.opportunities}
          sources={analysis.source_citations?.filter(s => s.field === 'opportunities')}
        />
        
        <InsightCard
          title="Threats"
          insights={swotData.threats}
          type="threat"
          confidence={analysis.confidence_scores?.threats}
          sources={analysis.source_citations?.filter(s => s.field === 'threats')}
        />
      </div>

      {/* Strategic Analysis */}
      {analysis.swot_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Strategic Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {typeof analysis.swot_analysis === 'string' 
                  ? analysis.swot_analysis 
                  : analysis.swot_analysis?.summary || 'No strategic analysis available'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};