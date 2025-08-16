
-- Update competitor_analyses table to match new type definitions
ALTER TABLE competitor_analyses
ADD COLUMN IF NOT EXISTS swot_analysis jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotional_efforts text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS api_attribution_info jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS api_sources jsonb DEFAULT NULL;

-- Add indices for better query performance
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_competitor_name 
ON competitor_analyses(competitor_name);

CREATE INDEX IF NOT EXISTS idx_competitor_analyses_user_id 
ON competitor_analyses(user_id);

-- Add validation checks
ALTER TABLE competitor_analyses 
ADD CONSTRAINT check_growth_stage 
CHECK (growth_stage::text IN ('startup', 'growth', 'mature', 'decline'));

ALTER TABLE competitor_analyses 
ADD CONSTRAINT check_position_type 
CHECK (position_type::text IN ('leader', 'challenger', 'follower', 'niche'));

ALTER TABLE competitor_analyses 
ADD CONSTRAINT check_status 
CHECK (status::text IN ('pending', 'in_progress', 'completed', 'failed'));
