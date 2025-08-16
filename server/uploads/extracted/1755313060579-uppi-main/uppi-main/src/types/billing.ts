/**
 * Billing & Payment System Type Definitions
 * Comprehensive types for Phase 10 implementation
 */

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
export type PaymentMethodType = 'card' | 'bank_account' | 'paypal' | 'crypto';

/**
 * Subscription Plans - Pricing tiers and feature definitions
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User Subscriptions - Active subscription tracking
 */
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  plan?: SubscriptionPlan;
}

/**
 * Billing Invoices - Payment records and history
 */
export interface BillingInvoice {
  id: string;
  user_id: string;
  subscription_id: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  invoice_number: string;
  due_date: string | null;
  paid_at: string | null;
  stripe_invoice_id: string | null;
  download_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  subscription?: UserSubscription;
}

/**
 * Payment Methods - Stored payment instruments
 */
export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: PaymentMethodType;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Usage Tracking - Monitor feature usage and limits
 */
export interface UsageTracking {
  id: string;
  user_id: string;
  subscription_id: string | null;
  resource_type: string;
  usage_count: number;
  period_start: string;
  period_end: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Billing Events - Audit trail for billing actions
 */
export interface BillingEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  stripe_event_id: string | null;
  processed_at: string | null;
  created_at: string;
}

/**
 * Billing Dashboard Data - Aggregated metrics
 */
export interface BillingMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  conversionRate: number;
}

/**
 * Subscription Analytics - Plan performance data
 */
export interface SubscriptionAnalytics {
  planId: string;
  planName: string;
  activeSubscribers: number;
  revenue: number;
  churnRate: number;
  conversionRate: number;
}

/**
 * Billing Form Types - UI component interfaces
 */
export interface SubscriptionFormData {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethodId?: string;
}

export interface PaymentMethodFormData {
  type: PaymentMethodType;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
  isDefault?: boolean;
}

/**
 * API Response Types
 */
export interface BillingApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SubscriptionCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface UsageLimitCheck {
  resource_type: string;
  current_usage: number;
  limit: number;
  usage_percentage: number;
  limit_exceeded: boolean;
}

/**
 * Stripe Integration Types
 */
export interface StripeCustomerData {
  stripe_customer_id: string;
  email: string;
  name?: string;
  phone?: string;
}

export interface StripeSubscriptionData {
  subscription_id: string;
  customer_id: string;
  status: SubscriptionStatus;
  current_period_start: number;
  current_period_end: number;
  trial_end?: number;
  items: Array<{
    price_id: string;
    quantity: number;
  }>;
}

/**
 * Billing Notification Types
 */
export interface BillingNotification {
  type: 'subscription_created' | 'payment_failed' | 'invoice_paid' | 'subscription_cancelled' | 'trial_ending';
  title: string;
  message: string;
  data?: Record<string, any>;
  created_at: string;
}