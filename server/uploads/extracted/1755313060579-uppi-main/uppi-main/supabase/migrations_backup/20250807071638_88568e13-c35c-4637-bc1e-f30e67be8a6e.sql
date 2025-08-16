-- Fix SSO configurations table to match our interface
ALTER TABLE public.sso_configurations 
ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}';

-- Drop domain column if it exists (seems to be from existing table)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sso_configurations' AND column_name = 'domain') THEN
        ALTER TABLE public.sso_configurations DROP COLUMN domain;
    END IF;
END $$;