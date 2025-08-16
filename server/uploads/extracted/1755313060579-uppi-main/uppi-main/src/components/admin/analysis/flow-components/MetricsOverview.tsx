import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Zap,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';
import type { FlowStep, ProviderTest } from '../ModernFlowMonitor';

interface MetricsOverviewProps {
  flowSteps: FlowStep[];
  providerTests: ProviderTest[];
  testResults: any;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  flowSteps,
  providerTests,
  testResults
}) => {
  // Flow metrics
  const totalSteps = flowSteps.length;
  const completedSteps = flowSteps.filter(s => s.status === 'success').length;
  const failedSteps = flowSteps.filter(s => s.status === 'error').length;
  const runningSteps = flowSteps.filter(s => s.status === 'running').length;
  const successRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Provider metrics
  const totalProviders = providerTests.length;
  const activeProviders = providerTests.filter(p => p.status === 'success').length;
  const totalCost = providerTests.reduce((sum, p) => sum + (p.cost || 0), 0);
  const totalTokens = providerTests.reduce((sum, p) => sum + (p.tokens || 0), 0);
  const avgCostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;

  // Performance metrics
  const avgStepDuration = flowSteps
    .filter(s => s.duration)
    .reduce((sum, s) => sum + (s.duration || 0), 0) / 
    Math.max(flowSteps.filter(s => s.duration).length, 1);

  const metrics = [
    {
      title: 'Pipeline Success Rate',
      value: `${successRate.toFixed(1)}%`,
      subtitle: `${completedSteps}/${totalSteps} steps completed`,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'success',
      progress: successRate
    },
    {
      title: 'Active Providers',
      value: `${activeProviders}/${totalProviders}`,
      subtitle: 'AI providers responding',
      icon: <Zap className="h-5 w-5" />,
      color: 'primary',
      progress: totalProviders > 0 ? (activeProviders / totalProviders) * 100 : 0
    },
    {
      title: 'Total Cost',
      value: `$${totalCost.toFixed(4)}`,
      subtitle: `${totalTokens.toLocaleString()} tokens used`,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'secondary',
      detail: totalTokens > 0 ? `$${(avgCostPerToken * 1000).toFixed(4)}/1K tokens` : 'No usage'
    },
    {
      title: 'Avg Step Duration',
      value: `${avgStepDuration.toFixed(0)}ms`,
      subtitle: 'Processing time per step',
      icon: <Clock className="h-5 w-5" />,
      color: 'info',
      detail: flowSteps.filter(s => s.duration).length > 0 ? 'Performance metric' : 'No data'
    }
  ];

  const getColorClass = (color: string) => {
    switch (color) {
      case 'success': return 'from-success/10 to-success/5 border-success/20 text-success';
      case 'primary': return 'from-primary/10 to-primary/5 border-primary/20 text-primary';
      case 'secondary': return 'from-secondary/10 to-secondary/5 border-secondary/20 text-secondary-foreground';
      case 'info': return 'from-info/10 to-info/5 border-info/20 text-info';
      default: return 'from-muted/10 to-muted/5 border-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className={`bg-gradient-to-br ${getColorClass(metric.color)}`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-white/20 ${metric.color === 'secondary' ? 'text-secondary-foreground' : ''}`}>
                    {metric.icon}
                  </div>
                  {metric.progress !== undefined && (
                    <div className="text-right">
                      <div className="text-xs opacity-75">{metric.progress.toFixed(0)}%</div>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm opacity-75">{metric.subtitle}</p>
                  {metric.detail && (
                    <p className="text-xs opacity-60 mt-1">{metric.detail}</p>
                  )}
                </div>
                
                {metric.progress !== undefined && (
                  <Progress 
                    value={metric.progress} 
                    className="h-1 bg-white/20" 
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Flow Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed Steps</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{completedSteps}</span>
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
              </div>
              <Progress value={totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Running Steps</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{runningSteps}</span>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
              </div>
              <Progress value={totalSteps > 0 ? (runningSteps / totalSteps) * 100 : 0} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed Steps</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{failedSteps}</span>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
              </div>
              <Progress value={totalSteps > 0 ? (failedSteps / totalSteps) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Provider Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Provider Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {providerTests.map((provider, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{provider.name}</span>
                  <div className="flex items-center gap-2">
                    {provider.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                    {provider.status === 'error' && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    {provider.status === 'running' && (
                      <Activity className="h-4 w-4 text-primary animate-pulse" />
                    )}
                  </div>
                </div>
                
                {provider.status === 'success' && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Tokens:</span>
                      <span>{provider.tokens?.toLocaleString() || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span>${provider.cost?.toFixed(4) || '—'}</span>
                    </div>
                  </div>
                )}
                
                {provider.status === 'error' && provider.error && (
                  <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    {provider.error}
                  </p>
                )}
                
                {index < providerTests.length - 1 && (
                  <div className="border-t border-border/50 pt-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Test Results Summary */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Last Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Competitor</p>
                <p className="font-medium">{testResults.competitor}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Completed At</p>
                <p className="font-medium">
                  {new Date(testResults.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className={`font-medium ${testResults.success ? 'text-success' : 'text-destructive'}`}>
                  {testResults.success ? 'Success' : 'Failed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};