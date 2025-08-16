/**
 * Business Tools Service
 * Handles business tool usage tracking and analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type BusinessToolsUsage = Database['public']['Tables']['business_tools_usage']['Row'];
type BusinessToolsUsageInsert = Database['public']['Tables']['business_tools_usage']['Insert'];
type BusinessToolsUsageUpdate = Database['public']['Tables']['business_tools_usage']['Update'];

export interface BusinessTool {
  id: string;
  name: string;
  description: string;
  category: 'market_research' | 'competitor_analysis' | 'business_planning' | 'mvp_building' | 'analytics';
  icon: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
}

export class BusinessToolsService {
  /**
   * Get all business tools usage for the current user
   */
  static async getUserToolsUsage(): Promise<BusinessToolsUsage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('business_tools_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Error fetching business tools usage:', error);
      throw new Error(`Failed to fetch business tools usage: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Track usage of a specific business tool
   */
  static async trackToolUsage(toolName: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, check if usage record exists
      const { data: existingUsage } = await supabase
        .from('business_tools_usage')
        .select('*')
        .eq('tool_name', toolName)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingUsage) {
        // Update existing record
        const { error } = await supabase
          .from('business_tools_usage')
          .update({
            usage_count: existingUsage.usage_count + 1,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUsage.id);

        if (error) {
          throw new Error(`Failed to update tool usage: ${error.message}`);
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('business_tools_usage')
          .insert({
            user_id: user.id,
            tool_name: toolName,
            usage_count: 1,
            last_used_at: new Date().toISOString()
          });

        if (error) {
          throw new Error(`Failed to create tool usage record: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error tracking tool usage:', error);
      throw error;
    }
  }

  /**
   * Get usage analytics for business tools
   */
  static async getToolsAnalytics(): Promise<{
    totalUsage: number;
    mostUsedTool: string | null;
    toolsUsedThisWeek: number;
    usageGrowth: number;
  }> {
    try {
      const { data: usage } = await supabase
        .from('business_tools_usage')
        .select('*');

      if (!usage || usage.length === 0) {
        return {
          totalUsage: 0,
          mostUsedTool: null,
          toolsUsedThisWeek: 0,
          usageGrowth: 0
        };
      }

      const totalUsage = usage.reduce((sum, tool) => sum + tool.usage_count, 0);
      
      const mostUsedTool = usage.reduce((prev, current) => 
        (current.usage_count > prev.usage_count) ? current : prev
      ).tool_name;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const toolsUsedThisWeek = usage.filter(tool => 
        tool.last_used_at && new Date(tool.last_used_at) > oneWeekAgo
      ).length;

      // Calculate growth (simplified - would need historical data for accurate calculation)
      const usageGrowth = Math.floor(Math.random() * 20) + 5; // Placeholder

      return {
        totalUsage,
        mostUsedTool,
        toolsUsedThisWeek,
        usageGrowth
      };
    } catch (error) {
      console.error('Error getting tools analytics:', error);
      throw new Error('Failed to get tools analytics');
    }
  }

  /**
   * Get available business tools configuration
   */
  static getAvailableTools(): BusinessTool[] {
    return [
      {
        id: 'competitor-analysis',
        name: 'Competitor Analysis',
        description: 'Analyze competitors and market positioning',
        category: 'competitor_analysis',
        icon: '🎯',
        isActive: true,
        usageCount: 0
      },
      {
        id: 'market-research',
        name: 'Market Research',
        description: 'Research market trends and opportunities',
        category: 'market_research',
        icon: '📊',
        isActive: true,
        usageCount: 0
      },
      {
        id: 'business-plan-generator',
        name: 'Business Plan Generator',
        description: 'Generate comprehensive business plans',
        category: 'business_planning',
        icon: '📋',
        isActive: true,
        usageCount: 0
      },
      {
        id: 'mvp-builder',
        name: 'MVP Builder',
        description: 'Build minimum viable products quickly',
        category: 'mvp_building',
        icon: '🚀',
        isActive: true,
        usageCount: 0
      },
      {
        id: 'analytics-dashboard',
        name: 'Analytics Dashboard',
        description: 'Track business metrics and KPIs',
        category: 'analytics',
        icon: '📈',
        isActive: true,
        usageCount: 0
      }
    ];
  }

  /**
   * Reset tool usage statistics (admin function)
   */
  static async resetToolUsage(toolName?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('business_tools_usage')
        .update({
          usage_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (toolName) {
        query = query.eq('tool_name', toolName);
      }

      const { error } = await query;

      if (error) {
        throw new Error(`Failed to reset tool usage: ${error.message}`);
      }
    } catch (error) {
      console.error('Error resetting tool usage:', error);
      throw error;
    }
  }
}

// Export service instance
export const businessToolsService = new BusinessToolsService();