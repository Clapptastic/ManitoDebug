-- Populate model_versions table with current active models
INSERT INTO model_versions (provider, model_name, current_version, latest_version, status, metadata) VALUES
-- OpenAI Models
('openai', 'gpt-4.1-2025-04-14', '2025-04-14', '2025-04-14', 'current', '{"description": "Flagship model with superior performance", "context_window": 128000, "capabilities": ["text", "vision"], "pricing_tier": "premium"}'),
('openai', 'o3-2025-04-16', '2025-04-16', '2025-04-16', 'current', '{"description": "Powerful reasoning model for complex problems", "context_window": 128000, "capabilities": ["text", "reasoning", "vision"], "pricing_tier": "premium"}'),
('openai', 'o4-mini-2025-04-16', '2025-04-16', '2025-04-16', 'current', '{"description": "Fast reasoning model optimized for efficiency", "context_window": 128000, "capabilities": ["text", "reasoning", "vision"], "pricing_tier": "standard"}'),
('openai', 'gpt-4.1-mini-2025-04-14', '2025-04-14', '2025-04-14', 'current', '{"description": "Efficient model with vision capabilities", "context_window": 128000, "capabilities": ["text", "vision"], "pricing_tier": "standard"}'),
('openai', 'gpt-4o', '2024-05-13', '2024-05-13', 'legacy', '{"description": "Older powerful model with vision", "context_window": 128000, "capabilities": ["text", "vision"], "pricing_tier": "premium"}'),

-- Anthropic Models  
('anthropic', 'claude-opus-4-20250514', '20250514', '20250514', 'current', '{"description": "Most capable and intelligent model with superior reasoning", "context_window": 200000, "capabilities": ["text", "vision", "multilingual"], "pricing_tier": "premium"}'),
('anthropic', 'claude-sonnet-4-20250514', '20250514', '20250514', 'current', '{"description": "High-performance model with exceptional reasoning and efficiency", "context_window": 200000, "capabilities": ["text", "vision", "multilingual"], "pricing_tier": "standard"}'),
('anthropic', 'claude-3-5-haiku-20241022', '20241022', '20241022', 'current', '{"description": "Fastest model for quick responses", "context_window": 200000, "capabilities": ["text", "vision", "multilingual"], "pricing_tier": "standard"}'),
('anthropic', 'claude-3-7-sonnet-20250219', '20250219', '20250219', 'legacy', '{"description": "Extended thinking model being superseded", "context_window": 200000, "capabilities": ["text", "vision", "multilingual"], "pricing_tier": "standard"}'),
('anthropic', 'claude-3-5-sonnet-20241022', '20241022', '20241022', 'legacy', '{"description": "Previous intelligent model replaced by Claude 4", "context_window": 200000, "capabilities": ["text", "vision", "multilingual"], "pricing_tier": "standard"}'),

-- Perplexity Models
('perplexity', 'llama-3.1-sonar-large-128k-online', '3.1', '3.1', 'current', '{"description": "Large model with real-time search capabilities", "context_window": 127072, "capabilities": ["text", "search", "real-time"], "pricing_tier": "premium"}'),
('perplexity', 'llama-3.1-sonar-small-128k-online', '3.1', '3.1', 'current', '{"description": "Efficient model with real-time search", "context_window": 127072, "capabilities": ["text", "search", "real-time"], "pricing_tier": "standard"}'),
('perplexity', 'llama-3.1-sonar-huge-128k-online', '3.1', '3.1', 'current', '{"description": "Most powerful model with real-time search", "context_window": 127072, "capabilities": ["text", "search", "real-time"], "pricing_tier": "premium"}')

ON CONFLICT (provider, model_name) DO UPDATE SET
  latest_version = EXCLUDED.latest_version,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_model_versions_provider_status ON model_versions(provider, status);
CREATE INDEX IF NOT EXISTS idx_model_versions_active ON model_versions(provider) WHERE status = 'current';