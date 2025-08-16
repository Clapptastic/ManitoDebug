-- Fix security warnings by recreating functions with proper search_path
-- Handle trigger dependencies properly

-- Drop triggers first
DROP TRIGGER IF EXISTS update_flow_definitions_updated_at ON flow_definitions;
DROP TRIGGER IF EXISTS update_prompt_flows_updated_at ON prompt_flows;
DROP TRIGGER IF EXISTS trigger_update_prompt_flow_counters ON prompt_flows;

-- Drop functions
DROP FUNCTION IF EXISTS update_prompt_flow_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_prompt_flow_counters() CASCADE;

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION update_prompt_flow_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_prompt_flow_counters()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

-- Recreate triggers
CREATE TRIGGER update_flow_definitions_updated_at
  BEFORE UPDATE ON flow_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_flow_updated_at();

CREATE TRIGGER update_prompt_flows_updated_at
  BEFORE UPDATE ON prompt_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_flow_updated_at();

CREATE TRIGGER trigger_update_prompt_flow_counters
  AFTER INSERT OR UPDATE OR DELETE ON prompt_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_prompt_flow_counters();