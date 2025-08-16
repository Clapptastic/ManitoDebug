-- Add API key integrity validation
CREATE OR REPLACE FUNCTION public.validate_api_key_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure either vault_secret_id OR api_key is present, not both
  IF NEW.vault_secret_id IS NOT NULL AND NEW.api_key IS NOT NULL THEN
    RAISE EXCEPTION 'API key cannot have both vault_secret_id and direct api_key storage';
  END IF;
  
  -- Validate masked_key format
  IF NEW.masked_key IS NULL OR length(NEW.masked_key) < 8 THEN
    RAISE EXCEPTION 'Invalid masked_key format';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for API key validation
DROP TRIGGER IF EXISTS trg_validate_api_key_data ON public.api_keys;
CREATE TRIGGER trg_validate_api_key_data
  BEFORE INSERT OR UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.validate_api_key_data();

-- Add missing indexes for performance (using regular CREATE INDEX)
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider ON public.api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_costs_user_date ON public.api_usage_costs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_status ON public.competitor_analyses(user_id, status);

-- Add unique constraint to prevent duplicate user/provider combinations
ALTER TABLE public.api_keys ADD CONSTRAINT uk_api_keys_user_provider UNIQUE (user_id, provider);