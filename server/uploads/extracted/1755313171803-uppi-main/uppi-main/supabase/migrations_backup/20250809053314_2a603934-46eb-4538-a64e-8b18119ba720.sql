-- Add specific columns for market position performance, technology innovation, and customer journey
ALTER TABLE competitor_analyses 
ADD COLUMN IF NOT EXISTS market_position_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS technology_innovation_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS customer_journey_data jsonb DEFAULT '{}';

-- Create index for better performance on these new fields
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_market_position ON competitor_analyses USING gin(market_position_data);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_technology_innovation ON competitor_analyses USING gin(technology_innovation_data);
CREATE INDEX IF NOT EXISTS idx_competitor_analyses_customer_journey ON competitor_analyses USING gin(customer_journey_data);