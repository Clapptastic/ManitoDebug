/**
 * Flow Management Service
 * Handles flow definitions, prompt assignments, and flow-aware operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface FlowDefinition {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface PromptFlowAssignment {
  id: string;
  prompt_id: string;
  flow_id: string;
  is_active_in_flow: boolean;
  priority: number;
  assigned_by: string | null;
  assigned_at: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface FlowAssignmentWithDetails extends PromptFlowAssignment {
  flow: FlowDefinition;
  prompt: {
    id: string;
    key: string;
    provider: string;
    domain: string;
    is_active: boolean;
  };
}

export interface PromptFlowStatus {
  prompt_id: string;
  total_assignments: number;
  active_assignments: number;
  status: 'active' | 'partial' | 'inactive' | 'unassigned';
  color: 'green' | 'yellow' | 'red' | 'gray';
  flows: Array<{
    flow_id: string;
    flow_name: string;
    is_active_in_flow: boolean;
  }>;
}

class FlowManagementService {
  /**
   * Get all available flow definitions
   */
  async getFlowDefinitions(): Promise<FlowDefinition[]> {
    const { data, error } = await supabase
      .from('flow_definitions')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching flow definitions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get active flow definitions only
   */
  async getActiveFlowDefinitions(): Promise<FlowDefinition[]> {
    const { data, error } = await supabase
      .from('flow_definitions')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching active flow definitions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get prompt assignments for a specific flow
   */
  async getFlowPromptAssignments(flowId: string): Promise<FlowAssignmentWithDetails[]> {
    const { data, error } = await supabase
      .from('prompt_flows')
      .select(`
        *,
        flow:flow_definitions(*),
        prompt:prompts(id, key, provider, domain, is_active)
      `)
      .eq('flow_id', flowId)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching flow prompt assignments:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get flow assignments for a specific prompt
   */
  async getPromptFlowAssignments(promptId: string): Promise<FlowAssignmentWithDetails[]> {
    const { data, error } = await supabase
      .from('prompt_flows')
      .select(`
        *,
        flow:flow_definitions(*),
        prompt:prompts(id, key, provider, domain, is_active)
      `)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompt flow assignments:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Assign a prompt to a flow
   */
  async assignPromptToFlow(
    promptId: string, 
    flowId: string, 
    options: {
      isActiveInFlow?: boolean;
      priority?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<PromptFlowAssignment> {
    const { data, error } = await supabase
      .from('prompt_flows')
      .upsert({
        prompt_id: promptId,
        flow_id: flowId,
        is_active_in_flow: options.isActiveInFlow ?? true,
        priority: options.priority ?? 0,
        metadata: (options.metadata ?? {}) as Json,
        assigned_by: (await supabase.auth.getUser()).data.user?.id || null,
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning prompt to flow:', error);
      throw error;
    }

    return data;
  }

  /**
   * Remove a prompt from a flow
   */
  async removePromptFromFlow(promptId: string, flowId: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_flows')
      .delete()
      .eq('prompt_id', promptId)
      .eq('flow_id', flowId);

    if (error) {
      console.error('Error removing prompt from flow:', error);
      throw error;
    }
  }

  /**
   * Toggle prompt activation status within a flow
   */
  async togglePromptInFlow(
    promptId: string, 
    flowId: string, 
    isActive: boolean
  ): Promise<PromptFlowAssignment> {
    const { data, error } = await supabase
      .from('prompt_flows')
      .update({ is_active_in_flow: isActive })
      .eq('prompt_id', promptId)
      .eq('flow_id', flowId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling prompt in flow:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get flow status for multiple prompts (for UI display)
   */
  async getPromptsFlowStatus(promptIds: string[]): Promise<Map<string, PromptFlowStatus>> {
    if (promptIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('prompt_flows')
      .select(`
        prompt_id,
        flow_id,
        is_active_in_flow,
        flow:flow_definitions(name)
      `)
      .in('prompt_id', promptIds);

    if (error) {
      console.error('Error fetching prompt flow status:', error);
      throw error;
    }

    const statusMap = new Map<string, PromptFlowStatus>();

    // Initialize status for all prompts
    promptIds.forEach(promptId => {
      statusMap.set(promptId, {
        prompt_id: promptId,
        total_assignments: 0,
        active_assignments: 0,
        status: 'unassigned',
        color: 'gray',
        flows: []
      });
    });

    // Process assignments
    data?.forEach(assignment => {
      const status = statusMap.get(assignment.prompt_id);
      if (status) {
        status.total_assignments++;
        if (assignment.is_active_in_flow) {
          status.active_assignments++;
        }
        status.flows.push({
          flow_id: assignment.flow_id,
          flow_name: assignment.flow?.name || 'Unknown',
          is_active_in_flow: assignment.is_active_in_flow
        });
      }
    });

    // Determine final status and color
    statusMap.forEach(status => {
      if (status.total_assignments === 0) {
        status.status = 'unassigned';
        status.color = 'gray';
      } else if (status.active_assignments === 0) {
        status.status = 'inactive';
        status.color = 'red';
      } else if (status.active_assignments === status.total_assignments) {
        status.status = 'active';
        status.color = 'green';
      } else {
        status.status = 'partial';
        status.color = 'yellow';
      }
    });

    return statusMap;
  }

  /**
   * Get flow-aware prompt by key (the critical method for execution)
   */
  async getPromptByKeyForFlow(
    key: string, 
    flowName: string
  ): Promise<{ 
    prompt: any; 
    source: 'flow-assigned' | 'fallback' | 'not-found';
    assignment?: PromptFlowAssignment;
  }> {
    try {
      // First, try to get prompt assigned to this specific flow
      const { data: flowAssignment, error: flowError } = await supabase
        .from('prompt_flows')
        .select(`
          *,
          prompt:prompts(*),
          flow:flow_definitions(*)
        `)
        .eq('prompt_flows.is_active_in_flow', true)
        .eq('flow_definitions.name', flowName)
        .eq('flow_definitions.is_active', true)
        .eq('prompts.key', key)
        .eq('prompts.is_active', true)
        .order('priority', { ascending: false })
        .limit(1)
        .single();

      if (!flowError && flowAssignment?.prompt) {
        return {
          prompt: flowAssignment.prompt,
          source: 'flow-assigned',
          assignment: flowAssignment
        };
      }

      // Fallback: get prompt by key without flow restriction
      const { data: fallbackPrompt, error: fallbackError } = await supabase
        .from('prompts')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .single();

      if (!fallbackError && fallbackPrompt) {
        return {
          prompt: fallbackPrompt,
          source: 'fallback'
        };
      }

      return {
        prompt: null,
        source: 'not-found'
      };

    } catch (error) {
      console.error(`Error getting prompt "${key}" for flow "${flowName}":`, error);
      return {
        prompt: null,
        source: 'not-found'
      };
    }
  }

  /**
   * Bulk assign prompts to a flow
   */
  async bulkAssignPromptsToFlow(
    promptIds: string[],
    flowId: string,
    options: {
      isActiveInFlow?: boolean;
      priority?: number;
    } = {}
  ): Promise<PromptFlowAssignment[]> {
    const assignments = promptIds.map(promptId => ({
      prompt_id: promptId,
      flow_id: flowId,
      is_active_in_flow: options.isActiveInFlow ?? true,
      priority: options.priority ?? 0,
      assigned_by: null, // Will be set by RLS
      assigned_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('prompt_flows')
      .upsert(assignments)
      .select();

    if (error) {
      console.error('Error bulk assigning prompts to flow:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Log flow execution for analytics
   */
  async logFlowExecution(
    flowName: string,
    promptKey: string,
    executionData: {
      success: boolean;
      source: 'flow-assigned' | 'fallback' | 'not-found';
      executionTimeMs: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      // This could be enhanced to store in a dedicated flow_execution_logs table
      // For now, we'll use the existing ai_prompt_logs with extended metadata
      await supabase.rpc('log_ai_prompt', {
        provider_param: 'system',
        model_param: 'flow-execution',
        prompt_param: `Flow: ${flowName}, Prompt: ${promptKey}`,
        prompt_length_param: promptKey.length,
        session_id_param: `flow-${flowName}`,
        status_param: executionData.success ? 'success' : 'error',
        metadata_param: {
          flow_name: flowName,
          prompt_key: promptKey,
          source: executionData.source,
          execution_time_ms: executionData.executionTimeMs,
          ...executionData.metadata
        }
      });
    } catch (error) {
      console.warn('Failed to log flow execution:', error);
      // Non-critical, don't throw
    }
  }
}

export const flowManagementService = new FlowManagementService();