-- Fix RLS policies for api_usage_costs table
DROP POLICY IF EXISTS "Users can view their own API costs" ON api_usage_costs;
DROP POLICY IF EXISTS "Users can insert their own API costs" ON api_usage_costs;
DROP POLICY IF EXISTS "Admins can view all API usage costs" ON api_usage_costs;

-- Create proper RLS policies for api_usage_costs
CREATE POLICY "Users can view their own API usage costs" ON api_usage_costs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API usage costs" ON api_usage_costs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all API usage costs" ON api_usage_costs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Fix documents table RLS policies
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure api_keys table has proper policies (they should already exist but let's verify)
DROP POLICY IF EXISTS "api_keys_user_access" ON api_keys;
CREATE POLICY "api_keys_user_access" ON api_keys
  FOR ALL USING (
    (auth.uid() = user_id) OR 
    ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR 
    (current_setting('role'::text) = 'service_role'::text)
  );

-- Create missing tables for chatbot configuration if they don't exist
CREATE TABLE IF NOT EXISTS user_chatbot_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_provider TEXT NOT NULL,
  assigned_model TEXT NOT NULL,
  fallback_providers TEXT[] DEFAULT '{}',
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_chatbot_configs
ALTER TABLE user_chatbot_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_chatbot_configs
CREATE POLICY "Users can manage their own chatbot configs" ON user_chatbot_configs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create missing user_model_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_model_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider, model_name)
);

-- Enable RLS on user_model_configs
ALTER TABLE user_model_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_model_configs
CREATE POLICY "Users can manage their own model configs" ON user_model_configs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers if they don't exist
DROP TRIGGER IF EXISTS update_user_chatbot_configs_updated_at ON user_chatbot_configs;
CREATE TRIGGER update_user_chatbot_configs_updated_at
  BEFORE UPDATE ON user_chatbot_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_model_configs_updated_at ON user_model_configs;
CREATE TRIGGER update_user_model_configs_updated_at
  BEFORE UPDATE ON user_model_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();