import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProgressUpdate {
  sessionId: string;
  totalCompetitors: number;
  completedCompetitors: number;
  currentCompetitor?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progressPercentage: number;
  errorMessage?: string;
  metadata?: any;
}

export interface AnalysisResults {
  [competitorName: string]: {
    success: boolean;
    data?: any;
    error?: string;
    cost?: number;
    qualityScore?: number;
  };
}

class CompetitorProgressService {
  private currentSessionId: string | null = null;

  async initializeProgress(totalCompetitors: number, competitors: string[]): Promise<string> {
    try {
      const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: progressId, error } = await supabase.rpc('insert_competitor_analysis_progress', {
        session_id_param: sessionId,
        user_id_param: user.id,
        total_competitors_param: totalCompetitors,
        metadata_param: { competitors, startTime: new Date().toISOString() }
      });

      if (error) throw error;
      this.currentSessionId = sessionId;
      return sessionId;
    } catch (error) {
      console.error('Error initializing progress:', error);
      throw error;
    }
  }

  async updateProgress(update: Partial<ProgressUpdate>): Promise<void> {
    if (!this.currentSessionId) {
      throw new Error('No active session for progress updates');
    }

    try {
      const { error } = await supabase.rpc('update_competitor_analysis_progress', {
        session_id_param: this.currentSessionId,
        completed_competitors_param: update.completedCompetitors,
        current_competitor_param: update.currentCompetitor,
        progress_percentage_param: update.progressPercentage,
        status_param: update.status,
        error_message_param: update.errorMessage,
        metadata_param: update.metadata
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  async completeProgress(results: AnalysisResults): Promise<void> {
    if (!this.currentSessionId) {
      throw new Error('No active session to complete');
    }

    try {
      const totalCompetitors = Object.keys(results).length;
      const successfulAnalyses = Object.values(results).filter(r => r.success).length;

      await this.updateProgress({
        completedCompetitors: totalCompetitors,
        progressPercentage: 100,
        status: 'completed',
        metadata: {
          results,
          completedAt: new Date().toISOString(),
          successRate: (successfulAnalyses / totalCompetitors) * 100
        }
      });

      this.currentSessionId = null;

      toast({
        title: 'Analysis Complete',
        description: `Successfully analyzed ${successfulAnalyses}/${totalCompetitors} competitors`,
      });
    } catch (error) {
      console.error('Error completing progress:', error);
      throw error;
    }
  }

  async failProgress(error: string, currentCompetitor?: string): Promise<void> {
    if (!this.currentSessionId) {
      throw new Error('No active session to fail');
    }

    try {
      await this.updateProgress({
        status: 'failed',
        errorMessage: error,
        currentCompetitor,
        metadata: {
          failedAt: new Date().toISOString(),
          error
        }
      });

      this.currentSessionId = null;

      toast({
        title: 'Analysis Failed',
        description: error,
        variant: 'destructive',
      });
    } catch (err) {
      console.error('Error failing progress:', err);
      throw err;
    }
  }

  async logPerformanceMetric(
    sessionId: string,
    competitorName: string,
    executionTime: number,
    cost: number,
    qualityScore: number
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('api_usage_costs')
        .insert({
          user_id: user.id,
          provider: 'analysis',
          service: 'competitor_analysis',
          cost_usd: cost,
          response_time_ms: executionTime,
          metadata: {
            sessionId,
            competitorName,
            qualityScore,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging performance metric:', error);
    }
  }

  async subscribeToProgress(
    sessionId: string,
    callback: (progress: ProgressUpdate) => void
  ): Promise<() => void> {
    try {
      const subscription = supabase
        .channel(`progress-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'competitor_analysis_progress',
            filter: `session_id=eq.${sessionId}`
          },
          (payload) => {
            const progress = payload.new as any;
            const mapped: ProgressUpdate = {
              sessionId: progress.session_id,
              totalCompetitors: progress.total_competitors,
              completedCompetitors: progress.completed_competitors,
              currentCompetitor: progress.current_competitor,
              status: progress.status,
              progressPercentage: progress.progress_percentage,
              errorMessage: progress.error_message,
              metadata: progress.metadata
            };
            // Debug: print progress % complete
            console.log(`[Competitor Analysis] Progress: ${mapped.progressPercentage}% complete`);
            callback(mapped);
          }
        )
        .subscribe();

      // Immediately fetch current progress once
      try {
        const { data, error } = await supabase
          .from('competitor_analysis_progress')
          .select('*')
          .eq('session_id', sessionId)
          .order('updated_at', { ascending: false })
          .limit(1);
        if (!error && data && data.length > 0) {
          const p = data[0] as any;
          const mapped: ProgressUpdate = {
            sessionId: p.session_id,
            totalCompetitors: p.total_competitors,
            completedCompetitors: p.completed_competitors,
            currentCompetitor: p.current_competitor,
            status: p.status,
            progressPercentage: p.progress_percentage,
            errorMessage: p.error_message,
            metadata: p.metadata
          };
          console.log(`[Competitor Analysis] Progress: ${mapped.progressPercentage}% complete`);
          callback(mapped);
        }
      } catch (e) {
        console.error('Error fetching initial progress:', e);
      }

      return () => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    } catch (error) {
      console.error('Error subscribing to progress:', error);
      throw error;
    }
  }
}

export const competitorProgressService = new CompetitorProgressService();