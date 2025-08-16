-- Enhanced Prompt Flow Management System
-- Phase 1: Database Schema Enhancement

-- Create flow_definitions table for available application flows
CREATE TABLE IF NOT EXISTS flow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create prompt_flows table for flow-prompt assignments
CREATE TABLE IF NOT EXISTS prompt_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES flow_definitions(id) ON DELETE CASCADE,
  is_active_in_flow BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(prompt_id, flow_id)
);

-- Add flow-specific status tracking to prompts table (if not exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'flow_status') THEN
    ALTER TABLE prompts ADD COLUMN flow_status JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'total_flow_assignments') THEN
    ALTER TABLE prompts ADD COLUMN total_flow_assignments INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'active_flow_assignments') THEN
    ALTER TABLE prompts ADD COLUMN active_flow_assignments INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_prompt_flows_prompt_id ON prompt_flows(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_flows_flow_id ON prompt_flows(flow_id);
CREATE INDEX IF NOT EXISTS idx_prompt_flows_active ON prompt_flows(is_active_in_flow);
CREATE INDEX IF NOT EXISTS idx_prompt_flows_priority ON prompt_flows(priority DESC);
CREATE INDEX IF NOT EXISTS idx_flow_definitions_category ON flow_definitions(category);
CREATE INDEX IF NOT EXISTS idx_flow_definitions_active ON flow_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_prompts_flow_status ON prompts USING GIN(flow_status);

-- Enable RLS on new tables
ALTER TABLE flow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_flows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flow_definitions
CREATE POLICY "Super admin can manage flow definitions" 
ON flow_definitions FOR ALL 
USING (
  ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR 
  (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])) OR 
  (auth.role() = 'service_role'::text)
);

CREATE POLICY "Authenticated users can view flow definitions" 
ON flow_definitions FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- RLS Policies for prompt_flows
CREATE POLICY "Super admin can manage prompt flows" 
ON prompt_flows FOR ALL 
USING (
  ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text) OR 
  (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text])) OR 
  (auth.role() = 'service_role'::text)
);

CREATE POLICY "Authenticated users can view prompt flows" 
ON prompt_flows FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Create update triggers for timestamps
CREATE OR REPLACE FUNCTION update_prompt_flow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flow_definitions_updated_at
  BEFORE UPDATE ON flow_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_flow_updated_at();

CREATE TRIGGER update_prompt_flows_updated_at
  BEFORE UPDATE ON prompt_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_flow_updated_at();

-- Create function to update prompt flow counters
CREATE OR REPLACE FUNCTION update_prompt_flow_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counters for the affected prompt
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE prompts 
    SET 
      total_flow_assignments = (
        SELECT COUNT(*) 
        FROM prompt_flows 
        WHERE prompt_id = NEW.prompt_id
      ),
      active_flow_assignments = (
        SELECT COUNT(*) 
        FROM prompt_flows 
        WHERE prompt_id = NEW.prompt_id AND is_active_in_flow = true
      ),
      updated_at = now()
    WHERE id = NEW.prompt_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE prompts 
    SET 
      total_flow_assignments = (
        SELECT COUNT(*) 
        FROM prompt_flows 
        WHERE prompt_id = OLD.prompt_id
      ),
      active_flow_assignments = (
        SELECT COUNT(*) 
        FROM prompt_flows 
        WHERE prompt_id = OLD.prompt_id AND is_active_in_flow = true
      ),
      updated_at = now()
    WHERE id = OLD.prompt_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prompt_flow_counters
  AFTER INSERT OR UPDATE OR DELETE ON prompt_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_flow_counters();

-- Insert default flow definitions
INSERT INTO flow_definitions (name, description, category) VALUES
  ('competitor_analysis', 'Competitive intelligence and market analysis workflows', 'analysis'),
  ('market_research', 'Market research and validation workflows', 'research'),
  ('business_planning', 'Strategic planning and business model workflows', 'planning'),
  ('data_analysis', 'Data processing and analytics workflows', 'analytics'),
  ('content_generation', 'Content creation and marketing workflows', 'content'),
  ('customer_support', 'Customer service and support workflows', 'support')
ON CONFLICT (name) DO NOTHING;