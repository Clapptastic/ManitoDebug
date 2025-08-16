import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BusinessToolUsage {
  id: string;
  tool_name: string;
  usage_count: number;
  last_used_at: string;
  user_id: string;
}

export const useBusinessToolsUsage = () => {
  const [toolsUsage, setToolsUsage] = useState<BusinessToolUsage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchToolsUsage = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('business_tools_usage')
        .select('*')
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      setToolsUsage(data || []);
    } catch (error) {
      console.error('Error fetching business tools usage:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch business tools usage',
        variant: 'destructive',
      });
    }
  }, []);

  const trackToolUsage = useCallback(async (toolName: string) => {
    try {
      setLoading(true);
      
      // Check if usage record exists
      const { data: existingUsage } = await supabase
        .from('business_tools_usage')
        .select('*')
        .eq('tool_name', toolName)
        .single();

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

        if (error) throw error;
      } else {
        // Create new record
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        const { error } = await supabase
          .from('business_tools_usage')
          .insert({
            tool_name: toolName,
            usage_count: 1,
            last_used_at: new Date().toISOString(),
            user_id: user.id
          });

        if (error) throw error;
      }

      await fetchToolsUsage();
      
      toast({
        title: 'Tool Accessed',
        description: `${toolName} usage has been tracked`,
      });
    } catch (error) {
      console.error('Error tracking tool usage:', error);
      toast({
        title: 'Error',
        description: 'Failed to track tool usage',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchToolsUsage]);

  const getToolUsage = useCallback((toolName: string): BusinessToolUsage | undefined => {
    return toolsUsage.find(usage => usage.tool_name === toolName);
  }, [toolsUsage]);

  useEffect(() => {
    fetchToolsUsage();
  }, [fetchToolsUsage]);

  return {
    toolsUsage,
    loading,
    trackToolUsage,
    getToolUsage,
    refreshUsage: fetchToolsUsage
  };
};