/**
 * Business Tools Dashboard Component
 * Main dashboard for accessing and managing business tools
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BusinessToolsService, type BusinessTool } from '@/services/businessToolsService';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, BarChart3, Target, Rocket, FileText, Activity } from 'lucide-react';

export const BusinessToolsDashboard: React.FC = () => {
  const [tools, setTools] = useState<BusinessTool[]>([]);
  const [analytics, setAnalytics] = useState({
    totalUsage: 0,
    mostUsedTool: null as string | null,
    toolsUsedThisWeek: 0,
    usageGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [toolsData, analyticsData] = await Promise.all([
        BusinessToolsService.getUserToolsUsage(),
        BusinessToolsService.getToolsAnalytics()
      ]);

      const availableTools = BusinessToolsService.getAvailableTools();
      
      // Merge usage data with available tools
      const toolsWithUsage = availableTools.map(tool => {
        const usageData = toolsData.find(usage => usage.tool_name === tool.id);
        return {
          ...tool,
          usageCount: usageData?.usage_count || 0,
          lastUsedAt: usageData?.last_used_at || undefined
        };
      });

      setTools(toolsWithUsage);
      setAnalytics(analyticsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = async (tool: BusinessTool) => {
    try {
      await BusinessToolsService.trackToolUsage(tool.id);
      
      // Navigate to specific tool
      switch (tool.id) {
        case 'competitor-analysis':
          navigate('/competitor-analysis');
          break;
        case 'market-research':
          navigate('/market-research');
          break;
        case 'business-plan-generator':
          navigate('/business-plans');
          break;
        case 'mvp-builder':
          navigate('/mvp-builder');
          break;
        case 'analytics-dashboard':
          navigate('/analytics');
          break;
        default:
          toast({
            title: 'Coming Soon',
            description: `${tool.name} will be available soon!`,
          });
      }
    } catch (err) {
      console.error('Error tracking tool usage:', err);
    }
  };

  const getToolIcon = (tool: BusinessTool) => {
    switch (tool.id) {
      case 'competitor-analysis':
        return <Target className="w-6 h-6" />;
      case 'market-research':
        return <BarChart3 className="w-6 h-6" />;
      case 'business-plan-generator':
        return <FileText className="w-6 h-6" />;
      case 'mvp-builder':
        return <Rocket className="w-6 h-6" />;
      case 'analytics-dashboard':
        return <TrendingUp className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4"
            onClick={loadDashboardData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Tools</h1>
          <p className="text-muted-foreground">
            Accelerate your entrepreneurship with AI-powered business tools
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="tools" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card 
                key={tool.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => handleToolClick(tool)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {getToolIcon(tool)}
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </div>
                  <Badge variant={tool.isActive ? "default" : "secondary"}>
                    {tool.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {tool.description}
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Used {tool.usageCount} times</span>
                    {tool.lastUsedAt && (
                      <span>
                        Last used: {new Date(tool.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={Math.min((tool.usageCount / 10) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsage}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics.usageGrowth}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Used Tool</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.mostUsedTool || 'None'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Top performing tool
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Active</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.toolsUsedThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  Tools used this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{analytics.usageGrowth}%</div>
                <p className="text-xs text-muted-foreground">
                  Month over month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>
                Your business tools usage patterns and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tools.map((tool) => (
                  <div key={tool.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getToolIcon(tool)}
                      <span className="font-medium">{tool.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Progress 
                        value={Math.min((tool.usageCount / 10) * 100, 100)} 
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {tool.usageCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};