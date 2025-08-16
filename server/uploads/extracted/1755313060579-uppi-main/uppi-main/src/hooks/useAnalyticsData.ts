import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SystemMetrics {
  uptime: string;
  responseTime: number;
  errorRate: number;
  totalRequests: number;
}

interface UserMetrics {
  totalUsers: number;
  newUsersThisMonth: number;
  activeSessions: number;
  recentAnalyses: number;
  chartData?: any[];
}

interface APIMetrics {
  totalCalls: number;
  successRate: number;
  todayCalls: number;
  chartData?: any[];
}

interface CostMetrics {
  totalCost: number;
  monthlyTotal: number;
  chartData?: any[];
}

export const useAnalyticsData = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [apiMetrics, setAPIMetrics] = useState<APIMetrics | null>(null);
  const [costMetrics, setCostMetrics] = useState<CostMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('api_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const totalRequests = data?.length || 0;
      const errorCount = data?.filter(m => m.status_code >= 400).length || 0;
      const avgResponseTime = data?.length 
        ? data.reduce((sum, m) => sum + m.response_time_ms, 0) / data.length 
        : 0;

      setSystemMetrics({
        uptime: '99.9',
        responseTime: Math.round(avgResponseTime),
        errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
        totalRequests
      });
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  }, []);

  const fetchUserMetrics = useCallback(async () => {
    try {
      // Get total competitor analyses as a proxy for users
      const { data: analyses, error: analysesError } = await supabase
        .from('competitor_analyses')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      if (analysesError) throw analysesError;

      const uniqueUsers = new Set(analyses?.map(a => a.user_id)).size;
      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const newThisMonth = analyses?.filter(a => 
        new Date(a.created_at) >= thisMonth
      ).length || 0;

      const recentAnalyses = analyses?.filter(a => 
        new Date(a.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;

      setUserMetrics({
        totalUsers: uniqueUsers,
        newUsersThisMonth: newThisMonth,
        activeSessions: Math.floor(uniqueUsers * 0.1), // Estimate
        recentAnalyses
      });
    } catch (error) {
      console.error('Error fetching user metrics:', error);
    }
  }, []);

  const fetchAPIMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const totalCalls = data?.length || 0;
      const successfulCalls = data?.filter(call => call.status_code < 400).length || 0;
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCalls = data?.filter(call => 
        new Date(call.timestamp) >= today
      ).length || 0;

      setAPIMetrics({
        totalCalls,
        successRate: Math.round(successRate),
        todayCalls
      });
    } catch (error) {
      console.error('Error fetching API metrics:', error);
    }
  }, []);

  const fetchCostMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('api_usage_costs')
        .select('cost_usd, date')
        .order('date', { ascending: false });

      if (error) throw error;

      const totalCost = data?.reduce((sum, cost) => sum + Number(cost.cost_usd), 0) || 0;
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyTotal = data?.filter(cost => 
        new Date(cost.date) >= thisMonth
      ).reduce((sum, cost) => sum + Number(cost.cost_usd), 0) || 0;

      setCostMetrics({
        totalCost: Math.round(totalCost * 100) / 100,
        monthlyTotal: Math.round(monthlyTotal * 100) / 100
      });
    } catch (error) {
      console.error('Error fetching cost metrics:', error);
    }
  }, []);

  const fetchAllMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchSystemMetrics(),
        fetchUserMetrics(),
        fetchAPIMetrics(),
        fetchCostMetrics()
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchSystemMetrics, fetchUserMetrics, fetchAPIMetrics, fetchCostMetrics]);

  useEffect(() => {
    fetchAllMetrics();
  }, [fetchAllMetrics]);

  return {
    systemMetrics,
    userMetrics,
    apiMetrics,
    costMetrics,
    loading,
    error,
    refresh: fetchAllMetrics
  };
};