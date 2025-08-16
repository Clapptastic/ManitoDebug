-- Create affiliate_links table for admin components
CREATE TABLE public.affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  affiliate_code TEXT,
  category TEXT,
  program_name TEXT,
  status TEXT DEFAULT 'active',
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies
CREATE POLICY "Super admins can manage affiliate links" 
ON public.affiliate_links 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Create analytics tables
CREATE TABLE public.website_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  pageviews INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_session_duration INTEGER DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_analytics ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies
CREATE POLICY "Super admins can manage analytics" 
ON public.website_analytics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM platform_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);