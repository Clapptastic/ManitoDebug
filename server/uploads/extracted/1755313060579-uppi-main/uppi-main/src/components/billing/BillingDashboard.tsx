/**
 * Billing Dashboard Component
 * Comprehensive billing management interface
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Settings,
  Download,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { BillingService } from '@/services/billingService';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';
import { PaymentMethodList } from './PaymentMethodList';
import { InvoiceList } from './InvoiceList';
import { UsageMetrics } from './UsageMetrics';
import type { 
  UserSubscription, 
  SubscriptionPlan, 
  PaymentMethod, 
  BillingInvoice,
  UsageLimitCheck 
} from '@/types/billing';

interface BillingDashboardProps {
  userId: string;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ userId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // State
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [usageLimits, setUsageLimits] = useState<UsageLimitCheck[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Load billing data
  useEffect(() => {
    loadBillingData();
  }, [userId]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      const [
        subscription,
        plans,
        methods,
        userInvoices,
        usageData
      ] = await Promise.all([
        BillingService.getUserSubscription(userId),
        BillingService.getSubscriptionPlans(),
        BillingService.getUserPaymentMethods(userId),
        BillingService.getUserInvoices(userId),
        loadUsageData()
      ]);

      setCurrentSubscription(subscription);
      setSubscriptionPlans(plans);
      setPaymentMethods(methods);
      setInvoices(userInvoices);
      setUsageLimits(usageData);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsageData = async (): Promise<UsageLimitCheck[]> => {
    const resourceTypes = ['competitors_per_month', 'market_research_reports', 'chat_messages', 'api_requests'];
    const checks = await Promise.all(
      resourceTypes.map(type => BillingService.checkUsageLimit(userId, type))
    );
    return checks;
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      setActionLoading(true);
      
      const checkoutResponse = await BillingService.createCheckoutSession(
        userId, 
        planId, 
        billingCycle
      );
      
      if (checkoutResponse?.checkout_url) {
        // Open Stripe checkout in new tab
        window.open(checkoutResponse.checkout_url, '_blank');
        
        toast({
          title: "Redirecting to Checkout",
          description: "Opening Stripe checkout in a new tab..."
        });
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setActionLoading(true);
      
      const portalResponse = await BillingService.createCustomerPortalSession(userId);
      
      if (portalResponse?.url) {
        window.open(portalResponse.url, '_blank');
        
        toast({
          title: "Opening Billing Portal",
          description: "Redirecting to Stripe Customer Portal..."
        });
      } else {
        throw new Error('Failed to create customer portal session');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getSubscriptionStatusBadge = (subscription: UserSubscription) => {
    switch (subscription.status) {
      case 'active':
        return <Badge className="bg-emerald-500">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500">Trial</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{subscription.status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your subscription, payment methods, and billing history
          </p>
        </div>
        
        {currentSubscription && (
          <Button
            onClick={handleManageSubscription}
            disabled={actionLoading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Subscription</span>
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Current Subscription Overview */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{currentSubscription.plan?.name || 'Current Plan'}</span>
                  {getSubscriptionStatusBadge(currentSubscription)}
                </CardTitle>
                <CardDescription>
                  {currentSubscription.plan?.description}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ${((currentSubscription.plan?.price_monthly || 0) / 100).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Current Period</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(currentSubscription.current_period_start)} - {formatDate(currentSubscription.current_period_end)}
                  </p>
                </div>
              </div>
              
              {currentSubscription.status === 'trialing' && currentSubscription.trial_end && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Trial Ends</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(currentSubscription.trial_end)}
                    </p>
                  </div>
                </div>
              )}
              
              {currentSubscription.status === 'cancelled' && currentSubscription.cancelled_at && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Cancelled On</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(currentSubscription.cancelled_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Alerts */}
      {usageLimits.some(limit => limit.usage_percentage > 80) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You're approaching usage limits on some features. Consider upgrading your plan to avoid service interruptions.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* Subscription Plans */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Choose Your Plan</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan, index) => (
              <SubscriptionPlanCard
                key={plan.id}
                plan={plan}
                currentSubscription={currentSubscription}
                billingCycle={billingCycle}
                isPopular={index === 1} // Mark middle plan as popular
                onSelectPlan={handleSelectPlan}
                loading={actionLoading}
              />
            ))}
          </div>
        </TabsContent>

        {/* Usage Metrics */}
        <TabsContent value="usage" className="space-y-6">
          <h2 className="text-xl font-semibold">Usage & Limits</h2>
          <UsageMetrics 
            userId={userId}
            currentSubscription={currentSubscription}
            usageLimits={usageLimits}
          />
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="payments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Payment Methods</h2>
            <Button onClick={handleManageSubscription} variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
          <PaymentMethodList 
            paymentMethods={paymentMethods}
            onUpdate={loadBillingData}
          />
        </TabsContent>

        {/* Invoice History */}
        <TabsContent value="invoices" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Invoice History</h2>
            <Button variant="outline" onClick={handleManageSubscription}>
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
          <InvoiceList 
            invoices={invoices}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};