import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetitorAnalysisEntity, calculateDataCompleteness } from '@/types/competitor-analysis';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Zap,
  Target,
  Users,
  DollarSign,
  Building
} from 'lucide-react';

interface AnalysisComparisonProps {
  analyses: CompetitorAnalysisEntity[];
  selectedAnalysisIds?: string[];
  onAnalysisSelect?: (analysisIds: string[]) => void;
}

export const AnalysisComparison: React.FC<AnalysisComparisonProps> = ({
  analyses,
  selectedAnalysisIds = [],
  onAnalysisSelect
}) => {
  const [primaryAnalysisId, setPrimaryAnalysisId] = useState<string>(selectedAnalysisIds[0] || '');
  const [compareAnalysisId, setCompareAnalysisId] = useState<string>(selectedAnalysisIds[1] || '');

  const primaryAnalysis = analyses.find(a => a.id === primaryAnalysisId);
  const compareAnalysis = analyses.find(a => a.id === compareAnalysisId);

  const comparisonData = useMemo(() => {
    if (!primaryAnalysis || !compareAnalysis) return null;

    const metrics = [
      {
        key: 'data_completeness',
        label: 'Data Completeness',
        icon: BarChart3,
        primary: calculateDataCompleteness(primaryAnalysis),
        compare: calculateDataCompleteness(compareAnalysis),
        format: (val: number) => `${val}%`
      },
      {
        key: 'employee_count',
        label: 'Employee Count',
        icon: Users,
        primary: primaryAnalysis.employee_count || 0,
        compare: compareAnalysis.employee_count || 0,
        format: (val: number) => val.toLocaleString()
      },
      {
        key: 'revenue_estimate',
        label: 'Revenue Estimate',
        icon: DollarSign,
        primary: primaryAnalysis.revenue_estimate || 0,
        compare: compareAnalysis.revenue_estimate || 0,
        format: (val: number) => `$${(val / 1000000).toFixed(1)}M`
      },
      {
        key: 'market_share',
        label: 'Market Share',
        icon: Target,
        primary: primaryAnalysis.market_share_estimate || 0,
        compare: compareAnalysis.market_share_estimate || 0,
        format: (val: number) => `${val}%`
      },
      {
        key: 'innovation_score',
        label: 'Innovation Score',
        icon: Zap,
        primary: primaryAnalysis.innovation_score || 0,
        compare: compareAnalysis.innovation_score || 0,
        format: (val: number) => `${val}/100`
      },
      {
        key: 'brand_strength',
        label: 'Brand Strength',
        icon: Building,
        primary: primaryAnalysis.brand_strength_score || 0,
        compare: compareAnalysis.brand_strength_score || 0,
        format: (val: number) => `${val}/100`
      }
    ];

    return metrics;
  }, [primaryAnalysis, compareAnalysis]);

  const getTrendIcon = (primary: number, compare: number) => {
    if (primary > compare) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (primary < compare) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getPercentDifference = (primary: number, compare: number) => {
    if (compare === 0) return primary > 0 ? 100 : 0;
    return Math.round(((primary - compare) / compare) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitor Analysis Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Primary Analysis</label>
              <Select value={primaryAnalysisId} onValueChange={setPrimaryAnalysisId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary analysis" />
                </SelectTrigger>
                <SelectContent>
                  {analyses.map(analysis => (
                    <SelectItem key={analysis.id} value={analysis.id}>
                      {analysis.name} ({analysis.industry || 'Unknown'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Compare With</label>
              <Select value={compareAnalysisId} onValueChange={setCompareAnalysisId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select comparison analysis" />
                </SelectTrigger>
                <SelectContent>
                  {analyses
                    .filter(a => a.id !== primaryAnalysisId)
                    .map(analysis => (
                      <SelectItem key={analysis.id} value={analysis.id}>
                        {analysis.name} ({analysis.industry || 'Unknown'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {primaryAnalysis && compareAnalysis && (
            <Button
              onClick={() => onAnalysisSelect?.([primaryAnalysisId, compareAnalysisId])}
              className="w-full"
            >
              Compare Selected Analyses
            </Button>
          )}
        </CardContent>
      </Card>

      {comparisonData && (
        <div className="grid gap-4">
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Company Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-primary">{primaryAnalysis.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Industry:</span> {primaryAnalysis.industry || 'Not specified'}</p>
                    <p><span className="font-medium">Founded:</span> {primaryAnalysis.founded_year || 'Unknown'}</p>
                    <p><span className="font-medium">Headquarters:</span> {primaryAnalysis.headquarters || 'Unknown'}</p>
                    <p><span className="font-medium">Business Model:</span> {primaryAnalysis.business_model || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-secondary">{compareAnalysis.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Industry:</span> {compareAnalysis.industry || 'Not specified'}</p>
                    <p><span className="font-medium">Founded:</span> {compareAnalysis.founded_year || 'Unknown'}</p>
                    <p><span className="font-medium">Headquarters:</span> {compareAnalysis.headquarters || 'Unknown'}</p>
                    <p><span className="font-medium">Business Model:</span> {compareAnalysis.business_model || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData.map(metric => {
                  const Icon = metric.icon;
                  const diff = getPercentDifference(metric.primary, metric.compare);
                  
                  return (
                    <div key={metric.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{metric.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-primary">
                            {metric.format(metric.primary)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {primaryAnalysis.name}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getTrendIcon(metric.primary, metric.compare)}
                          <Badge variant={diff > 0 ? 'default' : diff < 0 ? 'destructive' : 'secondary'}>
                            {diff > 0 ? '+' : ''}{diff}%
                          </Badge>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-secondary">
                            {metric.format(metric.compare)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {compareAnalysis.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* SWOT Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>SWOT Analysis Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-primary">{primaryAnalysis.name}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {(primaryAnalysis.strengths || []).slice(0, 3).map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Weaknesses</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {(primaryAnalysis.weaknesses || []).slice(0, 3).map((weakness, i) => (
                          <li key={i}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-secondary">{compareAnalysis.name}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {(compareAnalysis.strengths || []).slice(0, 3).map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Weaknesses</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {(compareAnalysis.weaknesses || []).slice(0, 3).map((weakness, i) => (
                          <li key={i}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};