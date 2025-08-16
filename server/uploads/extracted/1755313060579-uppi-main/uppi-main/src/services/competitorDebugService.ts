import { supabase } from '@/integrations/supabase/client';

export interface DebugTestResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

class CompetitorDebugService {
  async runCompleteFlowTest(): Promise<DebugTestResult[]> {
    const results: DebugTestResult[] = [];
    
    console.log('🔍 Starting complete competitor analysis flow test...');
    
    // Step 1: Check authentication
    try {
      const { data: session } = await supabase.auth.getSession();
      results.push({
        step: 'authentication',
        success: !!session.session?.user,
        data: {
          hasSession: !!session.session,
          hasUser: !!session.session?.user,
          userId: session.session?.user?.id
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      results.push({
        step: 'authentication',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return results; // Can't continue without auth
    }

    // Step 2: Check existing analyses count BEFORE
    try {
      const { data: beforeAnalyses, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      results.push({
        step: 'pre_analysis_database_count',
        success: !error,
        data: {
          count: beforeAnalyses?.length || 0,
          latestAnalysis: beforeAnalyses?.[0] ? {
            id: beforeAnalyses[0].id,
            name: beforeAnalyses[0].name,
            created_at: beforeAnalyses[0].created_at
          } : null
        },
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      results.push({
        step: 'pre_analysis_database_count',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 3: Run a test competitor analysis
    try {
      const sessionId = `debug-test-${Date.now()}`;
      const { data, error } = await supabase.functions.invoke('competitor-analysis', {
        body: {
          competitors: ['Debug Test Company'],
          focusAreas: [],
          sessionId: sessionId
        }
      });

      results.push({
        step: 'competitor_analysis_call',
        success: !error && data?.success,
        data: {
          hasResponse: !!data,
          success: data?.success,
          resultsCount: data?.results?.length || 0,
          savedToDatabase: data?.saved_to_database || 0,
          sessionId: data?.session_id,
          firstResult: data?.results?.[0] ? {
            name: data.results[0].name,
            hasStrengths: !!(data.results[0].strengths?.length > 0),
            hasWeaknesses: !!(data.results[0].weaknesses?.length > 0),
            dataQualityScore: data.results[0].data_quality_score
          } : null
        },
        error: error?.message || (!data?.success ? 'Analysis failed' : undefined),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      results.push({
        step: 'competitor_analysis_call',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 4: Wait a moment and check database count AFTER
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const { data: afterAnalyses, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      const beforeCount = results.find(r => r.step === 'pre_analysis_database_count')?.data?.count || 0;
      const afterCount = afterAnalyses?.length || 0;

      results.push({
        step: 'post_analysis_database_count',
        success: !error,
        data: {
          countBefore: beforeCount,
          countAfter: afterCount,
          increment: afterCount - beforeCount,
          latestAnalysis: afterAnalyses?.[0] ? {
            id: afterAnalyses[0].id,
            name: afterAnalyses[0].name,
            created_at: afterAnalyses[0].created_at,
            hasStrengths: !!(afterAnalyses[0].strengths?.length > 0),
            strengthsCount: afterAnalyses[0].strengths?.length || 0,
            hasAnalysisData: !!afterAnalyses[0].analysis_data
          } : null
        },
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      results.push({
        step: 'post_analysis_database_count',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    // Step 5: Test frontend data fetching service
    try {
      const { data: serviceAnalyses, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      results.push({
        step: 'frontend_service_fetch',
        success: !error,
        data: {
          count: serviceAnalyses?.length || 0,
          hasData: !!(serviceAnalyses?.length > 0),
          samples: serviceAnalyses?.slice(0, 2).map(a => ({
            id: a.id,
            name: a.name,
            hasStrengths: !!(a.strengths?.length > 0),
            hasWeaknesses: !!(a.weaknesses?.length > 0),
            strengthsCount: a.strengths?.length || 0,
            weaknessesCount: a.weaknesses?.length || 0,
            hasAnalysisData: !!a.analysis_data,
            analysisDataType: typeof a.analysis_data
          })) || []
        },
        error: error?.message,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      results.push({
        step: 'frontend_service_fetch',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔍 Complete flow test results:', results);
    return results;
  }

  async checkDatabaseDirectly(): Promise<DebugTestResult> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('No authenticated user');
      }

      const userId = session.session.user.id;
      
      // Query as the specific user
      const { data: userAnalyses, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return {
        step: 'direct_database_check',
        success: !error,
        data: {
          userId: userId,
          userAnalysesCount: userAnalyses?.length || 0,
          hasUserData: !!(userAnalyses?.length > 0),
          userAnalysesSample: userAnalyses?.slice(0, 2).map(a => ({
            id: a.id,
            name: a.name,
            user_id: a.user_id,
            created_at: a.created_at,
            hasStrengths: !!(a.strengths?.length > 0)
          })) || []
        },
        error: error?.message,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        step: 'direct_database_check',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const competitorDebugService = new CompetitorDebugService();