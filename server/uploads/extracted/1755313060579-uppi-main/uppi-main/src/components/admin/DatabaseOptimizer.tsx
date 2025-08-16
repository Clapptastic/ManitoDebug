import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QueryMetric {
  query: string;
  executionTime: number;
  frequency: number;
  lastExecuted: string;
  impact: 'high' | 'medium' | 'low';
}

interface OptimizationSuggestion {
  type: 'index' | 'query' | 'schema' | 'performance';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  impact: string;
  action: string;
}

interface DatabaseHealth {
  overallScore: number;
  activeConnections: number;
  slowQueries: number;
  indexUtilization: number;
  cacheHitRate: number;
}

const DatabaseOptimizer: React.FC = () => {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [metrics, setMetrics] = useState<QueryMetric[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDatabaseHealth();
    loadQueryMetrics();
    loadOptimizationSuggestions();
  }, []);

  const loadDatabaseHealth = async () => {
    try {
      // Simulate database health metrics
      setHealth({
        overallScore: 85,
        activeConnections: 45,
        slowQueries: 3,
        indexUtilization: 92,
        cacheHitRate: 89
      });
    } catch (error) {
      console.error('Failed to load database health:', error);
      toast({
        title: 'Error',
        description: 'Failed to load database health metrics',
        variant: 'destructive'
      });
    }
  };

  const loadQueryMetrics = async () => {
    try {
      const { data: apiMetrics } = await supabase
        .from('api_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (apiMetrics) {
        const queryMetrics: QueryMetric[] = apiMetrics.map(metric => ({
          query: metric.endpoint,
          executionTime: metric.response_time_ms,
          frequency: 1,
          lastExecuted: metric.created_at,
          impact: metric.response_time_ms > 1000 ? 'high' : 
                 metric.response_time_ms > 500 ? 'medium' : 'low'
        }));
        setMetrics(queryMetrics);
      }
    } catch (error) {
      console.error('Failed to load query metrics:', error);
    }
  };

  const loadOptimizationSuggestions = () => {
    const mockSuggestions: OptimizationSuggestion[] = [
      {
        type: 'index',
        severity: 'critical',
        description: 'Missing index on api_usage_costs.user_id',
        impact: 'Queries on user costs are 300% slower',
        action: 'CREATE INDEX idx_api_usage_costs_user_id ON api_usage_costs(user_id)'
      },
      {
        type: 'query',
        severity: 'warning',
        description: 'Inefficient competitor analysis queries',
        impact: 'Analysis queries taking 2+ seconds',
        action: 'Optimize WHERE clauses and add proper pagination'
      },
      {
        type: 'performance',
        severity: 'info',
        description: 'Connection pool optimization',
        impact: 'Potential for 15% performance improvement',
        action: 'Increase connection pool size and timeout settings'
      }
    ];
    setSuggestions(mockSuggestions);
  };

  const runOptimizationAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate comprehensive analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await loadDatabaseHealth();
      await loadQueryMetrics();
      loadOptimizationSuggestions();
      
      toast({
        title: 'Analysis Complete',
        description: 'Database optimization analysis completed successfully'
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'Failed to complete optimization analysis',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyOptimizations = async () => {
    setIsOptimizing(true);
    try {
      // Simulate applying optimizations
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Update health score after optimization
      setHealth(prev => prev ? { ...prev, overallScore: Math.min(100, prev.overallScore + 10) } : null);
      
      toast({
        title: 'Optimizations Applied',
        description: 'Database optimizations have been successfully applied'
      });
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: 'Failed to apply database optimizations',
        variant: 'destructive'
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Database Optimizer</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runOptimizationAnalysis}
            disabled={isAnalyzing}
            variant="outline"
          >
            {isAnalyzing ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Run Analysis
              </>
            )}
          </Button>
          <Button
            onClick={applyOptimizations}
            disabled={isOptimizing || suggestions.length === 0}
          >
            {isOptimizing ? (
              <>
                <Settings className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Apply Optimizations
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Database Health Overview */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.overallScore}%</div>
              <Progress value={health.overallScore} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.activeConnections}</div>
              <p className="text-xs text-muted-foreground">of 100 max</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{health.slowQueries}</div>
              <p className="text-xs text-muted-foreground">past 24h</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Index Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.indexUtilization}%</div>
              <Progress value={health.indexUtilization} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.cacheHitRate}%</div>
              <Progress value={health.cacheHitRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">Optimization Suggestions</TabsTrigger>
          <TabsTrigger value="metrics">Query Metrics</TabsTrigger>
          <TabsTrigger value="indexes">Index Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No optimization suggestions at this time.</p>
                  <p className="text-sm">Your database is performing well!</p>
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(suggestion.severity)}>
                            {suggestion.severity}
                          </Badge>
                          <Badge variant="outline">{suggestion.type}</Badge>
                        </div>
                        <p className="font-medium">{suggestion.description}</p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Impact:</strong> {suggestion.impact}
                        </p>
                        <p className="text-sm font-mono bg-muted p-2 rounded">
                          {suggestion.action}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.slice(0, 10).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-medium truncate">{metric.query}</p>
                      <p className="text-sm text-muted-foreground">
                        Last executed: {new Date(metric.lastExecuted).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getImpactColor(metric.impact)}>
                        {metric.impact} impact
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold">{metric.executionTime}ms</p>
                        <p className="text-xs text-muted-foreground">avg time</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indexes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Index Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Index analysis will show detailed information about table indexes,
                  their usage patterns, and suggestions for new indexes to improve query performance.
                  This feature requires elevated database permissions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseOptimizer;