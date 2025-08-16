-- Move vector extension from public schema to extensions schema
DROP EXTENSION IF EXISTS vector;

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to relevant roles
GRANT USAGE ON SCHEMA extensions TO public;

-- Create vector extension in extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;