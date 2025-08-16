import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Search, BarChart3, Users, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalsStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export const GoalsStep: React.FC<GoalsStepProps> = ({ 
  data, 
  onUpdate 
}) => {
  const goals = [
    {
      id: 'competitor-analysis',
      title: 'Competitor Analysis',
      description: 'Understand my competitive landscape and positioning',
      icon: TrendingUp,
      color: 'text-blue-500'
    },
    {
      id: 'market-research',
      title: 'Market Research',
      description: 'Analyze market trends and opportunities',
      icon: Search,
      color: 'text-green-500'
    },
    {
      id: 'business-analytics',
      title: 'Business Analytics',
      description: 'Track performance metrics and KPIs',
      icon: BarChart3,
      color: 'text-purple-500'
    },
    {
      id: 'customer-insights',
      title: 'Customer Insights',
      description: 'Better understand my target audience',
      icon: Users,
      color: 'text-orange-500'
    },
    {
      id: 'pricing-strategy',
      title: 'Pricing Strategy',
      description: 'Optimize pricing based on market data',
      icon: DollarSign,
      color: 'text-emerald-500'
    },
    {
      id: 'trend-monitoring',
      title: 'Trend Monitoring',
      description: 'Stay updated on industry trends and changes',
      icon: Target,
      color: 'text-red-500'
    }
  ];

  const selectedGoals = data.primaryGoals || [];

  const toggleGoal = (goalId: string) => {
    const updatedGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter((id: string) => id !== goalId)
      : [...selectedGoals, goalId];
    
    onUpdate({ primaryGoals: updatedGoals });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">What are your main goals?</h2>
        <p className="text-muted-foreground">
          Select the areas where you'd like Uppi.ai to help you most. You can always change these later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          
          return (
            <Card 
              key={goal.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border hover:border-primary/30"
              )}
              onClick={() => toggleGoal(goal.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      isSelected ? "bg-primary/10" : "bg-muted"
                    )}>
                      <goal.icon className={cn("w-5 h-5", goal.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium">
                        {goal.title}
                      </CardTitle>
                    </div>
                  </div>
                  <Checkbox 
                    checked={isSelected}
                    onChange={() => toggleGoal(goal.id)}
                    className="mt-1"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {goal.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedGoals.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Your Selected Goals ({selectedGoals.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedGoals.map((goalId: string) => {
                  const goal = goals.find(g => g.id === goalId);
                  return goal ? (
                    <Badge 
                      key={goalId} 
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      {goal.title}
                    </Badge>
                  ) : null;
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                We'll prioritize these features in your dashboard and provide relevant insights.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};