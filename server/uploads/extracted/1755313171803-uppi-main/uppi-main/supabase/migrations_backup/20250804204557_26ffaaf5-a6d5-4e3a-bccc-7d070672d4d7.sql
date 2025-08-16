-- Add Docker-related fields to microservices table
ALTER TABLE public.microservices 
ADD COLUMN IF NOT EXISTS docker_config jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS integration_documentation text,
ADD COLUMN IF NOT EXISTS deployment_instructions text,
ADD COLUMN IF NOT EXISTS api_endpoints jsonb DEFAULT '[]';

-- Update the microservices table comment
COMMENT ON TABLE public.microservices IS 'Microservices registry with Docker support and integration documentation';

-- Add comments for new columns
COMMENT ON COLUMN public.microservices.docker_config IS 'Docker configuration including base image, ports, environment, etc.';
COMMENT ON COLUMN public.microservices.integration_documentation IS 'Auto-generated integration documentation for AI coding agents';
COMMENT ON COLUMN public.microservices.deployment_instructions IS 'Step-by-step deployment instructions';
COMMENT ON COLUMN public.microservices.api_endpoints IS 'Discovered API endpoints from Docker analysis';

-- Create index for searching integration documentation
CREATE INDEX IF NOT EXISTS idx_microservices_integration_doc 
ON public.microservices USING gin(to_tsvector('english', integration_documentation));

-- Create index for Docker config searches
CREATE INDEX IF NOT EXISTS idx_microservices_docker_config 
ON public.microservices USING gin(docker_config);