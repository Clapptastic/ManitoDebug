import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SourceCitation {
  field: string;
  source: string;
  url?: string;
  confidence: number;
  data_point?: string;
  verification_date?: string;
}

interface SourceVerificationBannerProps {
  citations: SourceCitation[];
  className?: string;
}

export function SourceVerificationBanner({ citations, className = '' }: SourceVerificationBannerProps) {
  const citationsWithUrls = citations.filter(c => c.url && c.url.trim() !== '');
  const avgConfidence = citations.length > 0 
    ? citations.reduce((sum, c) => sum + (c.confidence <= 1 ? c.confidence * 100 : c.confidence), 0) / citations.length 
    : 0;
  
  const uniqueDomains = new Set(
    citationsWithUrls.map(c => {
      try {
        return new URL(c.url!).hostname;
      } catch {
        return 'unknown';
      }
    })
  );

  const getVerificationLevel = () => {
    if (citationsWithUrls.length >= 8 && avgConfidence >= 80) {
      return { level: 'High', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2 };
    } else if (citationsWithUrls.length >= 5 && avgConfidence >= 60) {
      return { level: 'Medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Shield };
    } else {
      return { level: 'Low', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle };
    }
  };

  const verification = getVerificationLevel();
  const VerificationIcon = verification.icon;

  if (citations.length === 0) {
    return null;
  }

  return (
    <Card className={`border-l-4 border-l-primary ${className}`}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VerificationIcon className="h-5 w-5 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Data Verification Status</span>
                <Badge variant="outline" className={`text-xs ${verification.color}`}>
                  {verification.level} Confidence
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {citationsWithUrls.length} verified sources from {uniqueDomains.size} domains
                {avgConfidence > 0 && (
                  <span className="ml-2">• {Math.round(avgConfidence)}% avg. confidence</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                    <ExternalLink className="h-3 w-3" />
                    {citationsWithUrls.length} URLs
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-sm">
                    <p className="font-medium mb-2">Source domains:</p>
                    <div className="text-xs space-y-1">
                      {Array.from(uniqueDomains).slice(0, 8).map(domain => (
                        <div key={domain} className="font-mono">{domain}</div>
                      ))}
                      {uniqueDomains.size > 8 && (
                        <div className="text-muted-foreground">+{uniqueDomains.size - 8} more</div>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {verification.level === 'High' && (
              <Badge variant="outline" className="text-xs text-green-600 bg-green-50 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}