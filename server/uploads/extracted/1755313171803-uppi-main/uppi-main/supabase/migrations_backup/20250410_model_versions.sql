
-- Create the model_versions table for tracking AI model information
CREATE TABLE IF NOT EXISTS model_versions (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(255) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  current_version VARCHAR(255),
  latest_version VARCHAR(255),
  status VARCHAR(50) DEFAULT 'current',
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, model_name)
);

-- Add model_preference column to the api_keys table
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS model_preference TEXT DEFAULT NULL;

-- Add index for faster lookups by provider
CREATE INDEX IF NOT EXISTS idx_model_versions_provider ON model_versions(provider);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_model_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_model_versions_updated_at
BEFORE UPDATE ON model_versions
FOR EACH ROW
EXECUTE FUNCTION update_model_versions_updated_at();

-- Ensure the cron job for weekly model updates is registered
-- This makes sure the model availability is checked at least once a week
DO $$
BEGIN
  -- Check if the cron job already exists
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly_model_check') THEN
    -- If it doesn't exist, create it
    PERFORM cron.schedule(
      'weekly_model_check',
      '0 0 * * 0', -- Run every Sunday at midnight
      $$
      SELECT
        net.http_post(
          url := CONCAT(
            (SELECT value FROM public.config WHERE key = 'supabase_url'),
            '/functions/v1/cron-weekly-model-check'
          ),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', CONCAT('Bearer ', (SELECT value FROM public.config WHERE key = 'anon_key'))
          ),
          body := '{"trigger": "weekly_cron"}'::jsonb
        ) as request_id;
      $$
    );
  END IF;
END
$$;
