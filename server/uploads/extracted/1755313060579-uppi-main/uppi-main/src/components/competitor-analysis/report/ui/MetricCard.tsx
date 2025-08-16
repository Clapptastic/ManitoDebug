import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, HelpCircle, Info, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import type { MetricCardProps } from '../types/reportTypes';

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  confidence,
  className = '',
  competitorId,
  showInsufficientDataAction = false
}) => {
  const getScoreCalculationExplanation = (title: string) => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('innovation')) {
      return "Innovation Score: Calculated based on R&D investment, patent filings, technology adoption speed, product launch frequency, and industry recognition. Scores 80-100: High innovation, 60-79: Moderate innovation, <60: Low innovation.";
    }
    if (lowerTitle.includes('brand strength')) {
      return "Brand Strength Score: Evaluated using market share, customer loyalty metrics, brand recognition surveys, social media presence, and market positioning. Weighted by industry reputation and competitive differentiation.";
    }
    if (lowerTitle.includes('data quality') || lowerTitle.includes('quality')) {
      return "Data Quality Score: Measures the reliability and completeness of analysis data. Based on source credibility, data freshness, cross-validation across multiple sources, and confidence levels from AI providers.";
    }
    if (lowerTitle.includes('security')) {
      return "Security Score: Assessment of cybersecurity posture including security certifications, incident history, compliance standards, encryption practices, and vulnerability management. Higher scores indicate stronger security.";
    }
    if (lowerTitle.includes('operational efficiency')) {
      return "Operational Efficiency Score: Calculated from revenue per employee, process automation level, cost structure optimization, and resource utilization metrics compared to industry benchmarks.";
    }
    if (lowerTitle.includes('market sentiment')) {
      return "Market Sentiment Score: Aggregated from customer reviews, analyst ratings, social media sentiment, press coverage tone, and investor confidence indicators. Reflects overall market perception.";
    }
    if (lowerTitle.includes('threat level')) {
      return "Threat Level: Determined by market share overlap, competitive advantages, growth trajectory, financial strength, and strategic positioning relative to your business.";
    }
    return null;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      case 'neutral':
        return <Minus className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const calculationExplanation = getScoreCalculationExplanation(title);
  const isThreatLevel = title.toLowerCase().includes('threat level');
  const isInsufficientData = showInsufficientDataAction && (
    value === 'Unknown' || 
    value === 'N/A' || 
    value === 'Not Available' ||
    (typeof value === 'string' && value.trim() === '') ||
    confidence !== undefined && confidence < 30
  );

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {title}
                </p>
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
              {confidence !== undefined && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1.5 py-0.5 ${getConfidenceColor(confidence)}`}
                      >
                        {confidence}%
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Data confidence: How reliable this data point is based on source quality and cross-validation across multiple AI providers.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {getTrendIcon()}
            </div>
            
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {subtitle}
              </p>
            )}
            
            {/* Show insufficient data action for threat level */}
            {isThreatLevel && isInsufficientData && competitorId && (
              <div className="mt-2">
                <Link to={`/market-research/competitor-analysis/company-profile/${competitorId}`}>
                  <Button variant="outline" size="sm" className="text-xs h-6">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Update Profile
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {Icon && (
            <div className="flex-shrink-0 ml-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Subtle gradient overlay for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/[0.02] pointer-events-none" />
    </Card>
  );
};