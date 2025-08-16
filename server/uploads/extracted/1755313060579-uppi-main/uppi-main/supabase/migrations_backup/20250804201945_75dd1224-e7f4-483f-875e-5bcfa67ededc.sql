-- Check what enum values actually exist
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'component_status')
ORDER BY enumsortorder;