/**
 * SINGLE SOURCE OF TRUTH: Unified Competitor Analysis Service
 * Phase 1.3 Remediation: Consolidated all competitor analysis functionality
 * 
 * This service consolidates all competitor analysis operations into a single,
 * reliable service with proper error handling, caching, and resilience patterns.
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ApiKeyData } from '@/types/api';
import { retryWithJitter, getCircuitBreaker, ensureRateLimit } from '@/utils/resilience';
import type { ApiKeyType } from '@/types/api-keys/unified';
import type { CompetitorAnalysis, SavedAnalysis, CompetitorAnalysisResult } from '@/types/competitor-analysis';
import { profile } from '@/lib/observability/profiler';

/**
 * UNIFIED COMPETITOR ANALYSIS SERVICE
 * Single source of truth for all competitor analysis operations
 */
export class UnifiedCompetitorAnalysisService {
  private cache = new Map<string, any>();
  private progressSubscriptions = new Map<string, (data: any) => void>();

  /**
   * Get all competitor analyses for the authenticated user
   */
  async getAnalyses(): Promise<CompetitorAnalysis[]> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        console.warn('User not authenticated, cannot fetch analyses');
        return [];
      }

      console.log('Fetching analyses for authenticated user:', session.user.id);

      const { data, error } = await retryWithJitter(
        async () => await profile<{ data: any[]; error: any }>(
          'rpc:get_user_competitor_analyses',
          () => (supabase.rpc('get_user_competitor_analyses', { user_id_param: session.user.id }) as unknown as Promise<{ data: any[]; error: any }>),
          { userId: session.user.id }
        ),
        { retries: 2, baseMs: 150, maxMs: 1200 }
      ) as { data: any[]; error: any };

      if (error) {
        console.error('Database error fetching analyses:', error);
        // If we get permission denied, return empty array instead of throwing
        if (error.code === '42501' || error.message.includes('permission denied')) {
          console.warn('Permission denied accessing competitor_analyses');
          return [];
        }
        throw new Error(`Failed to fetch analyses: ${error.message}`);
      }
      
      console.log('Successfully fetched', data?.length || 0, 'analyses');
      return data || [];
    } catch (error) {
      console.error('Error fetching analyses:', error);
      // Don't throw error for auth issues, just return empty array
      if (error instanceof Error && (error.message.includes('permission denied') || error.message.includes('42501'))) {
        console.warn('Permission denied - user likely not authenticated properly');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get a specific competitor analysis by ID
   */
  async getAnalysisById(id: string): Promise<CompetitorAnalysis | null> {
    try {
      // Check cache first
      const cacheKey = `analysis_${id}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('User not authenticated, cannot fetch analysis');
        return null;
      }

      const { data, error } = await profile<{ data: any[]; error: any }>(
        'rpc:get_user_competitor_analyses',
        () => (supabase.rpc('get_user_competitor_analyses', { user_id_param: session.user.id }) as unknown as Promise<{ data: any[]; error: any }>),
        { userId: session.user.id }
      );

      if (error) {
        console.error('Error fetching analysis:', error);
        return null;
      }

      // Find the specific analysis by id
      const analysis = data?.find((analysis: any) => analysis.id === id || analysis.analysis_id === id);
      if (!analysis) return null;

      // Enrich with combined aggregation if available
      try {
        const { data: combined, error: combinedError } = await supabase
          .from('analysis_combined')
          .select('aggregated_result, provenance_map, field_scores, filled_from_master, overall_confidence')
          .eq('analysis_id', analysis.id ?? id)
          .maybeSingle();
          
        if (combinedError) {
          console.warn('Combined analysis access error (non-fatal):', combinedError);
        } else if (combined?.aggregated_result) {
          analysis.analysis_data = {
            combined: combined.aggregated_result,
            provenance_map: combined.provenance_map,
            field_scores: combined.field_scores,
            filled_from_master: combined.filled_from_master,
            overall_confidence: combined.overall_confidence,
            raw: analysis.analysis_data,
          };
        }
      } catch (e) {
        console.warn('Combined analysis not available (non-fatal):', e);
      }

      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis || null;
    } catch (error) {
      console.error('Error fetching analysis:', error);
      return null;
    }
  }

  /**
   * Start a new competitor analysis
   */
  async startAnalysis(sessionId: string, competitors: string[], providersSelected?: string[], models?: Record<string, string>): Promise<any> {
    try {
      // Clear any cached data for this session
      this.cache.delete(`session_${sessionId}`);

      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        throw new Error('Authentication required. Please log in to start analysis.');
      }

      const user = session.user;
      console.log('🔐 Authenticated user for analysis:', user.id);

      // Validate API key requirements before starting
      const apiKeyCheck = await this.checkApiKeyRequirements();
      if (!apiKeyCheck.hasRequiredKeys) {
        throw new Error(`Missing required API keys: ${apiKeyCheck.missingKeys.join(', ')}. Please add them in Settings.`);
      }

      // Determine providers to use (use all available if none explicitly provided)
      const selectedProviders = (providersSelected && providersSelected.length > 0)
        ? providersSelected
        : await this.getAvailableProviders();

      // Preflight cost check to enforce per-user limits
      try {
        const projectedCostPerProvider = 0.02; // USD estimate per provider per competitor
        const projected_cost_param = (competitors?.length || 0) * (selectedProviders?.length || 0) * projectedCostPerProvider;
        const { data: costCheck, error: costErr } = await supabase.rpc('check_user_cost_allowed', {
          user_id_param: user.id,
          projected_cost_param,
        });
        if (costErr) {
          console.warn('Cost preflight failed (non-fatal):', costErr);
        } else if (costCheck && (costCheck as any).allowed === false) {
          const remaining = (costCheck as any).remaining ?? 0;
          const monthly = (costCheck as any).monthly_limit ?? 0;
          throw new Error(`Projected cost exceeds remaining budget (remaining: $${remaining.toFixed?.(2) ?? remaining} of $${monthly}).`);
        }
      } catch (pfErr) {
        console.warn('check_user_cost_allowed exception (non-fatal):', pfErr);
      }

      // Central gate check before proceeding
      try {
        const { data: gateData, error: gateErr } = await supabase.functions.invoke('competitor-analysis-gate', {
          body: { action: 'check', providersSelected: selectedProviders }
        });
        if (gateErr) {
          console.warn('Gate check failed, proceeding with fallback:', gateErr);
        } else {
          const gate = gateData as any;
          if (!gate?.can_proceed) {
            const reasons = Array.isArray(gate?.reasons) ? gate.reasons.join(', ') : 'Gate denied';
            throw new Error(`Cannot start analysis: ${reasons}`);
          }
        }
      } catch (gateError) {
        // If gate call itself fails (non-2xx), proceed with fallback since keys are validated above
        console.warn('Gate check exception, proceeding with fallback', gateError);
      }

      // Create progress tracking entry using RPC function
      const { data: progressId, error: progressErr } = await supabase.rpc('insert_competitor_analysis_progress', {
        session_id_param: sessionId,
        user_id_param: user.id,
        total_competitors_param: competitors.length,
        metadata_param: { competitors, providersSelected: selectedProviders }
      });

      if (progressErr || !progressId) {
        throw new Error('Failed to create progress tracking entry');
      }

      // Create analysis run log (keep last 5 per type via DB trigger)
      const startedAtMs = Date.now();
      let runId: string | null = null;
      try {
        // Use SECURITY DEFINER RPC to insert analysis_runs to avoid RLS edge-case 403s
        const { data: newRunId, error: runErr } = await supabase.rpc('insert_analysis_run', {
          user_id_param: user.id,
          run_type_param: 'competitor_analysis',
          session_id_param: sessionId,
          input_data_param: { competitors, providersSelected }
        });
        if (runErr) {
          console.warn('insert_analysis_run RPC failed:', runErr);
        }
        runId = (typeof newRunId === 'string' ? newRunId : null);
      } catch (e) {
        console.warn('insert_analysis_run RPC exception:', e);
      }

      console.log('🚀 Starting competitor analysis with sessionId:', sessionId);

      // Apply rate limit, circuit breaker, and retry around the edge function call
      await ensureRateLimit('edge:competitor-analysis', { limit: 5, intervalMs: 10_000 });
      const circuit = getCircuitBreaker('edge:competitor-analysis', { failureThreshold: 3, cooldownMs: 15_000 });

      const { data, error } = await circuit.execute(() =>
        retryWithJitter(
            () =>
              supabase.functions.invoke('competitor-analysis', {
                body: { sessionId, competitors, action: 'start', providersSelected: selectedProviders, models },
              }),
          { retries: 2, baseMs: 200, maxMs: 1500 }
        )
      );

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Analysis failed: ${error.message}`);
      }

      // Update analysis run log as completed
      if (runId) {
        const execMs = Date.now() - startedAtMs;
        const safeOutput = JSON.parse(JSON.stringify(data ?? {}));
        try {
          // Use edge function to update analysis run with admin privileges
          await supabase.functions.invoke('update-analysis-run', {
            body: {
              action: 'complete',
              runId,
              outputData: safeOutput,
              executionTimeMs: execMs
            }
          });
        } catch (e) {
          console.warn('analysis_runs completion update failed:', e);
        }
      }

      console.log('✅ Analysis started successfully');

      // Persist or update saved analysis for this session so the Details page has data
      try {
        const payload = (data as any)?.results ?? data;
        await this.saveAnalysis(sessionId, {
          analysis_data: payload as any,
          name: competitors?.[0],
        } as any);
      } catch (persistErr) {
        console.warn('saveAnalysis after start failed (non-fatal):', persistErr);
      }

      return data;
    } catch (error) {
      console.error('Error starting analysis:', error);

      // Update progress to failed state using RPC function
      try {
        await supabase.rpc('update_competitor_analysis_progress', {
          session_id_param: sessionId,
          status_param: 'failed',
          error_message_param: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (updateError) {
        console.error('Failed to update progress status:', updateError);
      }

      // Also mark analysis run as failed if one exists for this session
      try {
        const { data: latestRun } = await supabase
          .from('analysis_runs')
          .select('id')
          .eq('session_id', sessionId)
          .eq('run_type', 'competitor_analysis')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestRun?.id) {
          const startTime = Date.now();
          await supabase.functions.invoke('update-analysis-run', {
            body: {
              action: 'fail',
              runId: latestRun.id,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              executionTimeMs: startTime - Date.now()
            }
          });
        }
      } catch (e) {
        console.warn('analysis_runs failure update failed:', e);
      }

      throw error;
    }
  }

  /**
   * Save or update a competitor analysis
   */
  async saveAnalysis(sessionId: string, analysisData: Partial<CompetitorAnalysis>): Promise<CompetitorAnalysis> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Get existing analyses to check if one exists for this session
      const existingAnalyses = await this.getAnalyses();
      const existingAnalysis = existingAnalyses.find(analysis => analysis.session_id === sessionId);

      let result;
      
      if (existingAnalysis) {
        // Update using edge function or RPC if available, otherwise fall back to direct update
        try {
          const { data, error } = await supabase
            .from('competitor_analyses')
            .update({
              analysis_data: analysisData.analysis_data,
              name: analysisData.name || 'Saved Analysis',
              description: analysisData.description,
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', existingAnalysis.id)
            .eq('user_id', session.user.id)
            .select()
            .maybeSingle();

          if (error) throw error;
          result = data;
        } catch (error) {
          console.error('Failed to update analysis:', error);
          throw error;
        }
      } else {
        // Create new analysis entry using direct insert
        try {
          const { data, error } = await supabase
            .from('competitor_analyses')
            .insert({
              name: analysisData.name || 'New Analysis',
              analysis_data: analysisData.analysis_data || {},
              session_id: sessionId,
              status: 'completed',
              completed_at: new Date().toISOString(),
              user_id: session.user.id,
              analysis_id: (analysisData as any).analysis_id ?? (globalThis.crypto?.randomUUID?.() ?? `an_${Date.now()}_${Math.random().toString(36).slice(2,8)}`)
            })
            .select()
            .maybeSingle();

          if (error) throw error;
          result = data;
        } catch (error) {
          console.error('Failed to create analysis:', error);
          throw error;
        }
      }

      // Clear cache for this session
      this.cache.delete(`session_${sessionId}`);
      this.cache.delete(`analysis_${result?.id}`);

      toast({
        title: 'Success',
        description: 'Analysis saved successfully',
      });

      // Trigger aggregation/enrichment to compute combined view (provenance-aware)
      try {
        // Prefer the newer enrichment function first; regardless of outcome, always
        // run the legacy aggregator to produce the combined view expected by
        // downstream consumers and tests (see competitorAnalysisService.saveAnalysis tests).
        const analysisId = (result as any)?.id;
        try {
          await supabase.functions.invoke('enrich-analysis-with-master-profile', {
            body: { analysisId }
          });
        } catch (enrichErr) {
          // Do not fail if enrichment is unavailable; we still run aggregator below
          console.warn('enrich-analysis-with-master-profile failed (non-fatal):', enrichErr);
        }

        // Always invoke legacy aggregator to ensure combined/normalized data exists
        // and to maintain backward compatibility with consumers expecting this step.
        await supabase.functions.invoke('aggregate-analysis', {
          body: { analysis_id: analysisId }
        });
      } catch (e) {
        console.warn('Post-save enrichment/aggregation failed (non-fatal):', e);
      }

      return result;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }

  /**
   * Update an existing competitor analysis
   */
  async updateAnalysis(id: string, updates: Partial<CompetitorAnalysis>): Promise<CompetitorAnalysis> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Clear cache for this analysis
      this.cache.delete(`analysis_${id}`);

      // Use direct update with proper RLS policy
      const { data, error } = await supabase
        .from('competitor_analyses')
        .update({
          ...(updates as any)
        })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating analysis:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error updating analysis:', error);
      throw error;
    }
  }

  /**
   * Delete a competitor analysis
   */
  async deleteAnalysis(id: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Clear cache for this analysis
      this.cache.delete(`analysis_${id}`);

      const { error } = await supabase
        .from('competitor_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting analysis:', error);
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Analysis deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  }

  /**
   * Export analysis data as a downloadable file
   */
  async exportAnalysis(id: string): Promise<Blob> {
    try {
      const analysis = await this.getAnalysisById(id);
      if (!analysis) throw new Error('Analysis not found');

      const exportData = {
        ...analysis,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      return blob;
    } catch (error) {
      console.error('Error exporting analysis:', error);
      throw error;
    }
  }

  /**
   * Check API key requirements for competitor analysis
   */
  async checkApiKeyRequirements(): Promise<{ hasRequiredKeys: boolean; missingKeys: string[] }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { hasRequiredKeys: false, missingKeys: ['Any AI API key'] };
      }

      // Check if user has ANY active AI API key (not specific ones)
      const availableProviders = await this.getAvailableProviders();
      const hasAnyAiKey = availableProviders.length > 0;

      return {
        hasRequiredKeys: hasAnyAiKey,
        missingKeys: hasAnyAiKey ? [] : ['Any AI API key (OpenAI, Anthropic, etc.)']
      };
    } catch (error) {
      console.error('Error checking API key requirements:', error);
      return { hasRequiredKeys: false, missingKeys: ['Error checking API keys'] };
    }
  }

  /**
   * Get available API providers for the current user
   */
  async getAvailableProviders(): Promise<string[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Use unified API key service to get available providers
      const { data, error } = await supabase.functions.invoke('unified-api-key-manager', {
        body: { action: 'get_all_statuses' }
      });

      if (error || !data?.success) {
        console.error('Error getting available providers:', error || data?.error);
        return [];
      }

      const apiKeys = Array.isArray(data.result) ? data.result : [];
      return apiKeys
        .filter((key: any) => key.is_active && key.status === 'active')
        .map((key: any) => key.provider);
    } catch (error) {
      console.error('Error getting available providers:', error);
      return [];
    }
  }

  /**
   * Get available API keys mapped by provider
   */
  async getAvailableApiKeys(): Promise<Record<string, 'available'>> {
    try {
      const providers = await this.getAvailableProviders();
      const result: Record<string, 'available'> = {};
      
      providers.forEach(provider => {
        result[provider] = 'available';
      });
      
      return result;
    } catch (error) {
      console.error('Error getting available API keys:', error);
      return {};
    }
  }

  /**
   * Refresh a competitor analysis (reload from database)
   */
  async refreshCompetitorAnalysis(id: string): Promise<boolean> {
    try {
      // Clear cache and reload
      this.cache.delete(`analysis_${id}`);
      const analysis = await this.getAnalysisById(id);
      return analysis !== null;
    } catch (error) {
      console.error('Error refreshing analysis:', error);
      return false;
    }
  }

  /**
   * Consolidate competitor analysis data
   */
  async consolidateCompetitorAnalysis(id: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('aggregate-analysis', {
        body: { analysis_id: id }
      });

      if (error) {
        console.error('Error consolidating analysis:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error consolidating analysis:', error);
      return null;
    }
  }

  /**
   * Validate all provider API keys
   */
  async validateAllProviders(): Promise<Map<ApiKeyType, boolean>> {
    try {
      const providers = await this.getAvailableProviders();
      const results = new Map<ApiKeyType, boolean>();
      
      // Validate each provider
      for (const provider of providers) {
        try {
          const { data, error } = await supabase.functions.invoke('unified-api-key-manager', {
            body: { action: 'validate', provider }
          });
          
          results.set(provider as ApiKeyType, data?.success && data?.result?.isValid);
        } catch (error) {
          console.error(`Error validating ${provider}:`, error);
          results.set(provider as ApiKeyType, false);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error validating providers:', error);
      return new Map<ApiKeyType, boolean>();
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Subscribe to analysis progress updates
   */
  subscribeToProgress(sessionId: string, callback: (data: any) => void): () => void {
    const subscriptionId = `progress_${sessionId}_${Date.now()}`;
    this.progressSubscriptions.set(subscriptionId, callback);
    
    return () => {
      this.progressSubscriptions.delete(subscriptionId);
    };
  }
}

// Single instance export
export const unifiedCompetitorAnalysisService = new UnifiedCompetitorAnalysisService();

// Backward compatibility exports
export const competitorAnalysisService = unifiedCompetitorAnalysisService;
export default unifiedCompetitorAnalysisService;
