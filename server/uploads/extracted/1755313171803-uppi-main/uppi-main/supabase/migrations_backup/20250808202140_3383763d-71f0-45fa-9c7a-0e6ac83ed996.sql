-- Move relocatable extensions from public (or other schemas) to the 'extensions' schema for best practice
-- This migration is idempotent and safe to re-run.

BEGIN;

-- 1) Ensure the dedicated extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2) Move all relocatable extensions that are not already in the 'extensions' schema
--    This avoids hardcoding specific extension names and only moves those that support relocation
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT e.extname
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extrelocatable = TRUE
      AND n.nspname <> 'extensions'
  LOOP
    EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', rec.extname);
  END LOOP;
END $$;

COMMIT;
