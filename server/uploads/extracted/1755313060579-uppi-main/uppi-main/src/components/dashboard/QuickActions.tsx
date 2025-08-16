import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  FileText, 
  Settings, 
  MessageSquare,
  Upload,
  BarChart3
} from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Competitor Analysis',
      description: 'Analyze your competitors with AI',
      icon: TrendingUp,
      onClick: () => navigate('/market-research/competitor-analysis'),
      variant: 'default' as const
    },
    {
      title: 'Market Research',
      description: 'Research market trends and opportunities',
      icon: BarChart3,
      onClick: () => navigate('/market-research'),
      variant: 'secondary' as const
    },
    {
      title: 'Business Tools',
      description: 'Access business planning tools',
      icon: Settings,
      onClick: () => navigate('/business-tools'),
      variant: 'outline' as const
    },
    {
      title: 'MVP Builder',
      description: 'Build your minimum viable product',
      icon: Upload,
      onClick: () => navigate('/mvp-builder'),
      variant: 'outline' as const
    },
    {
      title: 'AI Chat',
      description: 'Get business guidance from AI',
      icon: MessageSquare,
      onClick: () => navigate('/chat'),
      variant: 'outline' as const
    },
    {
      title: 'Analytics Dashboard',
      description: 'View advanced analytics and insights',
      icon: BarChart3,
      onClick: () => navigate('/analytics'),
      variant: 'outline' as const
    },
    {
      title: 'Document Storage',
      description: 'Manage your business documents',
      icon: FileText,
      onClick: () => navigate('/documents'),
      variant: 'outline' as const
    },
    {
      title: 'Business Plan',
      description: 'Create comprehensive business plans',
      icon: FileText,
      onClick: () => navigate('/business-plan'),
      variant: 'outline' as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Get started with your entrepreneurship journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-start text-left"
                onClick={action.onClick}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="font-medium text-sm">{action.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};