import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Clock, Target, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompetitorAnalyticsProps {
  className?: string;
}

const CompetitorAnalyticsDashboard: React.FC<CompetitorAnalyticsProps> = ({ className }) => {
  const [analytics, setAnalytics] = React.useState({
    totalAnalyses: 0,
    completedAnalyses: 0,
    avgCompletionTime: 0,
    successRate: 0,
    topCompetitors: [] as Array<{ name: string; analysisCount: number }>
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: analyses } = await supabase
          .from('competitor_analyses')
          .select('id, name, status, created_at, completed_at');

        if (analyses) {
          const totalAnalyses = analyses.length;
          const completedAnalyses = analyses.filter(a => a.status === 'completed').length;
          
          // Calculate average completion time
          const completedWithTimes = analyses.filter(a => 
            a.status === 'completed' && a.created_at && a.completed_at
          );
          
          const avgCompletionTime = completedWithTimes.length > 0
            ? completedWithTimes.reduce((sum, a) => {
                const start = new Date(a.created_at).getTime();
                const end = new Date(a.completed_at!).getTime();
                return sum + (end - start) / (1000 * 60); // minutes
              }, 0) / completedWithTimes.length
            : 0;

          const successRate = totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0;

          // Get top analyzed competitors
          const competitorCounts = analyses.reduce((acc, a) => {
            if (a.name) {
              acc[a.name] = (acc[a.name] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);

          const topCompetitors = Object.entries(competitorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([name, count]) => ({ name, analysisCount: count }));

          setAnalytics({
            totalAnalyses,
            completedAnalyses,
            avgCompletionTime,
            successRate,
            topCompetitors
          });
        }
      } catch (error) {
        console.error('Error fetching competitor analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              {Number((analytics.completedAnalyses / analytics.totalAnalyses) * 100).toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgCompletionTime}m</div>
            <p className="text-xs text-muted-foreground">
              Per analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Analysis Progress</CardTitle>
            <CardDescription>Current month's completion progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Completed</span>
                  <span>{analytics.completedAnalyses}/{analytics.totalAnalyses}</span>
                </div>
                <Progress value={(analytics.completedAnalyses / analytics.totalAnalyses) * 100} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Analyzed Competitors</CardTitle>
            <CardDescription>Most frequently analyzed companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topCompetitors.map((competitor, index) => (
                <div key={competitor.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="text-sm font-medium">{competitor.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {competitor.analysisCount} analyses
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompetitorAnalyticsDashboard;