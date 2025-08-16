-- First, let's remove any existing API keys with null vault_secret_id since they can't be migrated
DELETE FROM public.api_keys WHERE vault_secret_id IS NULL;

-- Remove all legacy encryption/decryption functions
DROP FUNCTION IF EXISTS public.decrypt_sensitive_data(bytea);
DROP FUNCTION IF EXISTS public.encrypt_sensitive_data(text);
DROP FUNCTION IF EXISTS public.decrypt_sensitive_data_secure(text, text);
DROP FUNCTION IF EXISTS public.encrypt_sensitive_data_secure(text, text);

-- Remove legacy API key management functions that don't use vault
DROP FUNCTION IF EXISTS public.hash_api_key(text);
DROP FUNCTION IF EXISTS public.store_api_key_secure(uuid, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.retrieve_api_key_secure(uuid, text, uuid, text);
DROP FUNCTION IF EXISTS public.rotate_encryption_key(text, text);

-- Update the API keys table to only support vault encryption
ALTER TABLE public.api_keys DROP COLUMN IF EXISTS api_key;
ALTER TABLE public.api_keys DROP COLUMN IF EXISTS encryption_version;
ALTER TABLE public.api_keys DROP COLUMN IF EXISTS key_hash;
ALTER TABLE public.api_keys DROP COLUMN IF EXISTS key_hash_new;

-- Now we can safely set vault_secret_id as required
ALTER TABLE public.api_keys ALTER COLUMN vault_secret_id SET NOT NULL;