import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Database } from 'lucide-react';

interface DataQualityMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  issues: number;
}

const DataQualityDashboard: React.FC = () => {
  const metrics: DataQualityMetric[] = [
    { name: 'Completeness', score: 94, status: 'excellent', issues: 2 },
    { name: 'Accuracy', score: 87, status: 'good', issues: 5 },
    { name: 'Consistency', score: 76, status: 'fair', issues: 12 },
    { name: 'Timeliness', score: 91, status: 'excellent', issues: 3 },
    { name: 'Validity', score: 82, status: 'good', issues: 8 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'fair':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const overallScore = Math.round(metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Quality Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor and maintain the quality of your data assets
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallScore}%</div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.reduce((sum, metric) => sum + metric.issues, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Active data sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h</div>
            <p className="text-xs text-muted-foreground">
              ago
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Quality Metrics</CardTitle>
          <CardDescription>
            Detailed breakdown of data quality across different dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 min-w-[120px]">
                  {getStatusIcon(metric.status)}
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <div className="flex-1">
                  <Progress value={metric.score} className="h-2" />
                </div>
                <div className="flex items-center space-x-2 min-w-[100px]">
                  <span className="text-sm font-bold">{metric.score}%</span>
                  <Badge variant="outline" className="text-xs">
                    {metric.issues} issues
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
            <CardDescription>
              Latest data quality issues identified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Missing required fields</p>
                  <p className="text-xs text-muted-foreground">user_profiles table</p>
                </div>
                <Badge variant="destructive">Critical</Badge>
              </div>
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Inconsistent date formats</p>
                  <p className="text-xs text-muted-foreground">analytics data</p>
                </div>
                <Badge variant="secondary">Warning</Badge>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Duplicate records detected</p>
                  <p className="text-xs text-muted-foreground">customer database</p>
                </div>
                <Badge variant="outline">Info</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Trends</CardTitle>
            <CardDescription>
              Data quality performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">This Week</span>
                <div className="flex items-center space-x-2">
                  <Progress value={89} className="w-20" />
                  <span className="text-sm font-medium">89%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Week</span>
                <div className="flex items-center space-x-2">
                  <Progress value={85} className="w-20" />
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Month</span>
                <div className="flex items-center space-x-2">
                  <Progress value={82} className="w-20" />
                  <span className="text-sm font-medium">82%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataQualityDashboard;