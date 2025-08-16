import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CompetitorAnalysis } from '../types/reportTypes';
import { competitorAnalysisService } from '@/services/competitorAnalysisService';

export const useAnalysisReport = (analysisId?: string) => {
  const { analysisId: paramAnalysisId } = useParams<{ analysisId: string }>();
  const finalAnalysisId = analysisId || paramAnalysisId;
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  const initRef = useRef(false);
  // Track in-flight fetches and throttle rapid refetches
  const fetchInProgressRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSerializedRef = useRef<string | null>(null);
  const lastIdRef = useRef<string | undefined>(undefined);

  const fetchAnalysis = useCallback(async () => {
    if (!finalAnalysisId) return;
    // Prevent parallel/rapid fetches
    if (fetchInProgressRef.current) return;
    if (Date.now() - lastFetchAtRef.current < 500) return;
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);
      
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        toastRef.current?.({
          title: "Authentication Required",
          description: "Please log in to view this analysis",
          variant: "destructive"
        });
        // Wait for auth instead of redirecting away; an auth listener will refetch
        return;
      }

      console.log('Fetching analysis with ID:', finalAnalysisId);

      // RPC-first: reliably fetch user-scoped analyses and resolve the target row
      try {
        const listResp = await supabase.rpc('get_user_competitor_analyses');
        if (listResp.error) {
          console.warn('[Details] RPC list error (non-fatal):', listResp.error);
        } else {
          const all: any[] = Array.isArray(listResp.data) ? listResp.data : [];
          const match = all.find((r: any) => r.id === finalAnalysisId || r.analysis_id === finalAnalysisId || r.session_id === finalAnalysisId || (typeof finalAnalysisId === 'string' && (r.name?.toLowerCase() === finalAnalysisId.replace(/-/g, ' ').toLowerCase())));
          if (match) {
            // Normalize and return early
            const adRaw: any = match.analysis_data;
            // Normalize analysis_data shape: array | keyed map { company: { data, cost, ... } } | plain object
            let ad: any;
            let keyedEntry: any | null = null;
            if (Array.isArray(adRaw)) {
              ad = adRaw[0] || {};
            } else if (adRaw && typeof adRaw === 'object') {
              const hasDirectFields = ['strengths','weaknesses','opportunities','threats','company_name','website_url','industry']
                .some((k) => k in (adRaw as any));
              if (!hasDirectFields) {
                const firstKey = Object.keys(adRaw)[0];
                keyedEntry = firstKey ? (adRaw as any)[firstKey] : null;
                ad = keyedEntry?.data ?? keyedEntry ?? {};
              } else {
                ad = adRaw || {};
              }
            } else {
              ad = adRaw || {};
            }
            const normalized: any = { ...match };
            if (Array.isArray(adRaw)) {
              normalized.analysis_data = { results: adRaw };
            } else if (keyedEntry) {
              const core = ad || {};
              const firstKey = Object.keys(adRaw || {})[0];
              const resultItem = {
                name: core.company_name || normalized.name || firstKey,
                description: core.description,
                website: core.website_url,
                strengths: core.strengths || [],
                weaknesses: core.weaknesses || [],
                opportunities: core.opportunities || [],
                threats: core.threats || [],
                employee_count: core.employee_count,
                founded_year: core.founded_year,
              };
              normalized.analysis_data = { ...(normalized.analysis_data || {}), results: [resultItem] };
              if (!normalized.cost_breakdown && Array.isArray(keyedEntry?.cost_breakdown)) {
                normalized.cost_breakdown = keyedEntry.cost_breakdown;
              }
              if ((normalized.total_api_cost == null || Number(normalized.total_api_cost) === 0) && typeof keyedEntry?.cost === 'number') {
                normalized.total_api_cost = keyedEntry.cost;
              }
            }

            // Provider-normalized fallbacks (fused -> openai -> anthropic)
            const fusedNorm = (ad as any)?.api_responses?.fused?.normalized_result || {};
            const openaiNorm = (ad as any)?.api_responses?.openai?.normalized_result || {};
            const anthropicNorm = (ad as any)?.api_responses?.anthropic?.normalized_result || {};
            const pick = (key: string) => {
              const v = (ad as any)?.[key] ?? fusedNorm?.[key] ?? openaiNorm?.[key] ?? anthropicNorm?.[key];
              // Some providers wrap values like { _type, value } or { message: "[Circular Reference...]" }
              if (v && typeof v === 'object') {
                if ('value' in v) return (v as any).value;
                if ('message' in v) return undefined; // drop placeholder objects
              }
              return v;
            };
            const pickArr = (key: string) => {
              const v = pick(key);
              return Array.isArray(v) ? v : Array.isArray((ad as any)?.[key]) ? (ad as any)[key] : [];
            };

            if (!normalized.name && (pick('company_name') || (ad as any).company_name)) normalized.name = pick('company_name') || (ad as any).company_name;
            if (!normalized.description && (pick('description') || (ad as any).description)) normalized.description = pick('description') || (ad as any).description;
            if (!normalized.industry && (pick('industry') || (ad as any).industry)) normalized.industry = pick('industry') || (ad as any).industry;
            if (!normalized.website_url && (pick('website_url') || (ad as any).website_url)) normalized.website_url = pick('website_url') || (ad as any).website_url;
            if (!normalized.employee_count && (pick('employee_count') || (ad as any).employee_count)) normalized.employee_count = Number(pick('employee_count') || (ad as any).employee_count);
            if (!normalized.founded_year && (pick('founded_year') || (ad as any).founded_year)) normalized.founded_year = Number(pick('founded_year') || (ad as any).founded_year);
            if (!normalized.headquarters && (pick('headquarters') || (ad as any).headquarters)) normalized.headquarters = pick('headquarters') || (ad as any).headquarters;
            if ((!normalized.strengths || normalized.strengths.length === 0)) normalized.strengths = pickArr('strengths');
            if ((!normalized.weaknesses || normalized.weaknesses.length === 0)) normalized.weaknesses = pickArr('weaknesses');
            if ((!normalized.opportunities || normalized.opportunities.length === 0)) normalized.opportunities = pickArr('opportunities');
            if ((!normalized.threats || normalized.threats.length === 0)) normalized.threats = pickArr('threats');

            // Build cost breakdown from provider responses if missing
            if (!normalized.cost_breakdown) {
              const costs: any[] = [];
              const openaiCost = (ad as any)?.api_responses?.openai?.cost_usd;
              if (typeof openaiCost === 'number') costs.push({ provider: 'openai', cost_usd: openaiCost });
              const anthropicCost = (ad as any)?.api_responses?.anthropic?.cost_usd;
              if (typeof anthropicCost === 'number') costs.push({ provider: 'anthropic', cost_usd: anthropicCost });
              if (costs.length) normalized.cost_breakdown = costs;
            }
            if ((normalized.total_api_cost == null || Number(normalized.total_api_cost) === 0) && Array.isArray((normalized as any).cost_breakdown)) {
              normalized.total_api_cost = (normalized as any).cost_breakdown.reduce((sum: number, i: any) => sum + (Number(i.cost_usd) || 0), 0);
            }

            // Enrich with aggregated combined result if available
            try {
              const { data: combined } = await supabase
                .from('analysis_combined')
                .select('aggregated_result, provenance_map, field_scores, filled_from_master, overall_confidence')
                .eq('analysis_id', normalized.id)
                .maybeSingle();
              if (combined?.aggregated_result) {
                normalized.analysis_data = {
                  ...(normalized.analysis_data || {}),
                  combined: combined.aggregated_result,
                  provenance_map: combined.provenance_map,
                  field_scores: combined.field_scores,
                  filled_from_master: combined.filled_from_master,
                  overall_confidence: combined.overall_confidence,
                };
              }
            } catch (e) {
              console.warn('[Details] analysis_combined enrichment failed (RPC-first):', e);
            }

            const sig = JSON.stringify(normalized);
            if (lastSerializedRef.current !== sig) {
              console.log('[Details] Normalized analysis loaded (RPC-first):', normalized);
              setAnalysis(normalized as CompetitorAnalysis);
              lastSerializedRef.current = sig;
            } else {
              console.log('[Details] Normalized analysis unchanged (RPC-first), skipping state update');
            }
            return; // Early return; loading cleared in finally
          }
        }
      } catch (rpcErr) {
        console.warn('[Details] RPC-first resolution failed (continuing with direct queries):', rpcErr);
      }

      // Check if the finalAnalysisId is a valid UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(finalAnalysisId);
      
      let data, error;
      
      if (isUUID) {
        // Try to fetch by UUID (match either primary id or analysis_id)
        // NOTE: Some flows navigate with analysis_id; this ensures details page resolves both
        const response = await supabase
          .from('competitor_analyses')
          .select('*')
          .eq('user_id', session.session.user.id)
          .or(`id.eq.${finalAnalysisId},analysis_id.eq.${finalAnalysisId}`)
          .maybeSingle();
        
        data = response.data;
        error = response.error;
      } else {
        // Try to fetch by competitor name (for temp IDs like "microsoft")
        console.log('Non-UUID ID detected, searching by name:', finalAnalysisId);
        const response = await supabase
          .from('competitor_analyses')
          .select('*')
          .eq('user_id', session.session.user.id)
          .ilike('name', finalAnalysisId.replace(/-/g, ' '))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        data = response.data;
        error = response.error;
      }

      if (error) {
        throw error;
      }

      // Fallback resolution when no direct match found
      if (!data) {
        // 1) Try by session_id directly (some navigations use session IDs)
        const bySession = await supabase
          .from('competitor_analyses')
          .select('*')
          .eq('user_id', session.session.user.id)
          .eq('session_id', finalAnalysisId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (bySession.error) {
          throw bySession.error;
        }

        if (!bySession.data && isUUID) {
          // 2) If route param is an analysis_runs id, resolve its session_id, then find competitor_analyses by that
          const runResp = await supabase
            .from('analysis_runs')
            .select('session_id')
            .eq('id', finalAnalysisId)
            .eq('user_id', session.session.user.id)
            .maybeSingle();

          if (runResp.error) {
            throw runResp.error;
          }

          if (runResp.data?.session_id) {
            const byRunSession = await supabase
              .from('competitor_analyses')
              .select('*')
              .eq('user_id', session.session.user.id)
              .eq('session_id', runResp.data.session_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (byRunSession.error) throw byRunSession.error;
            data = byRunSession.data;
          }
        } else {
          data = bySession.data;
        }
      }

      // 3) Final safety: use RPC to list user's analyses and pick the target
      if (!data) {
        const rpc = await supabase.rpc('get_user_competitor_analyses');
        if (rpc.error) throw rpc.error;
        const list: any[] = rpc.data || [];
        data = list.find((r: any) => r.id === finalAnalysisId || r.analysis_id === finalAnalysisId || r.session_id === finalAnalysisId) || null;
      }

      if (!data) {
        toastRef.current?.({
          title: "Analysis Not Found",
          description: "We couldn't locate a matching analysis for this link.",
          variant: "destructive"
        });
        navigate('/market-research/competitor-analysis');
        return;
      }

      // Normalize: support array or object analysis_data
      const adRaw: any = data.analysis_data;
      // Normalize analysis_data shape: array | keyed map { company: { data, cost, ... } } | plain object
      let ad: any;
      let keyedEntry: any | null = null;
      if (Array.isArray(adRaw)) {
        ad = adRaw[0] || {};
      } else if (adRaw && typeof adRaw === 'object') {
        const hasDirectFields = ['strengths','weaknesses','opportunities','threats','company_name','website_url','industry']
          .some((k) => k in (adRaw as any));
        if (!hasDirectFields) {
          const firstKey = Object.keys(adRaw)[0];
          keyedEntry = firstKey ? (adRaw as any)[firstKey] : null;
          ad = keyedEntry?.data ?? keyedEntry ?? {};
        } else {
          ad = adRaw || {};
        }
      } else {
        ad = adRaw || {};
      }
      const normalized: any = { ...data };

      // If analysis_data is an array, expose it under results for downstream UI
      if (Array.isArray(adRaw)) {
        normalized.analysis_data = { results: adRaw };
      } else if (keyedEntry) {
        const core = ad || {};
        const firstKey = Object.keys(adRaw || {})[0];
        const resultItem = {
          name: core.company_name || normalized.name || firstKey,
          description: core.description,
          website: core.website_url,
          strengths: core.strengths || [],
          weaknesses: core.weaknesses || [],
          opportunities: core.opportunities || [],
          threats: core.threats || [],
          employee_count: core.employee_count,
          founded_year: core.founded_year,
        };
        normalized.analysis_data = { ...(normalized.analysis_data || {}), results: [resultItem] };
        if (!normalized.cost_breakdown && Array.isArray(keyedEntry?.cost_breakdown)) {
          normalized.cost_breakdown = keyedEntry.cost_breakdown;
        }
        if ((normalized.total_api_cost == null || Number(normalized.total_api_cost) === 0) && typeof keyedEntry?.cost === 'number') {
          normalized.total_api_cost = keyedEntry.cost;
        }
      }

      // Provider-normalized fallbacks (fused -> openai -> anthropic)
      const fusedNorm2 = (ad as any)?.api_responses?.fused?.normalized_result || {};
      const openaiNorm2 = (ad as any)?.api_responses?.openai?.normalized_result || {};
      const anthropicNorm2 = (ad as any)?.api_responses?.anthropic?.normalized_result || {};
      const pick2 = (key: string) => {
        const v = (ad as any)?.[key] ?? fusedNorm2?.[key] ?? openaiNorm2?.[key] ?? anthropicNorm2?.[key];
        if (v && typeof v === 'object') {
          if ('value' in v) return (v as any).value;
          if ('message' in v) return undefined;
        }
        return v;
      };
      const pickArr2 = (key: string) => {
        const v = pick2(key);
        return Array.isArray(v) ? v : Array.isArray((ad as any)?.[key]) ? (ad as any)[key] : [];
      };

      if (!normalized.name && (pick2('company_name') || (ad as any).company_name)) normalized.name = pick2('company_name') || (ad as any).company_name;
      if (!normalized.description && (pick2('description') || (ad as any).description)) normalized.description = pick2('description') || (ad as any).description;
      if (!normalized.industry && (pick2('industry') || (ad as any).industry)) normalized.industry = pick2('industry') || (ad as any).industry;
      if (!normalized.website_url && (pick2('website_url') || (ad as any).website_url)) normalized.website_url = pick2('website_url') || (ad as any).website_url;
      if (!normalized.employee_count && (pick2('employee_count') || (ad as any).employee_count)) normalized.employee_count = Number(pick2('employee_count') || (ad as any).employee_count);
      if (!normalized.founded_year && (pick2('founded_year') || (ad as any).founded_year)) normalized.founded_year = Number(pick2('founded_year') || (ad as any).founded_year);
      if (!normalized.headquarters && (pick2('headquarters') || (ad as any).headquarters)) normalized.headquarters = pick2('headquarters') || (ad as any).headquarters;
      if ((!normalized.strengths || normalized.strengths.length === 0)) normalized.strengths = pickArr2('strengths');
      if ((!normalized.weaknesses || normalized.weaknesses.length === 0)) normalized.weaknesses = pickArr2('weaknesses');
      if ((!normalized.opportunities || normalized.opportunities.length === 0)) normalized.opportunities = pickArr2('opportunities');
      if ((!normalized.threats || normalized.threats.length === 0)) normalized.threats = pickArr2('threats');

      // Costs: backfill from analysis_data.cost_breakdown or provider costs if needed
      if (!normalized.cost_breakdown) {
        if (Array.isArray((ad as any).cost_breakdown)) {
          normalized.cost_breakdown = (ad as any).cost_breakdown;
        } else {
          const costs: any[] = [];
          const openaiCost = (ad as any)?.api_responses?.openai?.cost_usd;
          if (typeof openaiCost === 'number') costs.push({ provider: 'openai', cost_usd: openaiCost });
          const anthropicCost = (ad as any)?.api_responses?.anthropic?.cost_usd;
          if (typeof anthropicCost === 'number') costs.push({ provider: 'anthropic', cost_usd: anthropicCost });
          if (costs.length) normalized.cost_breakdown = costs;
        }
      }
      if ((normalized.total_api_cost == null || Number(normalized.total_api_cost) === 0) && Array.isArray((normalized as any).cost_breakdown)) {
        normalized.total_api_cost = (normalized as any).cost_breakdown.reduce((sum: number, item: any) => sum + (Number(item.cost_usd) || 0), 0);
      }

      // Extended field backfills from analysis_data to top-level for consistent rendering across sections
      const adAny: any = ad;
      if (normalized.overall_threat_level == null && adAny.overall_threat_level) normalized.overall_threat_level = adAny.overall_threat_level;
      if (normalized.brand_strength_score == null && typeof adAny.brand_strength_score === 'number') normalized.brand_strength_score = adAny.brand_strength_score;
      if ((normalized.market_share_estimate == null || isNaN(Number(normalized.market_share_estimate))) && (adAny.market_share_estimate != null || adAny.market_share_percentage != null)) {
        normalized.market_share_estimate = Number(adAny.market_share_estimate ?? adAny.market_share_percentage);
      }
      if (normalized.revenue_estimate == null && adAny.revenue_estimate != null) normalized.revenue_estimate = Number(adAny.revenue_estimate);
      if ((!normalized.customer_segments || normalized.customer_segments.length === 0) && Array.isArray(adAny.customer_segments)) normalized.customer_segments = adAny.customer_segments;
      if ((!normalized.geographic_presence || normalized.geographic_presence.length === 0) && Array.isArray(adAny.geographic_presence)) normalized.geographic_presence = adAny.geographic_presence;
      if ((!normalized.market_trends || normalized.market_trends.length === 0) && Array.isArray(adAny.market_trends)) normalized.market_trends = adAny.market_trends;
      if ((!normalized.partnerships || normalized.partnerships.length === 0) && Array.isArray(adAny.partnerships)) normalized.partnerships = adAny.partnerships;
      if (!normalized.financial_metrics && adAny.financial_metrics) normalized.financial_metrics = adAny.financial_metrics;
      if (!normalized.product_portfolio && adAny.product_portfolio) normalized.product_portfolio = adAny.product_portfolio;
      if (!normalized.key_personnel && adAny.key_personnel) normalized.key_personnel = adAny.key_personnel;
      if (!normalized.certification_standards && adAny.certification_standards) normalized.certification_standards = adAny.certification_standards;
      if (!normalized.technology_analysis && (adAny.technology_analysis || adAny.technology_innovation)) normalized.technology_analysis = adAny.technology_analysis || adAny.technology_innovation;
      // Newly added backfills to surface all collected sections
      if ((!normalized.target_market || normalized.target_market.length === 0) && Array.isArray(adAny.target_market)) normalized.target_market = adAny.target_market;
      if (!normalized.pricing_strategy && adAny.pricing_strategy) normalized.pricing_strategy = adAny.pricing_strategy;
      if (!normalized.funding_info && adAny.funding_info) normalized.funding_info = adAny.funding_info;
      if ((!normalized.competitive_advantages || normalized.competitive_advantages.length === 0) && Array.isArray(adAny.competitive_advantages)) normalized.competitive_advantages = adAny.competitive_advantages;
      if ((!normalized.competitive_disadvantages || normalized.competitive_disadvantages.length === 0) && Array.isArray(adAny.competitive_disadvantages)) normalized.competitive_disadvantages = adAny.competitive_disadvantages;
      if (!normalized.source_citations && adAny.source_citations) normalized.source_citations = adAny.source_citations;
      if (!normalized.confidence_scores && adAny.confidence_scores) normalized.confidence_scores = adAny.confidence_scores;
      // Enrich with aggregated combined result if available
      try {
        const { data: combined } = await supabase
          .from('analysis_combined')
          .select('aggregated_result, provenance_map, field_scores, filled_from_master, overall_confidence')
          .eq('analysis_id', normalized.id)
          .maybeSingle();
        if (combined?.aggregated_result) {
          normalized.analysis_data = {
            ...(normalized.analysis_data || {}),
            combined: combined.aggregated_result,
            provenance_map: combined.provenance_map,
            field_scores: combined.field_scores,
            filled_from_master: combined.filled_from_master,
            overall_confidence: combined.overall_confidence,
          };
        }
      } catch (e) {
        console.warn('[Details] analysis_combined enrichment failed:', e);
      }

      const sig2 = JSON.stringify(normalized);
      if (lastSerializedRef.current !== sig2) {
        console.log('[Details] Normalized analysis loaded:', normalized);
        setAnalysis(normalized as CompetitorAnalysis);
        lastSerializedRef.current = sig2;
      } else {
        console.log('[Details] Normalized analysis unchanged, skipping state update');
      }
    } catch (err: any) {
      console.error('Error fetching analysis:', err);
      setError(err.message || 'Failed to load analysis');
      toastRef.current?.({
        title: "Error",
        description: "Failed to load analysis details",
        variant: "destructive"
      });
    } finally {
      fetchInProgressRef.current = false;
      lastFetchAtRef.current = Date.now();
      setLoading(false);
    }
  }, [finalAnalysisId, navigate]);

  const refreshAnalysis = useCallback(async () => {
    if (!analysis) return;
    try {
      setRefreshing(true);
      const selectedProviders = await competitorAnalysisService.getAvailableProviders();
      const { error } = await supabase.functions.invoke('competitor-analysis', {
        body: {
          action: 'start',
          competitors: [analysis.name],
          sessionId: `refresh-${Date.now()}`,
          analysisId: analysis.id,
          providersSelected: selectedProviders,
        },
      });
      if (error) throw error;
      
      toastRef.current?.({
        title: "Refresh Started",
        description: "Analysis data is being updated in the background"
      });
      
      // Refresh the analysis data
      await fetchAnalysis();
    } catch (err: any) {
      console.error('Error refreshing analysis:', err);
      toastRef.current?.({
        title: "Refresh Failed",
        description: "Failed to refresh analysis data",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  }, [analysis, fetchAnalysis]);

  // Export functionality is now handled by ExportAnalysisDialog component
  const exportAnalysis = useCallback(() => {
    // This function is kept for compatibility but actual export is handled by ExportAnalysisDialog
    console.log('Export function called - using ExportAnalysisDialog component');
  }, []);

  useEffect(() => {
    if (lastIdRef.current !== finalAnalysisId) {
      initRef.current = false;
      lastIdRef.current = finalAnalysisId;
      lastSerializedRef.current = null;
    }
    if (finalAnalysisId && !initRef.current) {
      initRef.current = true;
      fetchAnalysis();
    }
  }, [fetchAnalysis, finalAnalysisId]);

  // Re-fetch once auth state becomes available (handles initial race conditions) and avoid duplicate fetches by gating on loading/analysis
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && finalAnalysisId && !analysis && !fetchInProgressRef.current) {
        fetchAnalysis();
      }
    });
    return () => {
      sub.subscription?.unsubscribe();
    };
  }, [fetchAnalysis, finalAnalysisId, analysis]);

  // Realtime: auto-refresh when this analysis row updates
  useEffect(() => {
    // Use resolved analysis.id when available; fallback to route param
    const targetId = (analysis as any)?.id || finalAnalysisId;
    if (!targetId) return;

    const channel = supabase
      .channel(`competitor-analysis-${targetId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'competitor_analyses', filter: `id=eq.${targetId}` },
        (_payload) => {
          const now = Date.now();
          if (fetchInProgressRef.current) return;
          if (now - lastFetchAtRef.current < 1500) return;
          console.log('[Realtime] competitor_analyses updated, refetching analysis', targetId);
          fetchAnalysis();
        }
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [finalAnalysisId, analysis, fetchAnalysis]);

  return {
    analysis,
    loading,
    refreshing,
    error,
    fetchAnalysis,
    refreshAnalysis,
    exportAnalysis
  };
};