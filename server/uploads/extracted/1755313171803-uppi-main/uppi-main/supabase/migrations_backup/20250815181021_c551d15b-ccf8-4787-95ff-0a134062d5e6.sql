-- Consolidate API key tables and create unified schema
-- Drop user_api_keys table as we'll use api_keys as the single source of truth
DROP TABLE IF EXISTS user_api_keys CASCADE;

-- Ensure api_keys table has all necessary columns with correct types
ALTER TABLE api_keys 
DROP COLUMN IF EXISTS encrypted_key,
ADD COLUMN IF NOT EXISTS key_hash TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Update api_keys table structure to match unified requirements
ALTER TABLE api_keys 
ALTER COLUMN provider SET DEFAULT 'openai',
ALTER COLUMN status SET DEFAULT 'active',
ALTER COLUMN is_active SET DEFAULT true,
ALTER COLUMN permissions SET DEFAULT '["read", "write"]',
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();

-- Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider ON api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status) WHERE status = 'active';

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies to be more restrictive and secure
DROP POLICY IF EXISTS "api_keys_owner_only" ON api_keys;

CREATE POLICY "api_keys_user_read" ON api_keys
    FOR SELECT USING (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
        OR get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
    );

CREATE POLICY "api_keys_user_insert" ON api_keys
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "api_keys_user_update" ON api_keys
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
        OR get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
    );

CREATE POLICY "api_keys_user_delete" ON api_keys
    FOR DELETE USING (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
        OR get_user_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin'])
    );