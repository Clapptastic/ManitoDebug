-- Fix RLS policies for api_keys table to allow proper access

-- First, let's check what policies exist and recreate them if needed
DROP POLICY IF EXISTS "Users can manage their own API keys" ON api_keys;
DROP POLICY IF EXISTS "Super admin can manage all API keys" ON api_keys;

-- Create comprehensive RLS policies for api_keys table
CREATE POLICY "Users can view their own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Super admin can manage all API keys
CREATE POLICY "Super admin can manage all API keys" ON api_keys
    FOR ALL USING (
        (auth.uid()::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR 
        (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])) OR 
        (auth.role() = 'service_role'::text)
    );

-- Ensure RLS is enabled on api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;