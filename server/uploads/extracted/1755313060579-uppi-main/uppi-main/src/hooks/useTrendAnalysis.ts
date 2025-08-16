import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Local JSON type for safe jsonb inserts/updates
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface TrendAnalysisRequest {
  industry?: string;
  keywords?: string[];
  timeframe?: string;
}

interface TrendAnalysisResult {
  success: boolean;
  insights: string;
  error?: string;
}

export const useTrendAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeTrends = async (request: TrendAnalysisRequest): Promise<TrendAnalysisResult | null> => {
    setIsLoading(true);
    setError(null);

    // Prepare analysis run logging
    let runId: string | null = null;
    const startedAt = Date.now();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          // Use SECURITY DEFINER RPC to insert analysis_runs to avoid RLS 403s
          const sessionId = request?.timeframe || `trend_${Date.now()}`;
          const { data: newRunId, error: runErr } = await supabase.rpc('insert_analysis_run', {
            user_id_param: session.user.id,
            run_type_param: 'trend_analysis',
            session_id_param: sessionId,
            input_data_param: request as unknown as Json,
          });
          if (!runErr) runId = typeof newRunId === 'string' ? newRunId : null;
        } catch (e) {
          console.warn('analysis_runs insert failed (trend_analysis):', e);
        }
      }

      const { data, error: apiError } = await supabase.functions.invoke('analyze-trends', {
        body: request
      });

      if (apiError) {
        console.error('Trend analysis error:', apiError);
        
        // Update run status to failed
        if (runId) {
          await supabase.functions.invoke('update-analysis-run', {
            body: {
              action: 'fail',
              runId,
              errorMessage: apiError.message || 'Failed to analyze trends'
            }
          });
        }
        
        // Handle specific error cases
        if (apiError.message?.includes('API key')) {
          setError('OpenAI API key not configured. Please add your API key in Settings.');
          toast({
            title: 'API Key Required',
            description: 'Please configure your OpenAI API key in Settings to use trend analysis.',
            variant: 'destructive'
          });
        } else {
          setError(apiError.message || 'Failed to analyze trends');
          toast({
            title: 'Analysis Failed',
            description: apiError.message || 'Failed to analyze trends',
            variant: 'destructive'
          });
        }
        return null;
      }

      if (data?.success && data?.insights) {
        setResults(data.insights);
        toast({
          title: 'Analysis Complete',
          description: 'Trend analysis has been generated successfully.'
        });

        // Complete run
        if (runId) {
          const safeOutput = JSON.parse(JSON.stringify(data));
          await supabase.functions.invoke('update-analysis-run', {
            body: {
              action: 'complete',
              runId,
              outputData: safeOutput,
              executionTimeMs: Date.now() - startedAt
            }
          });
        }
        return data;
      } else {
        throw new Error(data?.error || 'No insights returned');
      }
    } catch (err: any) {
      console.error('Trend analysis error:', err);
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      // Fail run if we created one
      if (runId) {
        try {
          await supabase.functions.invoke('update-analysis-run', {
            body: {
              action: 'fail',
              runId,
              errorMessage: errorMessage
            }
          });
        } catch (e) {
          console.warn('analysis_runs fail update failed:', e);
        }
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return {
    analyzeTrends,
    isLoading,
    results,
    error,
    clearResults
  };
};