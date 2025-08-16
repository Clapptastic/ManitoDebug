-- Drop conflicting policies first
DROP POLICY IF EXISTS "Users can manage their own model configs" ON user_model_configs;
DROP POLICY IF EXISTS "Users can manage their own chatbot configs" ON user_chatbot_configs;

-- Fix RLS policies for api_usage_costs table (these might have had issues)
DROP POLICY IF EXISTS "Users can view their own API usage costs" ON api_usage_costs;
DROP POLICY IF EXISTS "Users can insert their own API usage costs" ON api_usage_costs;
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

-- Create new RLS policies for configuration tables
CREATE POLICY "Users can manage their own chatbot configs" ON user_chatbot_configs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own model configs" ON user_model_configs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);