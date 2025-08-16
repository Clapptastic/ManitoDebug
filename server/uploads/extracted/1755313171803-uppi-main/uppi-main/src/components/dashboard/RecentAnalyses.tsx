import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { dataManager } from '@/services/core/DataManager';
import { useAuth } from '@/hooks/auth/useAuth';
import { Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export const RecentAnalyses: React.FC = () => {
  const { user } = useAuth();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['recent-analyses', user?.id],
    queryFn: () => dataManager.fetchData('competitor_analyses', {
      filters: { user_id: user?.id },
      select: 'id,name,status,created_at,data_quality_score',
      orderBy: { column: 'created_at', ascending: false },
      limit: 5
    }),
    enabled: !!user?.id
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recent Analyses
        </CardTitle>
        <CardDescription>
          Your latest competitor analysis results
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Loading analyses...</span>
          </div>
        ) : !analyses || analyses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No analyses found</p>
            <p className="text-xs text-muted-foreground mt-1">Start your first competitor analysis to see results here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis: any) => (
                // key prevents React list key warning
                <Link key={analysis.id} to={`/market-research/competitor-analysis/details/${analysis.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors" aria-label={`View analysis ${analysis.name}`}>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{analysis.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                    </p>
                    {analysis.data_quality_score && (
                      <p className="text-xs text-muted-foreground">
                        Quality Score: {Math.round(analysis.data_quality_score * 100)}%
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusVariant(analysis.status)}>
                    {analysis.status}
                  </Badge>
                </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};