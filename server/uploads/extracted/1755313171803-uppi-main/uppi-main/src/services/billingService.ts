/**
 * Billing Service - Comprehensive billing and subscription management
 * Handles all billing operations, payment processing, and subscription lifecycle
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  SubscriptionPlan, 
  UserSubscription, 
  BillingInvoice, 
  PaymentMethod,
  UsageTracking,
  BillingEvent,
  BillingMetrics,
  UsageLimitCheck,
  SubscriptionCheckoutResponse,
  BillingApiResponse
} from '@/types/billing';

export class BillingService {
  /**
   * SUBSCRIPTION PLANS
   */
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string),
        limits: typeof plan.limits === 'object' ? plan.limits : JSON.parse(plan.limits as string)
      })) as SubscriptionPlan[];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  }

  static async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        features: Array.isArray(data.features) ? data.features : JSON.parse(data.features as string),
        limits: typeof data.limits === 'object' ? data.limits : JSON.parse(data.limits as string)
      } as SubscriptionPlan;
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }
  }

  /**
   * USER SUBSCRIPTIONS
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        status: data.status as any
      } as UserSubscription;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  static async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(subscription => ({
        ...subscription,
        status: subscription.status as any
      })) as UserSubscription[];
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      return [];
    }
  }

  static async createSubscription(subscriptionData: Partial<UserSubscription>): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert(subscriptionData as any)
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .single();

      if (error) throw error;
      return data as UserSubscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return null;
    }
  }

  static async updateSubscription(subscriptionId: string, updates: Partial<UserSubscription>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return false;
    }
  }

  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  /**
   * BILLING & INVOICES
   */
  static async getUserInvoices(userId: string): Promise<BillingInvoice[]> {
    try {
      const { data, error } = await supabase
        .from('billing_invoices')
        .select(`
          *,
          subscription:user_subscriptions(
            *,
            plan:subscription_plans(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(invoice => ({
        ...invoice,
        status: invoice.status as any
      })) as BillingInvoice[];
    } catch (error) {
      console.error('Error fetching user invoices:', error);
      return [];
    }
  }

  static async getInvoice(invoiceId: string): Promise<BillingInvoice | null> {
    try {
      const { data, error } = await supabase
        .from('billing_invoices')
        .select(`
          *,
          subscription:user_subscriptions(
            *,
            plan:subscription_plans(*)
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        status: data.status as any
      } as BillingInvoice;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }

  static async createInvoice(invoiceData: Partial<BillingInvoice>): Promise<BillingInvoice | null> {
    try {
      const { data, error } = await supabase
        .from('billing_invoices')
        .insert(invoiceData as any)
        .select()
        .single();

      if (error) throw error;
      return data as BillingInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  }

  /**
   * PAYMENT METHODS
   */
  static async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return (data || []).map(method => ({
        ...method,
        type: method.type as any
      })) as PaymentMethod[];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  static async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        type: data.type as any
      } as PaymentMethod;
    } catch (error) {
      console.error('Error fetching default payment method:', error);
      return null;
    }
  }

  static async addPaymentMethod(paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod | null> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert(paymentMethodData as any)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentMethod;
    } catch (error) {
      console.error('Error adding payment method:', error);
      return null;
    }
  }

  static async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<boolean> {
    try {
      // First, unset all default payment methods for the user
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Then set the new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return false;
    }
  }

  static async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing payment method:', error);
      return false;
    }
  }

  /**
   * USAGE TRACKING
   */
  static async getUserUsage(userId: string, resourceType?: string): Promise<UsageTracking[]> {
    try {
      let query = supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId);

      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(usage => ({
        ...usage,
        metadata: typeof usage.metadata === 'object' ? usage.metadata : JSON.parse(usage.metadata as string)
      })) as UsageTracking[];
    } catch (error) {
      console.error('Error fetching user usage:', error);
      return [];
    }
  }

  static async checkUsageLimit(userId: string, resourceType: string): Promise<UsageLimitCheck> {
    try {
      // Get user's current subscription and plan limits
      const subscription = await this.getUserSubscription(userId);
      if (!subscription || !subscription.plan) {
        return {
          resource_type: resourceType,
          current_usage: 0,
          limit: 0,
          usage_percentage: 100,
          limit_exceeded: true
        };
      }

      const limit = subscription.plan.limits[resourceType] || 0;
      
      // Get current period usage
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: usage, error } = await supabase
        .from('usage_tracking')
        .select('usage_count')
        .eq('user_id', userId)
        .eq('resource_type', resourceType)
        .gte('period_start', startOfMonth.toISOString())
        .lte('period_end', now.toISOString());

      if (error) throw error;

      const currentUsage = usage?.reduce((total, item) => total + item.usage_count, 0) || 0;
      const usagePercentage = limit === -1 ? 0 : (currentUsage / limit) * 100;
      const limitExceeded = limit !== -1 && currentUsage >= limit;

      return {
        resource_type: resourceType,
        current_usage: currentUsage,
        limit: limit === -1 ? Infinity : limit,
        usage_percentage: usagePercentage,
        limit_exceeded: limitExceeded
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return {
        resource_type: resourceType,
        current_usage: 0,
        limit: 0,
        usage_percentage: 100,
        limit_exceeded: true
      };
    }
  }

  static async recordUsage(userId: string, resourceType: string, usageCount: number = 1, metadata: Record<string, any> = {}): Promise<boolean> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const subscription = await this.getUserSubscription(userId);

      const { error } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          subscription_id: subscription?.id || null,
          resource_type: resourceType,
          usage_count: usageCount,
          period_start: startOfMonth.toISOString(),
          period_end: endOfMonth.toISOString(),
          metadata
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error recording usage:', error);
      return false;
    }
  }

  /**
   * BILLING EVENTS & AUDIT TRAIL
   */
  static async recordBillingEvent(userId: string, eventType: string, eventData: Record<string, any>, stripeEventId?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('billing_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: eventData,
          stripe_event_id: stripeEventId || null,
          processed_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error recording billing event:', error);
      return false;
    }
  }

  static async getBillingEvents(userId: string): Promise<BillingEvent[]> {
    try {
      const { data, error } = await supabase
        .from('billing_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map(event => ({
        ...event,
        event_data: typeof event.event_data === 'object' ? event.event_data : JSON.parse(event.event_data as string)
      })) as BillingEvent[];
    } catch (error) {
      console.error('Error fetching billing events:', error);
      return [];
    }
  }

  /**
   * STRIPE INTEGRATION METHODS
   */
  static async createCheckoutSession(userId: string, planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<SubscriptionCheckoutResponse | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          user_id: userId,
          plan_id: planId,
          billing_cycle: billingCycle
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  }

  static async createCustomerPortalSession(userId: string): Promise<{ url: string } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { user_id: userId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      return null;
    }
  }

  /**
   * ANALYTICS & METRICS
   */
  static async getBillingMetrics(): Promise<BillingMetrics> {
    try {
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(price_monthly)
        `)
        .eq('status', 'active');

      if (subError) throw subError;

      const { data: invoices, error: invError } = await supabase
        .from('billing_invoices')
        .select('total_amount, created_at')
        .eq('status', 'paid');

      if (invError) throw invError;

      const activeSubscriptions = subscriptions?.length || 0;
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const monthlyRevenue = invoices?.filter(inv => 
        new Date(inv.created_at) >= currentMonth
      ).reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      const averageRevenuePerUser = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

      return {
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions,
        churnRate: 0, // Calculate based on cancelled subscriptions
        averageRevenuePerUser,
        conversionRate: 0 // Calculate based on trial to paid conversions
      };
    } catch (error) {
      console.error('Error fetching billing metrics:', error);
      return {
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeSubscriptions: 0,
        churnRate: 0,
        averageRevenuePerUser: 0,
        conversionRate: 0
      };
    }
  }
}