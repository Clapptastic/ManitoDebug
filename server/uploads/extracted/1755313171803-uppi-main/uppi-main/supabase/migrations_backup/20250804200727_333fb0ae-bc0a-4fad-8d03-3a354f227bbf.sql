-- Check what enum values are allowed for component_status
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'component_status'
);

-- Get the current structure of system_components table
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'system_components' 
AND table_schema = 'public'
ORDER BY ordinal_position;