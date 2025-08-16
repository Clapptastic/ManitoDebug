import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Target,
  PiggyBank,
  Building2,
  Banknote,
  Calculator
} from 'lucide-react';
import { MetricCard } from '../ui/MetricCard';
import type { CompetitorAnalysis } from '../types/reportTypes';

interface FinancialAnalysisSectionProps {
  analysis: CompetitorAnalysis;
}

export const FinancialAnalysisSection: React.FC<FinancialAnalysisSectionProps> = ({ analysis }) => {
  const analysisResults = analysis.analysis_data?.results || [];
  const primaryResult = analysisResults[0] || analysis;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  return (
    <div className="space-y-8">
      {/* Financial Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue Estimate"
          value={analysis.revenue_estimate ? formatCurrency(analysis.revenue_estimate) : 'N/A'}
          subtitle="Annual revenue"
          icon={DollarSign}
          confidence={analysis.confidence_scores?.revenue_estimate}
        />
        
        <MetricCard
          title="Market Share"
          value={`${analysis.market_share_estimate || 0}%`}
          subtitle="Market position"
          icon={Target}
          confidence={analysis.confidence_scores?.market_share_estimate}
        />
        
        <MetricCard
          title="Funding Status"
          value={analysis.funding_info?.total_funding ? formatCurrency(analysis.funding_info.total_funding) : 'Private'}
          subtitle="Total funding"
          icon={PiggyBank}
          confidence={analysis.confidence_scores?.funding_info}
        />
        
        <MetricCard
          title="Financial Health"
          value={analysis.financial_metrics?.health_score ? `${analysis.financial_metrics.health_score}%` : 'N/A'}
          subtitle="Overall score"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pricing Strategy */}
        {analysis.pricing_strategy && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Pricing Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {typeof analysis.pricing_strategy === 'string' ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.pricing_strategy}
                  </p>
                ) : (
                  <>
                    {analysis.pricing_strategy?.model && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">Pricing Model</span>
                        <Badge variant="secondary">{analysis.pricing_strategy.model}</Badge>
                      </div>
                    )}
                    
                    {analysis.pricing_strategy?.tiers && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Pricing Tiers</p>
                        {analysis.pricing_strategy.tiers.map((tier: any, index: number) => (
                          <div key={index} className="border border-border rounded-lg p-3 bg-background">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{tier.name || `Tier ${index + 1}`}</span>
                              <Badge variant="outline" className="text-xs font-mono">{tier.price || 'Custom'}</Badge>
                            </div>
                            {tier.features && tier.features.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {tier.features.map((feature: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {analysis.pricing_strategy?.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.pricing_strategy.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Funding Information */}
        {analysis.funding_info && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Funding Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {typeof analysis.funding_info === 'string' ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.funding_info}
                  </p>
                ) : (
                  <>
                    {analysis.funding_info?.total_funding && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Total Funding</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(analysis.funding_info.total_funding)}
                        </span>
                      </div>
                    )}
                    
                    {analysis.funding_info?.last_round && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Latest Round</p>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">{analysis.funding_info.last_round.type || 'Series Unknown'}</span>
                            <Badge variant="outline">{analysis.funding_info.last_round.date}</Badge>
                          </div>
                          {analysis.funding_info.last_round.amount && (
                            <p className="text-lg font-semibold">
                              {formatCurrency(analysis.funding_info.last_round.amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {analysis.funding_info?.investors && Array.isArray(analysis.funding_info.investors) && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Key Investors</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.funding_info.investors.slice(0, 5).map((investor, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {investor}
                            </Badge>
                          ))}
                          {analysis.funding_info.investors.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{analysis.funding_info.investors.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Financial Metrics */}
      {analysis.financial_metrics && Object.keys(analysis.financial_metrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Financial Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analysis.financial_metrics).map(([key, value]) => {
                if (typeof value === 'object' || value === null) return null;
                
                const formatKey = (k: string) => 
                  k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <div key={key} className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      {formatKey(key)}
                    </p>
                    <p className="text-sm font-semibold">
                      {typeof value === 'number' ? 
                        (key.includes('revenue') || key.includes('funding') ? formatCurrency(value) : value) : 
                        String(value)
                      }
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Analysis Summary */}
      {primaryResult.financial_analysis && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              Financial Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {typeof primaryResult.financial_analysis === 'string' 
                  ? primaryResult.financial_analysis 
                  : primaryResult.financial_analysis?.summary || 'No financial analysis summary available'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};