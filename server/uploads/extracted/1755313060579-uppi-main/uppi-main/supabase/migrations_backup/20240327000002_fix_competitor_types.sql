
-- Add url_verified column if it doesn't exist
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS url_verified boolean DEFAULT false;

-- Add channels column if it doesn't exist
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS channels text[] DEFAULT ARRAY[]::text[];

-- Add coverage_areas column if it doesn't exist
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS coverage_areas text[] DEFAULT ARRAY[]::text[];

-- Add online_presence_platforms column if it doesn't exist
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS online_presence_platforms text[] DEFAULT ARRAY[]::text[];

-- Add funding_info column if it doesn't exist
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS funding_info jsonb DEFAULT '{}'::jsonb;

-- Add notes column if it doesn't exist
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS notes jsonb DEFAULT '[]'::jsonb;

-- Add platforms column if it doesn't exist
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT ARRAY[]::text[];

-- Add sales_model column if it doesn't exist
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS sales_model text;

-- Add missing index for better query performance
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_url_verified ON competitor_analyses(url_verified);

-- Create function to ensure all required fields are present
CREATE OR REPLACE FUNCTION ensure_competitor_required_fields()
RETURNS trigger AS $$
BEGIN
  NEW.url_verified := COALESCE(NEW.url_verified, false);
  NEW.channels := COALESCE(NEW.channels, ARRAY[]::text[]);
  NEW.coverage_areas := COALESCE(NEW.coverage_areas, ARRAY[]::text[]);
  NEW.online_presence_platforms := COALESCE(NEW.online_presence_platforms, ARRAY[]::text[]);
  NEW.funding_info := COALESCE(NEW.funding_info, '{}'::jsonb);
  NEW.notes := COALESCE(NEW.notes, '[]'::jsonb);
  NEW.platforms := COALESCE(NEW.platforms, ARRAY[]::text[]);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure required fields
DROP TRIGGER IF EXISTS ensure_competitor_required_fields_trigger ON competitor_analyses;
CREATE TRIGGER ensure_competitor_required_fields_trigger
  BEFORE INSERT OR UPDATE ON competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_competitor_required_fields();

-- Update existing rows to ensure they have the required fields
UPDATE competitor_analyses
SET 
  url_verified = COALESCE(url_verified, false),
  channels = COALESCE(channels, ARRAY[]::text[]),
  coverage_areas = COALESCE(coverage_areas, ARRAY[]::text[]),
  online_presence_platforms = COALESCE(online_presence_platforms, ARRAY[]::text[]),
  funding_info = COALESCE(funding_info, '{}'::jsonb),
  notes = COALESCE(notes, '[]'::jsonb),
  platforms = COALESCE(platforms, ARRAY[]::text[])
WHERE url_verified IS NULL 
   OR channels IS NULL 
   OR coverage_areas IS NULL 
   OR online_presence_platforms IS NULL
   OR funding_info IS NULL
   OR notes IS NULL
   OR platforms IS NULL;

-- Update view to include new fields
CREATE OR REPLACE VIEW v_competitor_analyses AS
SELECT 
  ca.*,
  COALESCE(ca.url_verified, false) as url_verified,
  COALESCE(ca.channels, ARRAY[]::text[]) as channels,
  COALESCE(ca.coverage_areas, ARRAY[]::text[]) as coverage_areas,
  COALESCE(ca.online_presence_platforms, ARRAY[]::text[]) as online_presence_platforms,
  COALESCE(ca.funding_info, '{}'::jsonb) as funding_info,
  COALESCE(ca.notes, '[]'::jsonb) as notes,
  COALESCE(ca.platforms, ARRAY[]::text[]) as platforms
FROM competitor_analyses ca
WHERE ca.deleted_at IS NULL;
