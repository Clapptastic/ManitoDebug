-- 1) Add missing tokens_used to api_usage_costs for cost tracking and function compatibility
ALTER TABLE public.api_usage_costs
  ADD COLUMN IF NOT EXISTS tokens_used integer NOT NULL DEFAULT 0;

-- 2) Deactivate invalid Perplexity admin key to stop failing calls
UPDATE public.admin_api_keys
SET is_active = false,
    status = 'inactive',
    error_message = 'Invalid encrypted API key format: Failed to decode base64',
    updated_at = now()
WHERE provider = 'perplexity' AND is_active = true;