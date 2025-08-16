
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MvpBuilder } from '@/components/business-tools/MvpBuilder';
import { BusinessPlanGenerator } from '@/components/business-tools/BusinessPlanGenerator';
import { MarketResearchAutomation } from '@/components/business-tools/MarketResearchAutomation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  Lightbulb, 
  Rocket, 
  BarChart3, 
  Search, 
  FileText, 
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface BusinessToolUsage {
  tool_name: string;
  usage_count: number;
  last_used_at: string;
}

interface RecentActivity {
  id: string;
  tool: string;
  action: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'pending';
}

const BusinessToolsPage: React.FC = () => {
  const [toolsUsage, setToolsUsage] = useState<BusinessToolUsage[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const businessTools = [
    {
      id: 'ai-advisor',
      title: 'AI Startup Advisor',
      description: 'Get personalized AI guidance for your startup journey',
      icon: Lightbulb,
      path: '/chat',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      category: 'AI Tools'
    },
    {
      id: 'business-plan',
      title: 'Business Plan Generator',
      description: 'Create comprehensive business plans with AI assistance',
      icon: FileText,
      path: '/business-plan',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      category: 'Planning'
    },
    {
      id: 'mvp-builder',
      title: 'MVP Builder',
      description: 'Plan and build your minimum viable product',
      icon: Rocket,
      path: '/mvp-builder',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      category: 'Development'
    },
    {
      id: 'market-research',
      title: 'Market Research',
      description: 'Automated market analysis and competitor research',
      icon: Search,
      path: '/market-research',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      category: 'Research'
    },
    {
      id: 'analytics',
      title: 'AI Analytics',
      description: 'Advanced analytics with AI-powered insights',
      icon: BarChart3,
      path: '/analytics',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      category: 'Analytics'
    },
    {
      id: 'competitor-analysis',
      title: 'Competitor Analysis',
      description: 'Deep dive analysis of your competition',
      icon: TrendingUp,
      path: '/market-research/competitor-analysis',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      category: 'Research'
    }
  ];

  useEffect(() => {
    fetchToolsUsage();
    fetchRecentActivity();
  }, []);

  const fetchToolsUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('business_tools_usage')
        .select('*')
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      setToolsUsage(data || []);
    } catch (error) {
      console.error('Error fetching tools usage:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Simulate recent activity - in a real app, this would come from various tables
      const activities: RecentActivity[] = [
        {
          id: '1',
          tool: 'Business Plan Generator',
          action: 'Generated business plan for TechStartup Inc.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          id: '2',
          tool: 'Market Research',
          action: 'Analyzed SaaS market in North America',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          id: '3',
          tool: 'MVP Builder',
          action: 'Created new MVP project plan',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'in_progress'
        },
        {
          id: '4',
          tool: 'AI Analytics',
          action: 'Generated performance insights',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        }
      ];
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackToolUsage = async (toolName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('business_tools_usage')
        .upsert({
          user_id: user.id,
          tool_name: toolName,
          usage_count: 1,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tool_name',
          ignoreDuplicates: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking tool usage:', error);
    }
  };

  const getToolUsage = (toolId: string) => {
    return toolsUsage.find(usage => usage.tool_name === toolId)?.usage_count || 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Business Tools</h1>
        <p className="text-muted-foreground">
          Accelerate your startup journey with AI-powered business tools
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="mvp-builder">MVP Builder</TabsTrigger>
          <TabsTrigger value="business-plan">Business Plan</TabsTrigger>
          <TabsTrigger value="market-research">Market Research</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8">

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tools Used</p>
                <p className="text-2xl font-bold">{toolsUsage.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold">
                  {toolsUsage.reduce((sum, tool) => sum + tool.usage_count, 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Activity</p>
                <p className="text-2xl font-bold">{recentActivity.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Tools</p>
                <p className="text-2xl font-bold">{businessTools.length}</p>
              </div>
              <Rocket className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Business Tools Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold">Available Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {businessTools.map((tool) => {
              const IconComponent = tool.icon;
              const usage = getToolUsage(tool.id);
              
              return (
                <Card key={tool.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                        <IconComponent className={`h-6 w-6 ${tool.color}`} />
                      </div>
                      <Badge variant="secondary">{tool.category}</Badge>
                    </div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                    
                    {usage > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Usage</span>
                          <span className="font-medium">{usage} times</span>
                        </div>
                        <Progress value={Math.min((usage / 10) * 100, 100)} className="h-2" />
                      </div>
                    )}
                    
                    <Link to={tool.path}>
                      <Button 
                        className="w-full"
                        onClick={() => trackToolUsage(tool.id)}
                      >
                        Launch Tool
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.tool}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/business-plan">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Business Plan
                </Button>
              </Link>
              <Link to="/market-research">
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Start Market Research
                </Button>
              </Link>
              <Link to="/mvp-builder">
                <Button variant="outline" className="w-full justify-start">
                  <Rocket className="h-4 w-4 mr-2" />
                  Build MVP
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="mvp-builder">
          <MvpBuilder />
        </TabsContent>

        <TabsContent value="business-plan">
          <BusinessPlanGenerator />
        </TabsContent>

        <TabsContent value="market-research">
          <MarketResearchAutomation />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>AI Analytics & Insights</CardTitle>
              <CardDescription>
                Coming soon - Advanced analytics with AI-powered business insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This section will include performance tracking, predictive analytics, 
                and AI-generated business recommendations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessToolsPage;
