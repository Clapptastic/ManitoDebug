
-- Add model_preference column to api_keys table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'api_keys'
        AND column_name = 'model_preference'
    ) THEN
        ALTER TABLE public.api_keys
        ADD COLUMN model_preference text DEFAULT NULL;
    END IF;
END
$$;
