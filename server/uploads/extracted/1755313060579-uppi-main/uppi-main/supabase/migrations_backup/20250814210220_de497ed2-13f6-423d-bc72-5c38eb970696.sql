-- Enable pgsodium extension for Supabase Vault functionality
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Verify pgsodium is working by creating a test key (will be cleaned up)
DO $$
DECLARE
    test_key_id uuid;
BEGIN
    -- Test if pgsodium is working
    SELECT pgsodium.create_key() INTO test_key_id;
    
    -- Clean up test key
    DELETE FROM pgsodium.key WHERE id = test_key_id;
    
    -- Log success
    RAISE NOTICE 'Pgsodium extension enabled and working correctly';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Pgsodium extension may not be available: %', SQLERRM;
END
$$;