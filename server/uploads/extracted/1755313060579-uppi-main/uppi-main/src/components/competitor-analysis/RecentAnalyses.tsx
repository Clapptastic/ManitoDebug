
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Analysis {
  id: string;
  name: string;
  status: string;
  created_at: string;
  analysis_data?: any[];
  data_quality_score?: number;
}

interface RecentAnalysesProps {
  analyses: Analysis[];
  onRefresh?: (analysisId: string) => void;
}

export const RecentAnalyses: React.FC<RecentAnalysesProps> = ({ analyses, onRefresh }) => {
  const navigate = useNavigate();

  if (!analyses || analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No recent analyses found. Start your first competitor analysis above.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusInfo = (analysis: Analysis) => {
    // Check for failed analysis data
    if (analysis.analysis_data && Array.isArray(analysis.analysis_data)) {
      const hasFailures = analysis.analysis_data.some((item: any) => 
        item.status === 'failed' || item.error
      );
      if (hasFailures) {
        return { status: 'failed', variant: 'destructive' as const, icon: AlertTriangle };
      }
    }

    switch (analysis.status) {
      case 'completed':
        return { status: 'completed', variant: 'default' as const, icon: null };
      case 'failed':
        return { status: 'failed', variant: 'destructive' as const, icon: AlertTriangle };
      case 'processing':
        return { status: 'processing', variant: 'secondary' as const, icon: null };
      default:
        return { status: analysis.status, variant: 'secondary' as const, icon: null };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Analyses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {analyses.map((analysis) => {
            const statusInfo = getStatusInfo(analysis);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={analysis.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{analysis.name}</h4>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                        {StatusIcon && <StatusIcon className="h-3 w-3" />}
                        {statusInfo.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(analysis.created_at).toLocaleDateString()} • 
                      Quality: {Math.round((analysis.data_quality_score || 0) * 100)}%
                    </p>
                    
                    {statusInfo.status === 'failed' && analysis.analysis_data && (
                      <div className="mt-2">
                        <p className="text-sm text-destructive">
                          Analysis failed - check API keys and try again
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {statusInfo.status === 'failed' && onRefresh && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRefresh(analysis.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/market-research/competitor-analysis/details/${analysis.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
