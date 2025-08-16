-- Temporarily disable RLS on microservices to test
ALTER TABLE microservices DISABLE ROW LEVEL SECURITY;

-- Add sample data if missing
INSERT INTO microservices (
  name, 
  display_name, 
  description, 
  base_url, 
  version, 
  status, 
  is_active
) 
SELECT 
  'test-service',
  'Test Service',
  'Test microservice for debugging',
  'https://example.com',
  '1.0.0',
  'active',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM microservices LIMIT 1
);