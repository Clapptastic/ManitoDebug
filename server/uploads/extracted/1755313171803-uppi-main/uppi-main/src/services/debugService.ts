import { supabase } from '@/integrations/supabase/client';

interface DebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

class DebugService {
  
  async runFullDebugFlow(): Promise<DebugResult[]> {
    const results: DebugResult[] = [];
    
    console.log('🔍 Starting comprehensive debug flow...');
    
    // Step 1: Test Authentication
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      results.push({
        step: 'frontend_auth_check',
        success: !!session?.user && !error,
        data: { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          userId: session?.user?.id 
        },
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      results.push({
        step: 'frontend_auth_check',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 2: Test API Keys Fetch
    try {
      const { data, error } = await supabase.rpc('manage_api_key', { operation: 'select' });

      results.push({
        step: 'frontend_api_keys_fetch',
        success: !error,
        data: {
          count: Array.isArray(data) ? data.length : 0,
          providers: Array.isArray(data) ? data.filter((k: any) => k.is_active).map((k: any) => k.provider) : []
        },
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      results.push({
        step: 'frontend_api_keys_fetch',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 3: Test Edge Function Call
    try {
      const { data, error } = await supabase.functions.invoke('debug-competitor-flow');
      results.push({
        step: 'edge_function_debug_call',
        success: !error && data?.success,
        data: {
          hasData: !!data,
          isSuccess: data?.success,
          debugResultsCount: data?.debugResults?.length || 0,
          summary: data?.summary
        },
        error: error?.message || (!data?.success ? data?.error : undefined),
        timestamp: new Date().toISOString()
      });

      // Merge edge function results
      if (data?.debugResults) {
        results.push(...data.debugResults);
      }
    } catch (error: any) {
      results.push({
        step: 'edge_function_debug_call',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 4: Test Database Read from Frontend
    try {
      const { data: analyses, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      results.push({
        step: 'frontend_database_read',
        success: !error,
        data: {
          count: analyses?.length || 0,
          hasData: (analyses?.length || 0) > 0,
          samples: analyses?.slice(0, 2).map(a => ({
            id: a.id,
            name: a.name,
            hasStrengths: !!a.strengths?.length,
            hasWeaknesses: !!a.weaknesses?.length,
            hasAnalysisData: !!a.analysis_data,
            analysisDataType: typeof a.analysis_data,
            strengthsCount: a.strengths?.length || 0,
            strengthsSample: a.strengths?.slice(0, 2) || []
          })) || []
        },
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      results.push({
        step: 'frontend_database_read',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 5: Test Data Parsing and Display Logic
    try {
      const testAnalysis = {
        id: 'test-123',
        name: 'Test Analysis',
        strengths: ['Strong brand', 'Good tech'],
        weaknesses: ['High costs', 'Limited reach'],
        opportunities: ['Market expansion'],
        threats: ['Competition'],
        analysis_data: {
          results: [{
            name: 'Test Competitor',
            strengths: ['Innovation'],
            weaknesses: ['Costs'],
            opportunities: ['Growth'],
            threats: ['Regulation']
          }]
        }
      };

      const extractedData = this.extractDisplayData(testAnalysis);
      results.push({
        step: 'data_extraction_test',
        success: true,
        data: {
          hasTopLevelSwot: !!(extractedData.strengths?.length > 0),
          hasNestedSwot: !!(extractedData.analysisResults?.[0]?.strengths?.length > 0),
          extractedData: extractedData
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      results.push({
        step: 'data_extraction_test',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔍 Debug flow completed. Results:', results);
    return results;
  }

  private extractDisplayData(analysis: any) {
    // Simulate how the frontend extracts data for display
    const analysisResults = analysis.analysis_data?.results || [];
    const primaryResult = analysisResults[0] || analysis;

    return {
      name: analysis.name,
      strengths: analysis.strengths || primaryResult.strengths || [],
      weaknesses: analysis.weaknesses || primaryResult.weaknesses || [],
      opportunities: analysis.opportunities || primaryResult.opportunities || [],
      threats: analysis.threats || primaryResult.threats || [],
      analysisResults: analysisResults,
      dataQualityScore: primaryResult.data_quality_score || 0
    };
  }

  async testSpecificAnalysis(id: string): Promise<DebugResult> {
    try {
      const { data: analysis, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const extractedData = this.extractDisplayData(analysis);
      
      return {
        step: 'specific_analysis_test',
        success: true,
        data: {
          analysis: {
            id: analysis.id,
            name: analysis.name,
            hasStrengths: !!analysis.strengths?.length,
            hasWeaknesses: !!analysis.weaknesses?.length,
            hasAnalysisData: !!analysis.analysis_data,
            analysisDataKeys: Object.keys((analysis.analysis_data as any) || {}),
            resultsCount: (analysis.analysis_data as any)?.results?.length || 0
          },
          extracted: extractedData,
          rawSample: {
            strengthsRaw: analysis.strengths?.slice(0, 2),
            weaknessesRaw: analysis.weaknesses?.slice(0, 2),
            analysisDataSample: JSON.stringify(analysis.analysis_data, null, 2).substring(0, 500)
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        step: 'specific_analysis_test',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testCompetitorAnalysisFlow(competitors: string[] = ['test-company']) {
    console.log('🔍 Testing competitor analysis flow...');
    
    try {
      const { data, error } = await supabase.functions.invoke('competitor-analysis', {
        body: {
          competitors,
          sessionId: `debug-${Date.now()}`
        }
      });

      console.log('🔍 Analysis response:', { 
        hasData: !!data, 
        hasError: !!error,
        success: data?.success,
        resultsCount: data?.results?.length || 0,
        data: data,
        error: error
      });

      return {
        step: 'full_analysis_test',
        success: !error && data?.success,
        data: {
          hasResults: !!(data?.results?.length > 0),
          resultsCount: (data?.results as any[])?.length || 0,
          firstResult: (data?.results as any[])?.[0] ? {
            name: (data.results as any[])[0].name,
            hasStrengths: !!((data.results as any[])[0].strengths?.length),
            strengthsCount: (data.results as any[])[0].strengths?.length || 0,
            strengthsSample: (data.results as any[])[0].strengths?.slice(0, 2) || [],
            dataQualityScore: (data.results as any[])[0].data_quality_score
          } : null,
          sessionId: data?.session_id
        },
        error: error?.message || (!data?.success ? data?.error : undefined),
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('🔍 Analysis test error:', error);
      return {
        step: 'full_analysis_test',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const debugService = new DebugService();