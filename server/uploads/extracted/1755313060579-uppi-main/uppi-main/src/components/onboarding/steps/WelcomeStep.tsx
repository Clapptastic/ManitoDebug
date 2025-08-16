import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Zap, Target } from 'lucide-react';

interface WelcomeStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Competitor Analysis',
      description: 'AI-powered insights into your competitive landscape'
    },
    {
      icon: Target,
      title: 'Market Research',
      description: 'Deep market analysis and trend identification'
    },
    {
      icon: Zap,
      title: 'Automated Insights',
      description: 'Real-time business intelligence and recommendations'
    }
  ];

  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-foreground">
          Welcome to Uppi.ai
        </h2>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered platform for entrepreneurship. Let's get you set up with 
          the tools you need to analyze markets, understand competitors, and grow your business.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {features.map((feature, index) => (
          <Card key={index} className="border-2 hover:border-primary/20 transition-colors">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This setup will take about 3-5 minutes and will help us personalize your experience.
        </p>
        
        <Button 
          onClick={onNext}
          size="lg"
          className="px-8"
        >
          Let's Get Started
        </Button>
      </div>
    </div>
  );
};