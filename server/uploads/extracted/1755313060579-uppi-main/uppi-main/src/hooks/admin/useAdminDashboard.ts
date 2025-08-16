import { useAdminStats } from './useAdminStats';

// Export types for backward compatibility
export interface UserStats {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  conversionRate: number;
  churnRate: number;
}

export interface ApiMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
  providers: Record<string, {
    requests: number;
    cost: number;
    tokens: number;
  }>;
}

export interface CompetitorAnalysesStats {
  totalAnalyses: number;
  recentAnalyses: number;
  uniqueUsers: number;
  avgCostPerAnalysis: number;
  avgQualityScore: number;
}

export interface SystemHealth {
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

export const useAdminDashboard = () => {
  const stats = useAdminStats();
  
  return {
    userStats: stats.userStats,
    apiMetrics: stats.apiMetrics,
    competitorAnalysesStats: stats.competitorStats,
    systemHealth: stats.systemHealth,
    isLoading: stats.loading,
    error: stats.error,
    fetchAllData: stats.refreshStats,
    refetch: stats.refreshStats
  };
};