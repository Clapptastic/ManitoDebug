import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserStats {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  conversionRate: number;
  churnRate: number;
}

interface ApiMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
  providers: Record<string, any>;
}

interface CompetitorStats {
  totalAnalyses: number;
  recentAnalyses: number;
  uniqueUsers: number;
  avgCostPerAnalysis: number;
  avgQualityScore: number;
  totalCost: number;
}

interface SystemHealth {
  database: {
    status: string;
    responseTime: number;
    uptime: number;
  };
  api: {
    status: string;
    responseTime: number;
    errorRate: number;
  };
  storage: {
    status: string;
    usage: number;
    quota: number;
  };
}

export const useAdminStats = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics | null>(null);
  const [competitorStats, setCompetitorStats] = useState<CompetitorStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // Fetch real data from multiple sources with proper error handling
      let summaryRes, healthRes, userCountRes, competitorStatsRes;
      
      try {
        const promises = await Promise.race([
          Promise.all([
            supabase.functions.invoke('api-metrics', {
              body: { action: 'summary', timeRange: '30d' }
            }),
            supabase.functions.invoke('api-metrics', {
              body: { action: 'health', timeRange: '24h' }
            }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('competitor_analyses').select('id, user_id, status, completed_at, actual_cost', { count: 'exact' })
          ]),
          timeoutPromise
        ]) as any[];
        
        [summaryRes, healthRes, userCountRes, competitorStatsRes] = promises;
      } catch (error) {
        console.warn('Some admin stats failed to load:', error);
        // Provide fallback values
        summaryRes = { data: null, error: error };
        healthRes = { data: null, error: error };
        userCountRes = { count: 0, error: error };
        competitorStatsRes = { data: [], error: error };
      }

      // Real user stats from profiles table
      const totalUsers = userCountRes.count || 0;
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const newUsersRes = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneMonthAgo);
      
      const newUsers = newUsersRes.count || 0;
      
      // Get active users from recent API usage
      const recentUsageRes = await supabase
        .from('api_usage_costs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const activeUsers = recentUsageRes.count || 0;
      const conversionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      setUserStats({
        totalUsers,
        newUsers,
        activeUsers,
        conversionRate,
        churnRate: Math.max(0, 100 - conversionRate) // Simple churn approximation
      });

      // Build API metrics from summaries
      const summaries = (summaryRes.data as any)?.summaries ?? [];
      const health = (healthRes.data as any)?.health ?? {};

      const totalRequests = summaries.reduce((acc: number, s: any) => acc + (s.total_requests || 0), 0);
      const totalTokens = summaries.reduce((acc: number, s: any) => acc + (s.total_tokens || 0), 0);
      const totalApiCost = summaries.reduce((acc: number, s: any) => acc + (s.total_cost || 0), 0);
      const avgResponseTime = totalRequests > 0
        ? summaries.reduce((acc: number, s: any) => acc + (s.avg_response_time || 0) * (s.total_requests || 0), 0) / totalRequests
        : 0;

      const providers: Record<string, any> = {};
      summaries.forEach((s: any) => {
        const h = health[s.provider] || {};
        providers[s.provider || 'unknown'] = {
          requests: s.total_requests || 0,
          cost: s.total_cost || 0,
          tokens: s.total_tokens || 0,
          errorRate: s.error_rate || 0,
          uptime: s.uptime_percentage || 100,
          avgResponseTime: s.avg_response_time || 0,
          status: h.status || 'healthy',
          latency: (h.latency ?? s.avg_response_time) || 0,
          uptimeOverall: (h.uptime ?? s.uptime_percentage) || 100,
        };
      });

      setApiMetrics({
        totalRequests,
        totalTokens,
        totalCost: totalApiCost,
        avgResponseTime,
        providers
      });

      // Real competitor analysis stats
      const competitorData = competitorStatsRes.data || [];
      const totalAnalyses = competitorData.length;
      const recentAnalyses = competitorData.filter(analysis => 
        analysis.completed_at && 
        new Date(analysis.completed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      const uniqueUsers = new Set(competitorData.map(analysis => analysis.user_id)).size;
      const completedAnalyses = competitorData.filter(analysis => analysis.status === 'completed');
      const totalCompetitorCost = completedAnalyses.reduce((sum, analysis) => sum + (analysis.actual_cost || 0), 0);
      const avgCostPerAnalysis = completedAnalyses.length > 0 ? totalCompetitorCost / completedAnalyses.length : 0;
      
      // Get quality scores from analysis data
      const qualityScoreRes = await supabase
        .from('competitor_analyses')
        .select('data_quality_score')
        .not('data_quality_score', 'is', null);
      
      const qualityScores = qualityScoreRes.data?.map(item => item.data_quality_score).filter(Boolean) || [];
      const avgQualityScore = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0;

      setCompetitorStats({
        totalAnalyses,
        recentAnalyses,
        uniqueUsers,
        avgCostPerAnalysis,
        avgQualityScore,
        totalCost: totalCompetitorCost
      });

      // Get real system health data
      const systemHealthRes = await supabase.functions.invoke('system-health', {
        body: { action: 'getComponents' }
      });
      
      const systemHealthData = systemHealthRes.data || {};
      
      // Derive overall API health
      const failedRequests = summaries.reduce((acc: number, s: any) => acc + (s.failed_requests || 0), 0);
      const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
      const providerStatuses = Object.values(health) as Array<{ status: 'healthy' | 'degraded' | 'down' }>;
      const hasDown = providerStatuses.some((p) => p.status === 'down');
      const hasDegraded = providerStatuses.some((p) => p.status === 'degraded');
      const overallStatus = hasDown ? 'critical' : hasDegraded ? 'warning' : 'healthy';

      // Get storage usage from Supabase
      const storageUsageRes = await supabase.storage.from('avatars').list();
      const hasStorageAccess = !storageUsageRes.error;

      setSystemHealth({
        database: { 
          status: systemHealthData.status === 'operational' ? 'healthy' : 'warning', 
          responseTime: systemHealthData.response_time || 0, 
          uptime: systemHealthData.uptime || 100 
        },
        api: { 
          status: overallStatus, 
          responseTime: avgResponseTime, 
          errorRate 
        },
        storage: { 
          status: hasStorageAccess ? 'healthy' : 'warning', 
          usage: 0, // Could be calculated from file counts if needed
          quota: 100 
        }
      });

      // Log any errors without throwing
      if (summaryRes.error) console.warn('API summary error:', summaryRes.error.message || summaryRes.error);
      if (healthRes.error) console.warn('API health error:', healthRes.error.message || healthRes.error);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admin statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    userStats,
    apiMetrics,
    competitorStats,
    systemHealth,
    loading,
    error,
    refreshStats
  };
};