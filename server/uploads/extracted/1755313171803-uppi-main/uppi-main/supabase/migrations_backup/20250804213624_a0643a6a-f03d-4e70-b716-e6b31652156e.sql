-- Check if there are any microservices and add some sample data if none exist
SELECT COUNT(*) as total_microservices FROM microservices;

-- Insert some sample microservices data if the table is empty
INSERT INTO microservices (name, display_name, description, base_url, status, version) 
VALUES 
  ('competitor-analysis', 'Competitor Analysis Service', 'AI-powered competitor analysis and monitoring', 'https://api.example.com/competitor-analysis', 'active', '1.0.0'),
  ('api-validation', 'API Key Validation Service', 'Validates and manages API keys for external services', 'https://api.example.com/api-validation', 'active', '1.0.0'),
  ('market-research', 'Market Research Service', 'Automated market research and data collection', 'https://api.example.com/market-research', 'inactive', '0.9.0')
ON CONFLICT (name) DO NOTHING;

-- Check count again
SELECT COUNT(*) as total_after_insert FROM microservices;