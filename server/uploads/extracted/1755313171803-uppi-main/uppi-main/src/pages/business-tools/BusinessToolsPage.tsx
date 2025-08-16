import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  FileText, 
  Users, 
  BarChart3, 
  Target,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { useBusinessToolsUsage } from '@/hooks/useBusinessToolsUsage';

const businessTools = [
  {
    id: 'financial-calculator',
    name: 'Financial Calculator',
    description: 'Calculate startup costs, runway, and financial projections',
    icon: Calculator,
    category: 'Finance',
    status: 'active'
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    description: 'Analyze market size, trends, and opportunities',
    icon: TrendingUp,
    category: 'Research',
    status: 'active'
  },
  {
    id: 'business-plan-generator',
    name: 'Business Plan Generator',
    description: 'Generate comprehensive business plans with AI assistance',
    icon: FileText,
    category: 'Planning',
    status: 'active'
  },
  {
    id: 'team-builder',
    name: 'Team Builder',
    description: 'Find and organize your ideal team structure',
    icon: Users,
    category: 'Team',
    status: 'active'
  },
  {
    id: 'metrics-dashboard',
    name: 'Metrics Dashboard',
    description: 'Track key business metrics and KPIs',
    icon: BarChart3,
    category: 'Analytics',
    status: 'active'
  },
  {
    id: 'goal-tracker',
    name: 'Goal Tracker',
    description: 'Set and track business goals and milestones',
    icon: Target,
    category: 'Planning',
    status: 'active'
  }
];

export const BusinessToolsPage: React.FC = () => {
  const { trackToolUsage, getToolUsage, loading } = useBusinessToolsUsage();

  const handleToolClick = async (toolId: string) => {
    await trackToolUsage(toolId);
    // Navigate to specific tool or open modal
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Finance: 'bg-green-500/10 text-green-700 dark:text-green-300',
      Research: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      Planning: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
      Team: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
      Analytics: 'bg-red-500/10 text-red-700 dark:text-red-300'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Business Tools</h1>
        <p className="text-muted-foreground">
          Comprehensive tools to help you build, analyze, and grow your business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessTools.map((tool) => {
          const Icon = tool.icon;
          const usage = getToolUsage(tool.id);
          
          return (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <Badge variant="secondary" className={getCategoryColor(tool.category)}>
                        {tool.category}
                      </Badge>
                    </div>
                  </div>
                  {tool.status === 'active' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {tool.description}
                </CardDescription>
                
                {usage && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    Used {usage.usage_count} times
                    {usage.last_used_at && (
                      <span className="block">
                        Last used: {new Date(usage.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                <Button 
                  onClick={() => handleToolClick(tool.id)}
                  disabled={loading || tool.status !== 'active'}
                  className="w-full"
                >
                  {loading ? 'Loading...' : 'Open Tool'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Suggested Next Steps</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                Start with Market Analysis
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Understand your market size and competition before building your product
              </p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                Create Financial Projections
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Calculate your startup costs and runway to ensure financial viability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};