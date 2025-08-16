import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AIDisclaimer } from '@/components/ui/ai-disclaimer';
import { useNavigation } from '@/hooks/useNavigation';
import { 
  Building2, 
  MapPin, 
  Users, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  FileText
} from 'lucide-react';

interface CompetitorCardProps {
  competitor: any;
  onViewDetails?: (competitor: any) => void;
}

export const CompetitorCard: React.FC<CompetitorCardProps> = ({ 
  competitor, 
  onViewDetails 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { goTo } = useNavigation();

  const getMarketPositionColor = (position: string) => {
    switch (position?.toLowerCase()) {
      case 'leader':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'challenger':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'follower':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'niche':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEmployeeCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {competitor.name || competitor.competitor_name}
            </CardTitle>
            {competitor.market_position && (
              <Badge className={getMarketPositionColor(competitor.market_position)}>
                {competitor.market_position}
              </Badge>
            )}
          </div>
          
          {competitor.data_quality_score && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">
                {competitor.data_quality_score}%
              </span>
            </div>
          )}
        </div>
        
        {/* Basic Info Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-sm">
          {competitor.founded_year && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{competitor.founded_year}</span>
            </div>
          )}
          
          {competitor.headquarters && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{competitor.headquarters}</span>
            </div>
          )}
          
          {competitor.employee_count && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{formatEmployeeCount(competitor.employee_count)} employees</span>
            </div>
          )}
          
          {competitor.website && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <a 
                href={competitor.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Website
              </a>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Disclaimer */}
        <AIDisclaimer 
          variant="default"
          confidence={competitor.confidence_scores?.overall || 85}
          customMessage="This competitor analysis was generated using AI and contains estimates."
          className="mb-4"
        />

        {/* Company Overview */}
        {competitor.company_overview && (
          <div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {competitor.company_overview}
            </p>
          </div>
        )}

        {/* Quick SWOT Preview */}
        <div className="grid grid-cols-2 gap-4">
          {competitor.strengths && competitor.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Strengths
              </h4>
              <div className="space-y-1">
                {competitor.strengths.slice(0, 2).map((strength: string, index: number) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    • {strength}
                  </p>
                ))}
                {competitor.strengths.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{competitor.strengths.length - 2} more
                  </p>
                )}
              </div>
            </div>
          )}

          {competitor.weaknesses && competitor.weaknesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Weaknesses
              </h4>
              <div className="space-y-1">
                {competitor.weaknesses.slice(0, 2).map((weakness: string, index: number) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    • {weakness}
                  </p>
                ))}
                {competitor.weaknesses.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{competitor.weaknesses.length - 2} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expandable Section */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2">
              <span>View Detailed Analysis</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Business Model */}
            {competitor.business_model && (
              <div>
                <h4 className="text-sm font-medium mb-2">Business Model</h4>
                <p className="text-sm text-muted-foreground">{competitor.business_model}</p>
              </div>
            )}

            {/* Opportunities */}
            {competitor.opportunities && competitor.opportunities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Opportunities
                </h4>
                <ul className="space-y-1">
                  {competitor.opportunities.map((opportunity: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {opportunity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Threats */}
            {competitor.threats && competitor.threats.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Threats
                </h4>
                <ul className="space-y-1">
                  {competitor.threats.map((threat: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {threat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Target Market */}
            {competitor.target_market && competitor.target_market.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Target Markets</h4>
                <div className="flex flex-wrap gap-1">
                  {competitor.target_market.map((market: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {market}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Competitive Advantages */}
            {competitor.competitive_advantages && competitor.competitive_advantages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Competitive Advantages</h4>
                <div className="flex flex-wrap gap-1">
                  {competitor.competitive_advantages.map((advantage: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {advantage}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Source */}
            {competitor.api_provider && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Analysis powered by {competitor.api_provider} • 
                  Confidence: {competitor.confidence_scores?.overall || 85}%
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-200" 
          onClick={() => {
            console.log('Open Full Report button clicked');
            console.log('Full competitor object:', competitor);
            
            // Try multiple ways to get the ID
            const competitorId = competitor.analysis_id || 
                               competitor.id || 
                               competitor.sessionId || 
                               (competitor.results && Object.keys(competitor.results)[0]);
            
            console.log('Competitor ID found:', competitorId);
            
            if (competitorId) {
              const targetPath = `/market-research/competitor-analysis/details/${competitorId}`;
              console.log('Navigating to:', targetPath);
              goTo(targetPath);
            } else {
              console.warn('No competitor ID found, using fallback');
              // Fallback: use onViewDetails or expand if no ID
              if (onViewDetails) {
                console.log('Using onViewDetails fallback');
                onViewDetails(competitor);
              } else {
                console.log('Expanding card as fallback');
                setIsExpanded(true);
              }
            }
          }}
        >
          <FileText className="h-4 w-4 mr-2" />
          Open Full Report
        </Button>
      </CardContent>
    </Card>
  );
};