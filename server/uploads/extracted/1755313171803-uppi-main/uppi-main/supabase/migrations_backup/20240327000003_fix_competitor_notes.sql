
-- Add required fields to competitor_notes
ALTER TABLE competitor_notes
ADD COLUMN IF NOT EXISTS important boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Update competitor_analyses table to match our types
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS swot_analysis jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS leadership jsonb[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS api_sources jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS api_attribution_info jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS business_model text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS competitive_advantage text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS growth_stage text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS position_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS value_proposition text DEFAULT NULL;

-- Add new indices for performance
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_competitor_name ON competitor_analyses(competitor_name);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_id_competitor_name ON competitor_analyses(user_id, competitor_name);
