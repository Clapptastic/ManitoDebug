-- Fix critical API keys table access issue
-- This enables the Add API Key button and all API key functionality

-- First, ensure the api_keys table exists and RLS is enabled
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  masked_key TEXT,
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_validated_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role can manage all API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can manage all API keys" ON public.api_keys;

-- Create new comprehensive policies
CREATE POLICY "Users can view their own API keys" 
ON public.api_keys FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" 
ON public.api_keys FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
ON public.api_keys FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
ON public.api_keys FOR DELETE 
USING (auth.uid() = user_id);

-- Critical: Service role access for edge functions
CREATE POLICY "Service role full access" 
ON public.api_keys FOR ALL 
USING (current_setting('role') = 'service_role');

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider ON public.api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON public.api_keys(status, is_active);

-- Ensure trigger function exists for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();