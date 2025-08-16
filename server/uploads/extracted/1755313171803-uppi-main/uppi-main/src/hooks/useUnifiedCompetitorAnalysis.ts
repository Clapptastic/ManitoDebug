/**
 * UNIFIED Competitor Analysis Hook
 * Stage 4: Frontend Consolidation - Simplified and unified hook
 */

import { useState, useCallback, useEffect } from 'react';
import { unifiedCompetitorAnalysisService } from '@/services/competitor-analysis/unified';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type {
  CompetitorAnalysis,
  SavedAnalysis,
  CompetitorAnalysisResult
} from '@/types/competitor-analysis';

export interface UnifiedAnalysisProgress {
  sessionId: string;
  status: 'idle' | 'starting' | 'analyzing' | 'completed' | 'error';
  currentCompetitor: string | null;
  completedCount: number;
  totalCount: number;
  results: CompetitorAnalysisResult[];
  error: string | null;
  progress: number;
  statusMessage: string;
}

/**
 * Unified Competitor Analysis Hook
 * Single source of truth for all competitor analysis operations
 */
export const useUnifiedCompetitorAnalysis = () => {
  const [progress, setProgress] = useState<UnifiedAnalysisProgress>({
    sessionId: '',
    status: 'idle',
    currentCompetitor: null,
    completedCount: 0,
    totalCount: 0,
    results: [],
    error: null,
    progress: 0,
    statusMessage: ''
  });

  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time progress subscription
  useEffect(() => {
    if (!progress.sessionId) return;

    const channel = supabase
      .channel(`unified-analysis-progress-${progress.sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'competitor_analysis_progress',
          filter: `session_id=eq.${progress.sessionId}`
        },
        (payload) => {
          const newProgress = payload.new as any;
          setProgress(prev => ({
            ...prev,
            status: newProgress.status === 'completed' ? 'completed' : 'analyzing',
            progress: newProgress.progress_percentage || 0,
            currentCompetitor: newProgress.current_competitor || null,
            completedCount: newProgress.completed_competitors || 0,
            statusMessage: newProgress.status
          }));

          if (newProgress.status === 'completed') {
            fetchAnalyses();
            toast({
              title: 'Analysis Complete',
              description: 'Your competitor analysis has finished successfully.'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [progress.sessionId]);

  const fetchAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await unifiedCompetitorAnalysisService.getAnalyses();
      setAnalyses(data);
    } catch (error: any) {
      console.error('Error fetching analyses:', error);
      if (!error.message?.includes('not authenticated')) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const startAnalysis = useCallback(async (
    competitors: string[],
    providersSelected?: string[],
    models?: Record<string, string>
  ) => {
    const sessionId = `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      setProgress(prev => ({
        ...prev,
        sessionId,
        status: 'starting',
        totalCount: competitors.length,
        completedCount: 0,
        results: [],
        error: null,
        currentCompetitor: competitors[0] || null,
        statusMessage: 'Initializing analysis...'
      }));

      setLoading(true);

      const results = await unifiedCompetitorAnalysisService.startAnalysis(
        sessionId,
        competitors,
        providersSelected || [],
        models || {}
      );

      if (results?.length > 0) {
        setProgress(prev => ({
          ...prev,
          status: 'completed',
          results,
          completedCount: competitors.length,
          currentCompetitor: null,
          statusMessage: 'Analysis completed'
        }));
      } else {
        setProgress(prev => ({
          ...prev,
          status: 'analyzing',
          statusMessage: 'Analysis in progress...'
        }));
      }

      await fetchAnalyses();
      return results;
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      setProgress(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));

      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to start analysis',
        variant: 'destructive'
      });

      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchAnalyses]);

  const saveAnalysis = useCallback(async (
    name: string,
    description: string,
    results: CompetitorAnalysisResult[]
  ) => {
    try {
      const savedAnalysis = await unifiedCompetitorAnalysisService.saveAnalysis(
        progress.sessionId || `save-${Date.now()}`,
        {
          analysis_data: results,
          name,
          description
        }
      );
      
      await fetchAnalyses();
      
      toast({
        title: 'Analysis Saved',
        description: 'Your analysis has been saved successfully'
      });
      
      return savedAnalysis;
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save analysis',
        variant: 'destructive'
      });
      throw error;
    }
  }, [progress.sessionId, fetchAnalyses]);

  const deleteAnalysis = useCallback(async (id: string) => {
    try {
      await unifiedCompetitorAnalysisService.deleteAnalysis(id);
      await fetchAnalyses();
      
      toast({
        title: 'Analysis Deleted',
        description: 'Analysis has been removed'
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete analysis',
        variant: 'destructive'
      });
      throw error;
    }
  }, [fetchAnalyses]);

  const exportAnalysis = useCallback(async (analysis: SavedAnalysis) => {
    try {
      await unifiedCompetitorAnalysisService.exportAnalysis(analysis.id);
      
      toast({
        title: 'Analysis Exported',
        description: 'CSV file has been downloaded'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export analysis',
        variant: 'destructive'
      });
      throw error;
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      sessionId: '',
      status: 'idle',
      currentCompetitor: null,
      completedCount: 0,
      totalCount: 0,
      results: [],
      error: null,
      progress: 0,
      statusMessage: ''
    });
  }, []);

  return {
    progress,
    analyses,
    loading,
    error,
    startAnalysis,
    fetchAnalyses,
    saveAnalysis,
    deleteAnalysis,
    exportAnalysis,
    resetProgress
  };
};