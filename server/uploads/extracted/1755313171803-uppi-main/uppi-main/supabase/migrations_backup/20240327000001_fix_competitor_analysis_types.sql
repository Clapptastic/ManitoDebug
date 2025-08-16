
-- First, ensure our enums exist
DO $$ BEGIN
    CREATE TYPE competitor_growth_stage AS ENUM ('startup', 'growth', 'mature', 'decline');
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE market_position_type AS ENUM ('leader', 'challenger', 'follower', 'niche');
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns to competitor_analyses table
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS data_quality_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS growth_stage competitor_growth_stage DEFAULT NULL,
ADD COLUMN IF NOT EXISTS position_type market_position_type DEFAULT NULL,
ADD COLUMN IF NOT EXISTS value_proposition text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS industry_classification jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS industry_trends jsonb[] DEFAULT ARRAY[]::jsonb[],
ADD COLUMN IF NOT EXISTS market_trends jsonb[] DEFAULT ARRAY[]::jsonb[];

-- Add validation trigger for industry_classification format
CREATE OR REPLACE FUNCTION validate_industry_classification()
RETURNS trigger AS $$
BEGIN
  IF NEW.industry_classification IS NOT NULL AND NOT (
    NEW.industry_classification ? 'primary' AND
    jsonb_typeof(NEW.industry_classification->'sub_sectors') IN ('null', 'array') AND
    jsonb_typeof(NEW.industry_classification->'market_cap_range') IN ('null', 'string')
  ) THEN
    RAISE EXCEPTION 'Invalid industry_classification format';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_industry_classification_trigger ON competitor_analyses;
CREATE TRIGGER validate_industry_classification_trigger
  BEFORE INSERT OR UPDATE ON competitor_analyses
  FOR EACH ROW
  EXECUTE FUNCTION validate_industry_classification();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_growth_stage ON competitor_analyses(growth_stage);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_position_type ON competitor_analyses(position_type);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_data_quality_score ON competitor_analyses(data_quality_score);

-- Update existing rows with default data_quality_score
UPDATE competitor_analyses
SET data_quality_score = 0
WHERE data_quality_score IS NULL;

-- Add not null constraint after setting defaults
ALTER TABLE competitor_analyses
ALTER COLUMN data_quality_score SET NOT NULL;

-- Create view for type-safe access
CREATE OR REPLACE VIEW v_competitor_analyses AS
SELECT 
  id,
  competitor_name,
  status,
  data,
  data_quality_score,
  growth_stage,
  position_type,
  value_proposition,
  industry_classification,
  industry_trends,
  market_trends,
  created_at,
  updated_at
FROM competitor_analyses
WHERE deleted_at IS NULL;

-- Add RLS policies
ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitor_analyses_select ON competitor_analyses
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM organization_members om 
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = competitor_analyses.organization_id
    )
  );
