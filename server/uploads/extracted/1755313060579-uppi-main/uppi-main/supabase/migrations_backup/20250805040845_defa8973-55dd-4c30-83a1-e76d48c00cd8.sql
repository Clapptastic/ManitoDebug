-- Create all missing tables that components are trying to access (without vector type)

-- Documentation/Documents table  
CREATE TABLE IF NOT EXISTS public.documentation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  version TEXT DEFAULT '1.0',
  created_by UUID NOT NULL,
  is_published BOOLEAN DEFAULT false,
  file_path TEXT,
  file_size BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Company profiles table
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  website_url TEXT,
  description TEXT,
  industry TEXT,
  employee_count INTEGER,
  founded_year INTEGER,
  headquarters TEXT,
  business_model TEXT,
  funding_stage TEXT,
  revenue_estimate BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User chatbot configs table
CREATE TABLE IF NOT EXISTS public.user_chatbot_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assigned_provider TEXT DEFAULT 'openai',
  assigned_model TEXT DEFAULT 'gpt-4',
  fallback_providers TEXT[] DEFAULT '{}',
  max_tokens INTEGER DEFAULT 4000,
  temperature NUMERIC DEFAULT 0.7,
  system_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User model configs table
CREATE TABLE IF NOT EXISTS public.user_model_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing columns to API keys table
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'openai',
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS masked_key TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS last_validated TIMESTAMP WITH TIME ZONE;

-- Add missing columns to competitor_analyses table
ALTER TABLE public.competitor_analyses 
ADD COLUMN IF NOT EXISTS social_media_presence JSONB DEFAULT '{}'::jsonb;

-- Enable RLS on new tables
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_model_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own documentation" ON public.documentation FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documentation" ON public.documentation FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documentation" ON public.documentation FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documentation" ON public.documentation FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own company profiles" ON public.company_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own company profiles" ON public.company_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own company profiles" ON public.company_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own company profiles" ON public.company_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own chatbot configs" ON public.user_chatbot_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chatbot configs" ON public.user_chatbot_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chatbot configs" ON public.user_chatbot_configs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own model configs" ON public.user_model_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own model configs" ON public.user_model_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own model configs" ON public.user_model_configs FOR UPDATE USING (auth.uid() = user_id);