-- Fix API key storage by adding encrypted_key column and updating the table structure
-- This resolves the vault permission issues by using standard database encryption

-- Add encrypted_key column to api_keys table
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS encrypted_key text;

-- Update the vault_secret_id column to be nullable since we'll use encrypted_key instead
ALTER TABLE public.api_keys 
ALTER COLUMN vault_secret_id DROP NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider_active 
ON public.api_keys(user_id, provider, is_active) 
WHERE is_active = true;