import { useState, useEffect, useCallback } from 'react';
import { flowManagementService, type PromptFlowStatus } from '@/services/flowManagementService';

interface UseFlowStatusOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useFlowStatus(promptIds: string[], options: UseFlowStatusOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [flowStatusMap, setFlowStatusMap] = useState<Map<string, PromptFlowStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadFlowStatus = useCallback(async () => {
    if (promptIds.length === 0) {
      setFlowStatusMap(new Map());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const statusMap = await flowManagementService.getPromptsFlowStatus(promptIds);
      setFlowStatusMap(statusMap);
    } catch (err) {
      console.error('Error loading flow status:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [promptIds]);

  // Load status when prompt IDs change
  useEffect(() => {
    loadFlowStatus();
  }, [loadFlowStatus]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || promptIds.length === 0) return;

    const interval = setInterval(loadFlowStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadFlowStatus]);

  const getFlowStatus = useCallback((promptId: string): PromptFlowStatus | undefined => {
    return flowStatusMap.get(promptId);
  }, [flowStatusMap]);

  const refreshStatus = useCallback(() => {
    return loadFlowStatus();
  }, [loadFlowStatus]);

  return {
    flowStatusMap,
    loading,
    error,
    getFlowStatus,
    refreshStatus
  };
}