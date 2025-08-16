import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ScoreVisualizationProps } from '../types/reportTypes';

export const ScoreVisualization: React.FC<ScoreVisualizationProps> = ({
  scores,
  title,
  className = ''
}) => {
  const getScoreCalculationExplanation = (label: string) => {
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('innovation')) {
      return "Innovation Score: Calculated based on R&D investment, patent filings, technology adoption speed, product launch frequency, and industry recognition. Scores 80-100: High innovation, 60-79: Moderate innovation, <60: Low innovation.";
    }
    if (lowerLabel.includes('brand strength')) {
      return "Brand Strength Score: Evaluated using market share, customer loyalty metrics, brand recognition surveys, social media presence, and market positioning. Weighted by industry reputation and competitive differentiation.";
    }
    if (lowerLabel.includes('operational efficiency')) {
      return "Operational Efficiency Score: Calculated from revenue per employee, process automation level, cost structure optimization, and resource utilization metrics compared to industry benchmarks.";
    }
    if (lowerLabel.includes('market sentiment')) {
      return "Market Sentiment Score: Aggregated from customer reviews, analyst ratings, social media sentiment, press coverage tone, and investor confidence indicators. Reflects overall market perception.";
    }
    return null;
  };

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    if (value >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className={`${className}`}>
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? 'pt-0' : 'pt-6'}>
        <div className="space-y-4">
          {scores.map((score, index) => {
            const calculationExplanation = getScoreCalculationExplanation(score.label);
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate">
                        {score.label}
                      </span>
                      {calculationExplanation && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground hover:text-primary cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{calculationExplanation}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {score.confidence !== undefined && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              {score.confidence}% confidence
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Data reliability: How confident we are in this score based on data source quality and cross-validation.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${getScoreColor(score.value)}`}>
                    {Math.round(score.value)}/100
                  </span>
                </div>
                
                <div className="relative">
                  <Progress 
                    value={score.value} 
                    className="h-2"
                    style={{
                      // @ts-ignore - Custom CSS property for progress color
                      '--progress-background': score.color || getProgressColor(score.value)
                    }}
                  />
                  
                  {/* Score value overlay for better readability */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent to-white/20 pointer-events-none"
                    style={{ width: `${Math.max(score.value, 10)}%` }}
                  />
                </div>
              </div>
            );
          })}
          
          {scores.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No performance data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};