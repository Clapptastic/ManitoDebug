/**
 * Usage Metrics Component
 * Display current usage against plan limits with visual indicators
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  MessageSquare, 
  Search, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import type { UserSubscription, UsageLimitCheck } from '@/types/billing';

interface UsageMetricsProps {
  userId: string;
  currentSubscription: UserSubscription | null;
  usageLimits: UsageLimitCheck[];
}

export const UsageMetrics: React.FC<UsageMetricsProps> = ({
  userId,
  currentSubscription,
  usageLimits
}) => {
  const getUsageIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'competitors_per_month':
        return <Users className="w-5 h-5" />;
      case 'market_research_reports':
        return <Search className="w-5 h-5" />;
      case 'chat_messages':
        return <MessageSquare className="w-5 h-5" />;
      case 'api_requests':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getUsageTitle = (resourceType: string) => {
    switch (resourceType) {
      case 'competitors_per_month':
        return 'Competitor Analyses';
      case 'market_research_reports':
        return 'Market Research Reports';
      case 'chat_messages':
        return 'AI Chat Messages';
      case 'api_requests':
        return 'API Requests';
      default:
        return resourceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getUsageStatus = (limit: UsageLimitCheck) => {
    if (limit.limit_exceeded) {
      return {
        variant: 'destructive' as const,
        icon: <AlertTriangle className="w-4 h-4" />,
        text: 'Limit Exceeded'
      };
    } else if (limit.usage_percentage >= 80) {
      return {
        variant: 'secondary' as const,
        icon: <AlertTriangle className="w-4 h-4" />,
        text: 'High Usage'
      };
    } else {
      return {
        variant: 'outline' as const,
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Normal'
      };
    }
  };

  const formatUsage = (usage: number, limit: number) => {
    const limitText = limit === Infinity ? 'Unlimited' : limit.toLocaleString();
    return `${usage.toLocaleString()} / ${limitText}`;
  };

  const getProgressColor = (percentage: number, exceeded: boolean) => {
    if (exceeded) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  if (!currentSubscription) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Subscribe to a plan to track your usage and access premium features.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{currentSubscription.plan?.name} Plan</span>
            <Badge variant="outline">
              Active until {new Date(currentSubscription.current_period_end).toLocaleDateString()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Monitor your usage against plan limits to avoid service interruptions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Usage Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {usageLimits.map((limit) => {
          const status = getUsageStatus(limit);
          const progressValue = Math.min(limit.usage_percentage, 100);
          
          return (
            <Card key={limit.resource_type} className={`${
              limit.limit_exceeded ? 'border-red-500 bg-red-50/50' : 
              limit.usage_percentage >= 80 ? 'border-orange-500 bg-orange-50/50' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getUsageIcon(limit.resource_type)}
                    <CardTitle className="text-lg">
                      {getUsageTitle(limit.resource_type)}
                    </CardTitle>
                  </div>
                  <Badge variant={status.variant} className="flex items-center space-x-1">
                    {status.icon}
                    <span>{status.text}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-medium">
                    {formatUsage(limit.current_usage, limit.limit)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={progressValue} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span className="font-medium">
                      {limit.usage_percentage.toFixed(1)}% used
                    </span>
                    <span>
                      {limit.limit === Infinity ? '∞' : limit.limit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Usage Tips */}
                {limit.limit_exceeded && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      You've exceeded your limit. Upgrade your plan to continue using this feature.
                    </AlertDescription>
                  </Alert>
                )}
                
                {limit.usage_percentage >= 80 && !limit.limit_exceeded && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      You're approaching your limit. Consider upgrading soon.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Alert */}
      {usageLimits.some(limit => limit.limit_exceeded) && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Action Required:</strong> You've exceeded limits on one or more features. 
            Upgrade your plan to restore full functionality.
          </AlertDescription>
        </Alert>
      )}
      
      {usageLimits.some(limit => limit.usage_percentage >= 80 && !limit.limit_exceeded) && 
       !usageLimits.some(limit => limit.limit_exceeded) && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>High Usage Detected:</strong> You're approaching limits on some features. 
            Consider upgrading to avoid service interruptions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};