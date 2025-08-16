import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  DollarSign, 
  Monitor, 
  Shield, 
  Zap,
  RefreshCw,
  Settings
} from 'lucide-react';
import { systemOptimizationService, type SystemAuditReport, type PerformanceMetric } from '@/services/systemOptimizationService';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SystemOptimizationPage() {
  const [auditReport, setAuditReport] = useState<SystemAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    performAudit();
  }, []);

  const performAudit = async () => {
    setLoading(true);
    try {
      const report = await systemOptimizationService.performSystemAudit();
      setAuditReport(report);
      toast({
        title: 'System Audit Complete',
        description: `Overall score: ${report.overallScore}/100`
      });
    } catch (error) {
      console.error('Audit failed:', error);
      toast({
        title: 'Audit Failed',
        description: 'Failed to complete system audit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyOptimizations = async () => {
    setOptimizing(true);
    try {
      const { applied, failed } = await systemOptimizationService.applyOptimizations();
      
      toast({
        title: 'Optimizations Applied',
        description: `Applied ${applied.length} optimizations. ${failed.length} failed.`
      });

      // Refresh audit after optimizations
      setTimeout(performAudit, 2000);
    } catch (error) {
      console.error('Optimization failed:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Failed to apply optimizations',
        variant: 'destructive'
      });
    } finally {
      setOptimizing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'good': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const renderMetricCard = (metric: PerformanceMetric) => (
    <Card key={metric.id} className="relative">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(metric.status)}
            <div>
              <p className="font-medium text-sm">{metric.name}</p>
              <p className="text-xs text-muted-foreground">
                {metric.value} {metric.unit}
              </p>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(metric.status)}>
            {metric.status}
          </Badge>
        </div>
        {metric.recommendation && (
          <p className="text-xs text-muted-foreground mt-2">
            {metric.recommendation}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Optimization</h1>
          <p className="text-muted-foreground">
            Monitor performance, security, and cost optimization
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={performAudit}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {loading ? 'Auditing...' : 'Run Audit'}
          </Button>
          
          <Button
            onClick={applyOptimizations}
            disabled={optimizing || !auditReport}
            className="gap-2"
          >
            <Settings className={cn("h-4 w-4", optimizing && "animate-spin")} />
            {optimizing ? 'Optimizing...' : 'Apply Optimizations'}
          </Button>
        </div>
      </div>

      {auditReport && (
        <>
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Score
              </CardTitle>
              <CardDescription>
                Last audit: {new Date(auditReport.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{auditReport.overallScore}/100</span>
                  <Badge 
                    variant={
                      auditReport.overallScore >= 80 ? 'default' :
                      auditReport.overallScore >= 60 ? 'secondary' : 'destructive'
                    }
                  >
                    {auditReport.overallScore >= 80 ? 'Excellent' :
                     auditReport.overallScore >= 60 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
                <Progress value={auditReport.overallScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues Alert */}
          {auditReport.criticalIssues.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical Issues Found:</strong>
                <ul className="mt-2 space-y-1">
                  {auditReport.criticalIssues.map((issue, index) => (
                    <li key={index} className="text-sm">• {issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Metrics by Category */}
          <Tabs defaultValue="database" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="database" className="gap-2">
                <Database className="h-4 w-4" />
                Database
              </TabsTrigger>
              <TabsTrigger value="frontend" className="gap-2">
                <Monitor className="h-4 w-4" />
                Frontend
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="costs" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Costs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="database" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {auditReport.categories.database.map(renderMetricCard)}
              </div>
            </TabsContent>

            <TabsContent value="frontend" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {auditReport.categories.frontend.map(renderMetricCard)}
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {auditReport.categories.security.map(renderMetricCard)}
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {auditReport.categories.costs.map(renderMetricCard)}
              </div>
            </TabsContent>
          </Tabs>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription>
                Suggested improvements to enhance system performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!auditReport && !loading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Audit Data</h3>
              <p className="text-muted-foreground mb-4">
                Run a system audit to analyze performance and identify optimization opportunities
              </p>
              <Button onClick={performAudit} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Run First Audit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}