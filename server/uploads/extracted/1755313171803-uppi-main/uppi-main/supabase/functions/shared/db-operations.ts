
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CompetitorAnalysisResult } from './types.ts';

export async function logAnalysisError(
  supabase: ReturnType<typeof createClient>,
  analysisId: string,
  errorMessage: string
) {
  try {
    console.log(`Logging analysis error for ID ${analysisId}: ${errorMessage}`);
    
    const updates = {
      status: 'failed',
      debug_info: {
        last_error: errorMessage,
        stack_trace: new Error().stack
      }
    };

    const { error } = await supabase
      .from('competitor_analyses')
      .update(updates)
      .eq('id', analysisId);

    if (error) throw error;

    // Log analysis step to audit logs
    await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'competitor_analysis',
        resource_id: analysisId,
        action: 'error_failed',
        metadata: {
          step_name: 'error',
          step_status: 'failed',
          step_details: { error: errorMessage }
        },
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
  } catch (error) {
    console.error('Error logging analysis error:', error);
  }
}

export async function updateAnalysisResults(
  supabase: ReturnType<typeof createClient>,
  analysisId: string,
  results: CompetitorAnalysisResult
) {
  try {
    console.log(`Updating analysis results for ID ${analysisId}`);
    
    const updates = {
      status: 'completed',
      // Core business data
      website_url: results.website_url || null,
      industry: results.industry || null,
      description: results.description || `AI-powered competitive analysis of ${results.name}`,
      headquarters: results.headquarters || null,
      founded_year: results.founded_year || null,
      employee_count: results.employee_count || null,
      business_model: results.business_model || null,
      revenue_estimate: results.revenue_estimate || 0,
      market_share_estimate: results.market_share_estimate || 0,
      market_position: results.market_position || 'Unknown',
      overall_threat_level: results.overall_threat_level || 'medium',
      
      // SWOT Analysis
      strengths: results.strengths || [],
      weaknesses: results.weaknesses || [],
      opportunities: results.opportunities || [],
      threats: results.threats || [],
      swot_analysis: results.swot_analysis || {},
      
      // Market & Competitive Analysis
      target_market: results.target_market || [],
      customer_segments: results.customer_segments || [],
      competitive_advantages: results.competitive_advantages || [],
      competitive_disadvantages: results.competitive_disadvantages || [],
      geographic_presence: results.geographic_presence || [],
      market_trends: results.market_trends || [],
      partnerships: results.partnerships || [],
      certification_standards: results.certification_standards || [],
      
      // Financial & Strategic Data
      funding_info: results.funding_info || {},
      pricing_strategy: results.pricing_strategy || {},
      financial_metrics: results.financial_metrics || {},
      
      // Technology & Operations
      technology_analysis: results.technology_analysis || {},
      product_portfolio: results.product_portfolio || {},
      key_personnel: results.key_personnel || {},
      environmental_social_governance: results.environmental_social_governance || {},
      social_media_presence: results.social_media_presence || {},
      
      // Quality & Analysis Metadata
      data_quality_score: results.data_quality_score || 0,
      analysis_data: results.analysis_data || {},
      api_responses: (results as any)?.analysis_data?.api_responses || (results as any)?.api_responses || {},
      source_citations: (results as any)?.analysis_data?.source_citations || (results as any)?.source_citations || [],
      confidence_scores: (results as any)?.analysis_data?.confidence_scores || (results as any)?.confidence_scores || {},
      data_completeness_score: (results as any)?.data_completeness_score || 0,
      market_sentiment_score: (results as any)?.market_sentiment_score || 0,
      website_verified: typeof (results as any)?.website_verified === 'boolean' ? (results as any)?.website_verified : null,
      employee_count_verified: typeof (results as any)?.employee_count_verified === 'boolean' ? (results as any)?.employee_count_verified : null,
      // Update timestamps
      completed_at: new Date().toISOString(),
      last_updated_sources: new Date().toISOString()
    };

    const { error } = await supabase
      .from('competitor_analyses')
      .update(updates)
      .eq('id', analysisId);

    if (error) {
      console.error('Error updating analysis results:', error);
      throw error;
    }

    // Persist per-provider runs/results when analysis_data contains api_responses
    try {
      const authUser = (await supabase.auth.getUser()).data.user;
      const userId = authUser?.id as string | undefined;
      const apiResponses: Record<string, any> = (results as any)?.analysis_data?.api_responses || (results as any)?.api_responses || {};
      if (userId && apiResponses && typeof apiResponses === 'object') {
        for (const provider of Object.keys(apiResponses)) {
          const resp = apiResponses[provider] || {};
          const { data: runRow, error: runErr } = await supabase
            .from('analysis_provider_runs')
            .insert({
              analysis_id: analysisId,
              user_id: userId,
              provider,
              status: 'completed',
              cost_usd: Number(resp?.cost_usd || 0),
              tokens_used: Number(resp?.tokens_used || 0),
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              metadata: resp?.metadata || {}
            })
            .select('id')
            .maybeSingle();
          if (runErr) {
            console.warn('analysis_provider_runs insert failed:', runErr);
            continue;
          }
          const runId = runRow?.id;
          if (!runId) continue;

          const { error: resErr } = await supabase
            .from('analysis_provider_results')
            .insert({
              run_id: runId,
              analysis_id: analysisId,
              user_id: userId,
              provider,
              normalized_result: resp?.normalized_result || {},
              raw_result: resp || {},
              quality_metrics: resp?.quality_metrics || {},
              coverage_score: typeof resp?.coverage_score === 'number' ? resp.coverage_score : null,
              confidence_score: typeof resp?.confidence_score === 'number' ? resp.confidence_score : null,
            });
          if (resErr) {
            console.warn('analysis_provider_results insert failed:', resErr);
          }
        }
      }
    } catch (persistErr) {
      console.warn('Provider runs/results persistence failed (non-fatal):', persistErr);
    }

    // Log analysis step to audit logs
    await supabase
      .from('audit_logs')
      .insert({
        resource_type: 'competitor_analysis',
        resource_id: analysisId,
        action: 'save_results_completed',
        metadata: {
          step_name: 'save_results',
          step_status: 'completed',
          step_details: { 
            responseLength: JSON.stringify(results).length
          }
        },
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('competitor_analyses')
      .select('*')
      .eq('id', analysisId)
      .maybeSingle();

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
    } else {
      console.log('Verified update:', {
        analysis_id: analysisId,
        status: verifyData.status
      });
    }
  } catch (error) {
    console.error('Error updating analysis results:', error);
    throw error;
  }
}
