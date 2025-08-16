-- Fix RLS policies for user_chatbot_configs table
DROP POLICY IF EXISTS "Users can view their own chatbot configs" ON user_chatbot_configs;
DROP POLICY IF EXISTS "Users can insert their own chatbot configs" ON user_chatbot_configs;
DROP POLICY IF EXISTS "Users can update their own chatbot configs" ON user_chatbot_configs;
DROP POLICY IF EXISTS "Users can delete their own chatbot configs" ON user_chatbot_configs;

CREATE POLICY "Users can view their own chatbot configs" 
ON user_chatbot_configs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chatbot configs" 
ON user_chatbot_configs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chatbot configs" 
ON user_chatbot_configs FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chatbot configs" 
ON user_chatbot_configs FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for user_model_configs table
DROP POLICY IF EXISTS "Users can view their own model configs" ON user_model_configs;
DROP POLICY IF EXISTS "Users can insert their own model configs" ON user_model_configs;
DROP POLICY IF EXISTS "Users can update their own model configs" ON user_model_configs;
DROP POLICY IF EXISTS "Users can delete their own model configs" ON user_model_configs;

CREATE POLICY "Users can view their own model configs" 
ON user_model_configs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own model configs" 
ON user_model_configs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own model configs" 
ON user_model_configs FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own model configs" 
ON user_model_configs FOR DELETE 
USING (auth.uid() = user_id);