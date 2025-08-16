-- Grant necessary permissions for pgsodium vault operations
-- This fixes the "permission denied for function _crypto_aead_det_noncegen" error

-- Grant usage on pgsodium schema to authenticated users
GRANT USAGE ON SCHEMA pgsodium TO authenticated;
GRANT USAGE ON SCHEMA pgsodium TO service_role;

-- Grant execute permissions on pgsodium functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgsodium TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgsodium TO service_role;

-- Grant access to pgsodium tables for vault operations
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pgsodium TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pgsodium TO service_role;

-- Ensure future functions get the same permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA pgsodium GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA pgsodium GRANT EXECUTE ON FUNCTIONS TO service_role;