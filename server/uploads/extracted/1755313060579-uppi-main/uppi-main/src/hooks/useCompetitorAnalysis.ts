import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Unified types for all competitor analysis operations
export interface CompetitorAnalysisData {
  id: string;
  user_id: string;
  session_id: string;
  status: string;
  progress_percentage: number;
  current_step?: string;
  total_competitors: number;
  analysis_type: string;
  options: Record<string, any>;
  analysis_data?: any;
  business_insights?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  // Legacy compatibility fields
  name?: string;
  description?: string;
  data?: any;
}

export interface AnalysisProgress {
  status: string;
  progress: number;
  currentStep: string;
  error?: string;
  // Legacy compatibility
  sessionId?: string;
  currentCompetitor?: string | null;
  completedCount?: number;
  totalCount?: number;
  results?: any[];
  statusMessage?: string;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  analysisId: string;
}

export interface UseCompetitorAnalysisReturn {
  // Core Analysis Management
  analyses: CompetitorAnalysisData[];
  currentAnalysis: CompetitorAnalysisData | null;
  isLoading: boolean;
  error: string | null;
  
  // Analysis Operations
  startAnalysis: (competitors: string[], options?: any) => Promise<string>;
  getAnalysis: (analysisId: string) => Promise<CompetitorAnalysisData | null>;
  deleteAnalysis: (analysisId: string) => Promise<void>;
  refreshAnalyses: () => Promise<void>;
  
  // Real-time Progress
  progress: AnalysisProgress | null;
  subscribeToProgress: (analysisId: string) => void;
  unsubscribeFromProgress: () => void;
  
  // Export Functionality
  exportAnalysis: (options: ExportOptions) => Promise<void>;
  
  // API Key Integration (embedded)
  apiKeyStatuses: Record<string, any>;
  hasWorkingApis: boolean;
  workingApis: string[];
  refreshApiKeyStatuses: () => Promise<void>;
  
  // Utility Functions
  getAnalysisBySession: (sessionId: string) => CompetitorAnalysisData | undefined;
  getRecentAnalyses: (limit?: number) => CompetitorAnalysisData[];
  getTotalAnalysisCount: () => number;
  
  // Legacy compatibility
  fetchAnalyses: () => Promise<void>;
  resetProgress: () => void;
  analysesLoading?: boolean;
  loading?: boolean;
  refreshAnalysis?: (id: string) => Promise<void>;
  updateAnalysis?: (id: string, updates: any) => Promise<void>;
}

/**
 * UNIFIED Competitor Analysis Hook
 * 
 * Single source of truth for all competitor analysis operations including:
 * - Analysis management and execution
 * - Real-time progress tracking
 * - Export functionality
 * - API key status integration
 * - Session management
 * 
 * Replaces: useUnifiedCompetitorAnalysis, useAnalysisProgress, useAnalysisExport
 */
export const useCompetitorAnalysis = (): UseCompetitorAnalysisReturn => {
  // Core State
  const [analyses, setAnalyses] = useState<CompetitorAnalysisData[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<CompetitorAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Progress State
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [progressSubscription, setProgressSubscription] = useState<any>(null);
  
  // API Key State (embedded)
  const [apiKeyStatuses, setApiKeyStatuses] = useState<Record<string, any>>({});

  // Initialize and load data
  useEffect(() => {
    loadAnalyses();
    loadApiKeyStatuses();
  }, []);

  // Core Analysis Operations
  const loadAnalyses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('competitor_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setAnalyses((data || []).map(item => ({
        ...item,
        progress_percentage: 100,
        total_competitors: 1,
        analysis_type: 'standard',
        options: {}
      })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analyses';
      setError(errorMessage);
      console.error('Error loading analyses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startAnalysis = useCallback(async (competitors: string[], options: any = {}): Promise<string> => {
    try {
      setError(null);
      
      // Call consolidated edge function
      const { data, error } = await supabase.functions.invoke('competitor-analysis-core', {
        body: {
          competitors,
          analysisType: options.analysisType || 'comprehensive',
          options: {
            includeFinancials: options.includeFinancials || false,
            includeSentiment: options.includeSentiment || false,
            deepDive: options.deepDive || false,
            ...options
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Analysis failed');
      }

      const sessionId = data?.sessionId;
      if (!sessionId) {
        throw new Error('No session ID returned from analysis');
      }

      toast({
        title: 'Analysis Started',
        description: `Started analyzing ${competitors.length} competitors`,
      });

      // Refresh analyses to include the new one
      await loadAnalyses();

      return sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start analysis';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [setError, loadAnalyses]);

  const getAnalysis = useCallback(async (analysisId: string): Promise<CompetitorAnalysisData | null> => {
    try {
      const { data, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('id', analysisId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? {
        ...data,
        progress_percentage: 100,
        total_competitors: 1,
        analysis_type: 'standard',
        options: {}
      } : null;
    } catch (err) {
      console.error('Error fetching analysis:', err);
      return null;
    }
  }, []);

  const deleteAnalysis = useCallback(async (analysisId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('competitor_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) {
        throw error;
      }

      // Update local state
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      
      if (currentAnalysis?.id === analysisId) {
        setCurrentAnalysis(null);
      }

      toast({
        title: 'Analysis Deleted',
        description: 'Analysis has been deleted successfully.',
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete analysis';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [currentAnalysis]);

  const refreshAnalyses = useCallback(async () => {
    await loadAnalyses();
  }, [loadAnalyses]);

  // Real-time Progress Management
  const subscribeToProgress = useCallback((analysisId: string) => {
    // Unsubscribe from previous subscription
    if (progressSubscription) {
      progressSubscription.unsubscribe();
    }

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`analysis_progress_${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'competitor_analyses',
          filter: `id=eq.${analysisId}`
        },
        (payload) => {
          const updatedAnalysis = payload.new as CompetitorAnalysisData;
          
          // Update progress state
          setProgress({
            status: updatedAnalysis.status,
            progress: updatedAnalysis.progress_percentage,
            currentStep: updatedAnalysis.current_step || '',
            error: updatedAnalysis.error_message || undefined
          });

          // Update current analysis
          setCurrentAnalysis(updatedAnalysis);

          // Update analyses list
          setAnalyses(prev => 
            prev.map(a => a.id === analysisId ? updatedAnalysis : a)
          );
        }
      )
      .subscribe();

    setProgressSubscription(subscription);

    // Also poll for updates as backup
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('competitor-analysis-core', {
          body: { action: 'progress', analysisId }
        });

        if (data && data.status) {
          setProgress({
            status: data.status,
            progress: data.progress_percentage || 0,
            currentStep: data.current_step || '',
            error: data.error_message || undefined
          });
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 2000);

    // Store interval for cleanup
    (subscription as any).pollInterval = pollInterval;
  }, [progressSubscription]);

  const unsubscribeFromProgress = useCallback(() => {
    if (progressSubscription) {
      progressSubscription.unsubscribe();
      
      // Clear polling interval
      if ((progressSubscription as any).pollInterval) {
        clearInterval((progressSubscription as any).pollInterval);
      }
      
      setProgressSubscription(null);
    }
    setProgress(null);
  }, [progressSubscription]);

  // Export Functionality
  const exportAnalysis = useCallback(async (options: ExportOptions) => {
    try {
      setError(null);

      const { data, error } = await supabase.functions.invoke('competitor-analysis-core', {
        body: {
          action: 'export',
          analysisId: options.analysisId,
          format: options.format
        }
      });

      if (error) {
        throw error;
      }

      // Handle different export formats
      if (options.format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `analysis-${options.analysisId}.json`);
      } else if (options.format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        downloadBlob(blob, `analysis-${options.analysisId}.csv`);
      }

      toast({
        title: 'Export Complete',
        description: `Analysis exported as ${options.format.toUpperCase()}`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export analysis';
      setError(errorMessage);
      toast({
        title: 'Export Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, []);

  // API Key Management Integration
  const loadApiKeyStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-key-manager', {
        body: { action: 'get_all_statuses' }
      });

      if (error) {
        throw error;
      }

      setApiKeyStatuses(data.statuses || {});
    } catch (err) {
      console.error('Error loading API key statuses:', err);
    }
  }, []);

  const refreshApiKeyStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('api-key-manager', {
        body: { action: 'refresh_all_statuses' }
      });

      if (error) {
        throw error;
      }

      // Reload statuses after refresh
      await loadApiKeyStatuses();

      toast({
        title: 'API Keys Refreshed',
        description: `Refreshed ${data.refreshedCount || 0} API keys`,
      });

    } catch (err) {
      console.error('Error refreshing API key statuses:', err);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh API key statuses',
        variant: 'destructive',
      });
    }
  }, [loadApiKeyStatuses]);

  // Utility Functions
  const getAnalysisBySession = useCallback((sessionId: string): CompetitorAnalysisData | undefined => {
    return analyses.find(a => a.session_id === sessionId);
  }, [analyses]);

  const getRecentAnalyses = useCallback((limit: number = 10): CompetitorAnalysisData[] => {
    return analyses.slice(0, limit);
  }, [analyses]);

  const getTotalAnalysisCount = useCallback((): number => {
    return analyses.length;
  }, [analyses]);

  // Legacy compatibility functions
  const fetchAnalyses = useCallback(async () => {
    await loadAnalyses();
  }, [loadAnalyses]);

  const resetProgress = useCallback(() => {
    setProgress(null);
    setCurrentAnalysis(null);
    unsubscribeFromProgress();
  }, [unsubscribeFromProgress]);

  // Computed values for API keys
  const workingApis = Object.keys(apiKeyStatuses).filter(api => apiKeyStatuses[api]?.isWorking);
  const hasWorkingApis = workingApis.length > 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromProgress();
    };
  }, [unsubscribeFromProgress]);

  return {
    // Core Analysis Management
    analyses,
    currentAnalysis,
    isLoading,
    error,
    
    // Analysis Operations
    startAnalysis,
    getAnalysis,
    deleteAnalysis,
    refreshAnalyses,
    
    // Real-time Progress
    progress,
    subscribeToProgress,
    unsubscribeFromProgress,
    
    // Export Functionality
    exportAnalysis,
    
    // API Key Integration
    apiKeyStatuses,
    hasWorkingApis,
    workingApis,
    refreshApiKeyStatuses,
    
    // Utility Functions
    getAnalysisBySession,
    getRecentAnalyses,
    getTotalAnalysisCount,
    
    // Legacy compatibility
    fetchAnalyses,
    resetProgress,
  };
};

/**
 * Helper function to download blob as file
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}