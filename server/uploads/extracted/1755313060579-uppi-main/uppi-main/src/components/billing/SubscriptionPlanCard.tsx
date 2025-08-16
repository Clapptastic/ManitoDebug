/**
 * Subscription Plan Card Component
 * Displays pricing plans with features and CTA buttons
 */

import React from 'react';
import { Check, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SubscriptionPlan, UserSubscription } from '@/types/billing';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  currentSubscription?: UserSubscription | null;
  billingCycle: 'monthly' | 'yearly';
  isPopular?: boolean;
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  currentSubscription,
  billingCycle,
  isPopular = false,
  onSelectPlan,
  loading = false
}) => {
  const isCurrentPlan = currentSubscription?.plan_id === plan.id;
  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const monthlyPrice = billingCycle === 'yearly' ? (plan.price_yearly || 0) / 12 : price;
  
  // Calculate yearly savings
  const yearlyDiscount = plan.price_monthly && plan.price_yearly 
    ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
    : 0;

  const formatPrice = (amount: number | null) => {
    if (amount === null || amount === 0) return 'Free';
    return `$${(amount / 100).toFixed(2)}`;
  };

  const renderFeatureLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    if (limit === 0) return 'Not included';
    return limit.toLocaleString();
  };

  return (
    <Card className={`relative transition-all duration-200 ${
      isPopular 
        ? 'border-primary shadow-lg scale-105 bg-gradient-to-br from-primary/5 to-primary/10' 
        : isCurrentPlan
        ? 'border-emerald-500 bg-emerald-50/50'
        : 'hover:shadow-md'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-primary-foreground px-3 py-1">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary" className="bg-emerald-500 text-primary-foreground">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
        
        <div className="flex flex-col items-center space-y-2 pt-4">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(price)}
            </span>
            {price && price > 0 && (
              <span className="text-muted-foreground">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            )}
          </div>
          
          {billingCycle === 'yearly' && monthlyPrice && (
            <div className="text-sm text-muted-foreground">
              {formatPrice(Math.round(monthlyPrice * 100))} per month
              {yearlyDiscount > 0 && (
                <Badge variant="outline" className="ml-2 text-emerald-600 border-emerald-600">
                  Save {yearlyDiscount}%
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Features Included
          </h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Usage Limits */}
        {Object.keys(plan.limits).length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Usage Limits
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(plan.limits).map(([key, limit]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="capitalize">
                    {key.replace('_', ' ')}:
                  </span>
                  <span className="font-medium text-primary">
                    {renderFeatureLimit(limit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
          onClick={() => onSelectPlan(plan.id)}
          disabled={loading || isCurrentPlan}
        >
          {loading ? (
            'Processing...'
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : price === null || price === 0 ? (
            'Get Started Free'
          ) : (
            `Upgrade to ${plan.name}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};