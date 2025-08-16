-- Phase 10: Billing & Payment System Database Schema
-- Create comprehensive billing and payment infrastructure

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing invoices table
CREATE TABLE public.billing_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  invoice_number TEXT UNIQUE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_invoice_id TEXT UNIQUE,
  download_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  resource_type TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing events table for audit trail
CREATE TABLE public.billing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  stripe_event_id TEXT UNIQUE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all billing tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read for all authenticated users)
CREATE POLICY "Subscription plans are viewable by authenticated users" 
ON public.subscription_plans 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Admin can manage subscription plans
CREATE POLICY "Admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can create subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admin access to all subscriptions
CREATE POLICY "Admins can manage all subscriptions" 
ON public.user_subscriptions 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for billing_invoices
CREATE POLICY "Users can view their own invoices" 
ON public.billing_invoices 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Admin access to all invoices
CREATE POLICY "Admins can manage all invoices" 
ON public.billing_invoices 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for payment_methods
CREATE POLICY "Users can view their own payment methods" 
ON public.payment_methods 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own payment methods" 
ON public.payment_methods 
FOR ALL 
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage" 
ON public.usage_tracking 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can track usage" 
ON public.usage_tracking 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admin access to all usage data
CREATE POLICY "Admins can view all usage" 
ON public.usage_tracking 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for billing_events
CREATE POLICY "Users can view their own billing events" 
ON public.billing_events 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- System can create billing events
CREATE POLICY "System can create billing events" 
ON public.billing_events 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Admin access to all billing events
CREATE POLICY "Admins can view all billing events" 
ON public.billing_events 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_billing_invoices_user_id ON public.billing_invoices(user_id);
CREATE INDEX idx_billing_invoices_status ON public.billing_invoices(status);
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON public.payment_methods(user_id, is_default);
CREATE INDEX idx_usage_tracking_user_period ON public.usage_tracking(user_id, period_start, period_end);
CREATE INDEX idx_billing_events_user_id ON public.billing_events(user_id);
CREATE INDEX idx_billing_events_type ON public.billing_events(event_type);

-- Create updated_at triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_invoices_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, limits) VALUES
(
  'Starter',
  'Perfect for solo entrepreneurs getting started',
  9.99,
  99.99,
  '["AI Chatbot Access", "Basic Market Research", "5 Competitor Analysis", "Email Support"]',
  '{"competitors_per_month": 5, "market_research_reports": 2, "chat_messages": 100}'
),
(
  'Professional', 
  'Ideal for growing businesses',
  29.99,
  299.99,
  '["Everything in Starter", "Advanced Analytics", "Unlimited Competitor Analysis", "50 Market Research Reports", "Priority Support", "API Access"]',
  '{"competitors_per_month": -1, "market_research_reports": 50, "chat_messages": 1000, "api_requests": 10000}'
),
(
  'Enterprise',
  'For large organizations with custom needs',
  99.99,
  999.99,
  '["Everything in Professional", "Custom Integration", "Dedicated Support", "Advanced Security", "Custom Reports", "White-label Options"]',
  '{"competitors_per_month": -1, "market_research_reports": -1, "chat_messages": -1, "api_requests": -1}'
);