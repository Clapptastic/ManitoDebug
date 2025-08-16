-- Initial database schema
-- This file contains the base schema for the AI-powered SaaS platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE competitor_growth_stage AS ENUM ('seed', 'early', 'growth', 'expansion', 'mature', 'decline');
CREATE TYPE market_position_type AS ENUM ('leader', 'challenger', 'follower', 'niche');
CREATE TYPE competitor_analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'draft', 'partial');
CREATE TYPE impact_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE api_status AS ENUM ('active', 'invalid', 'checking', 'valid', 'error', 'pending', 'working');

-- Utility function to set updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table (for user information)
CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL,
  api_key TEXT NOT NULL,
  status api_status DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  model_preference JSONB DEFAULT '{}'::jsonb,
  last_validated TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key_type)
);

-- Competitor analyses
CREATE TABLE competitor_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  status competitor_analysis_status NOT NULL DEFAULT 'pending',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own API keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own API keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own API keys" ON api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own API keys" ON api_keys FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own analyses" ON competitor_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analyses" ON competitor_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analyses" ON competitor_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analyses" ON competitor_analyses FOR DELETE USING (auth.uid() = user_id);

-- Create a profile record for each user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = PUBLIC
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
