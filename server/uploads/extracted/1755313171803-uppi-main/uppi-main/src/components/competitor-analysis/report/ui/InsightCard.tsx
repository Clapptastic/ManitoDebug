import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { InsightCardProps } from '../types/reportTypes';

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  insights,
  type,
  confidence,
  sources = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const getTypeConfig = () => {
    switch (type) {
      case 'strength':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badgeVariant: 'default' as const
        };
      case 'weakness':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeVariant: 'destructive' as const
        };
      case 'opportunity':
        return {
          icon: Lightbulb,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeVariant: 'default' as const
        };
      case 'threat':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          badgeVariant: 'secondary' as const
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeVariant: 'outline' as const
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  if (insights.length === 0) {
    return (
      <Card className={`${config.borderColor} ${config.bgColor}/30`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No {type === 'strength' ? 'strengths' : type === 'weakness' ? 'weaknesses' : type === 'opportunity' ? 'opportunities' : 'threats'} identified
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${config.borderColor} ${config.bgColor}/30`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {title}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.badgeVariant} className="text-xs">
              {insights.length}
            </Badge>
            {confidence && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(confidence * 100)}%
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Confidence score based on data quality</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(isExpanded ? insights : insights.slice(0, 5)).map((insight, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 bg-background/80 rounded-lg border border-border/50"
            >
              <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} mt-2 flex-shrink-0`} />
              <div className="flex-1">
                <p className="text-sm leading-relaxed">{insight}</p>
                {sources.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {sources.length} source{sources.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {insights.length > 5 && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs gap-1 h-8"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show {insights.length - 5} More {type === 'strength' ? 'Strengths' : type === 'weakness' ? 'Weaknesses' : type === 'opportunity' ? 'Opportunities' : 'Threats'}
                  </>
                )}
              </Button>
            </div>
          )}
          
          {sources.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Sources:</p>
                {sources.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllSources(!showAllSources)}
                    className="text-xs h-6 px-2"
                  >
                    {showAllSources ? 'Show Less' : `Show All ${sources.length}`}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {(showAllSources ? sources : sources.slice(0, 3)).map((source, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs cursor-help">
                          {source.source}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Confidence: {Math.round(source.confidence * 100)}%</p>
                        {source.url && (
                          <p className="text-xs text-muted-foreground">{source.url}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};