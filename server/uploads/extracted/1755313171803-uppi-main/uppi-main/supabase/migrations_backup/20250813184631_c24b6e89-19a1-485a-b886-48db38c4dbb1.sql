-- Fix security warnings for function search path
-- Update functions to have proper search_path setting

DROP FUNCTION IF EXISTS update_prompt_flow_updated_at();
CREATE OR REPLACE FUNCTION update_prompt_flow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS update_prompt_flow_counters();
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;