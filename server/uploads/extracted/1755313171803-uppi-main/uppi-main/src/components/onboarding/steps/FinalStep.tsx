import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Sparkles, ArrowRight, TrendingUp, BarChart3, Key } from 'lucide-react';

interface FinalStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export const FinalStep: React.FC<FinalStepProps> = ({ 
  data, 
  onNext 
}) => {
  const nextSteps = [
    {
      title: 'Explore Your Dashboard',
      description: 'Get familiar with your personalized dashboard and key metrics',
      icon: BarChart3,
      action: 'Go to Dashboard',
      route: '/dashboard'
    },
    {
      title: 'Run Your First Analysis',
      description: 'Start with a competitor analysis to understand your market position',
      icon: TrendingUp,
      action: 'Start Analysis',
      route: '/competitor-analysis'
    },
    {
      title: 'Complete API Setup',
      description: data.apiKeysSetup ? 'Finish configuring your API keys' : 'Set up your API keys to unlock all features',
      icon: Key,
      action: 'Manage API Keys',
      route: '/api-keys'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground">
          You're All Set! 🎉
        </h2>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Welcome to Uppi.ai, {data.fullName || 'there'}! Your account has been configured 
          and you're ready to start growing your business with AI-powered insights.
        </p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Your Setup Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Profile</h4>
              <p className="text-sm text-muted-foreground">{data.fullName}</p>
              <p className="text-sm text-muted-foreground">{data.jobTitle}</p>
              <p className="text-sm text-muted-foreground">
                {data.companySize && `Company Size: ${data.companySize}`}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Primary Goals ({data.primaryGoals?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1">
                {data.primaryGoals?.slice(0, 3).map((goal: string) => (
                  <Badge key={goal} variant="secondary" className="text-xs">
                    {goal.replace('-', ' ')}
                  </Badge>
                ))}
                {data.primaryGoals?.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{data.primaryGoals.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-muted-foreground">
              API Keys: {data.apiKeysSetup ? 'Setup initiated' : 'Not configured'}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Recommended Next Steps
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {nextSteps.map((step, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="text-center pt-6">
        <Button 
          onClick={onNext}
          size="lg"
          className="px-8"
        >
          Enter Uppi.ai Dashboard
        </Button>
        
        <p className="text-sm text-muted-foreground mt-4">
          You can always access these settings later from your profile menu.
        </p>
      </div>
    </div>
  );
};