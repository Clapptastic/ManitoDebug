import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  DollarSign,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';

interface AIInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: any;
  action?: string;
}

interface AnalyticsData {
  userGrowth: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    prediction: number;
  };
  revenue: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    prediction: number;
  };
  engagement: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    sectors: { [key: string]: number };
  };
  conversion: {
    current: number;
    previous: number;
    funnel: { [key: string]: number };
    optimization: string[];
  };
  insights: AIInsight[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  anomalies: {
    detected: number;
    critical: number;
    details: string[];
  };
}

export const AIPoweredAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const generateAnalytics = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-powered-analytics', {
        body: {
          timeframe: '30d',
          includePredictions: true,
          includeAnomalyDetection: true
        }
      });

      if (error) throw error;

      setAnalyticsData(data.analytics);
      setLastUpdated(new Date());

      toast({
        title: 'Analytics Updated',
        description: 'AI insights and recommendations generated successfully',
      });
    } catch (error) {
      console.error('Error generating analytics:', error);
      toast({
        title: 'Analytics Failed',
        description: 'Failed to generate AI analytics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity': return <Target className="h-4 w-4" />;
      case 'risk': return <TrendingDown className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return 'text-blue-600';
      case 'anomaly': return 'text-yellow-600';
      case 'opportunity': return 'text-green-600';
      case 'risk': return 'text-red-600';
      case 'recommendation': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getImpactBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  useEffect(() => {
    // Initial load
    generateAnalytics();
    
    // Set up auto-refresh if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        generateAnalytics();
      }, 300000); // Refresh every 5 minutes
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]); // Only depend on autoRefresh to prevent infinite loops

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            AI-Powered Analytics
          </h1>
          {lastUpdated && (
            <p className="text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={generateAnalytics} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Analytics
          </Button>
        </div>
      </div>

      {loading && !analyticsData && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Generating AI Analytics</h3>
                <p className="text-muted-foreground">Processing data and generating insights...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analyticsData && (
        <div className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Growth</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {analyticsData.userGrowth.current.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      vs {analyticsData.userGrowth.previous.toLocaleString()} last period
                    </p>
                  </div>
                  {getTrendIcon(analyticsData.userGrowth.trend)}
                </div>
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">
                    Predicted: {analyticsData.userGrowth.prediction.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      ${analyticsData.revenue.current.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      vs ${analyticsData.revenue.previous.toLocaleString()} last period
                    </p>
                  </div>
                  {getTrendIcon(analyticsData.revenue.trend)}
                </div>
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">
                    Predicted: ${analyticsData.revenue.prediction.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {analyticsData.engagement.current}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      vs {analyticsData.engagement.previous}% last period
                    </p>
                  </div>
                  {getTrendIcon(analyticsData.engagement.trend)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {analyticsData.conversion.current}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      vs {analyticsData.conversion.previous}% last period
                    </p>
                  </div>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights & Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analyticsData.insights.map((insight, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={getInsightColor(insight.type)}>
                          {getInsightIcon(insight.type)}
                        </span>
                        <h4 className="font-semibold">{insight.title}</h4>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getImpactBadgeVariant(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="outline">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.action && (
                      <div className="bg-muted p-2 rounded text-sm">
                        <strong>Recommended Action:</strong> {insight.action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Conversion Funnel Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData.conversion.funnel).map(([stage, rate], idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{stage}</span>
                      <span className="text-sm text-muted-foreground">{rate}%</span>
                    </div>
                    <Progress value={rate} className="h-2" />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2">Optimization Opportunities</h4>
                <ul className="space-y-1">
                  {analyticsData.conversion.optimization.map((opp, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                  Immediate Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analyticsData.recommendations.immediate.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-orange-600">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Short-term Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analyticsData.recommendations.shortTerm.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Long-term Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analyticsData.recommendations.longTerm.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Anomaly Detection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analyticsData.anomalies.detected}</div>
                  <div className="text-sm text-muted-foreground">Anomalies Detected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{analyticsData.anomalies.critical}</div>
                  <div className="text-sm text-muted-foreground">Critical Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.anomalies.detected - analyticsData.anomalies.critical}
                  </div>
                  <div className="text-sm text-muted-foreground">Minor Issues</div>
                </div>
              </div>
              <div className="space-y-2">
                {analyticsData.anomalies.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">{detail}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};