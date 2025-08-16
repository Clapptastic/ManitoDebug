import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface AnalyticsDashboard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  dashboard_config: Json;
  widgets: Json;
  is_public: boolean;
  tags: string[];
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface DataVisualization {
  id: string;
  dashboard_id: string;
  name: string;
  chart_type: string;
  data_source: string;
  chart_config: Json;
  position: Json;
  is_active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface ScheduledExport {
  id: string;
  user_id: string;
  name: string;
  export_type: string;
  schedule_cron: string;
  data_query: Json;
  export_config: Json;
  last_run_at?: string;
  next_run_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: string;
  period_start: string;
  period_end: string;
  dimensions: Json;
  metadata: Json;
  created_at: string;
}

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  dashboard_config?: Record<string, any>;
  widgets?: any[];
  is_public?: boolean;
  tags?: string[];
}

export interface CreateVisualizationRequest {
  dashboard_id: string;
  name: string;
  chart_type: string;
  data_source: string;
  chart_config: Record<string, any>;
  position?: Record<string, any>;
}

export interface CreateExportRequest {
  name: string;
  export_type: string;
  schedule_cron: string;
  data_query: Record<string, any>;
  export_config?: Record<string, any>;
}

export class BusinessIntelligenceService {
  /**
   * Dashboard Management
   */
  async getDashboards(includePublic: boolean = false): Promise<AnalyticsDashboard[]> {
    try {
      let query = supabase.from('analytics_dashboards').select('*');
      
      if (includePublic) {
        query = query.or('is_public.eq.true,user_id.eq.' + (await supabase.auth.getUser()).data.user?.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      return [];
    }
  }

  async createDashboard(dashboardData: CreateDashboardRequest): Promise<AnalyticsDashboard | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('analytics_dashboards')
        .insert({
          user_id: user.id,
          name: dashboardData.name,
          description: dashboardData.description,
          dashboard_config: dashboardData.dashboard_config || {},
          widgets: dashboardData.widgets || [],
          is_public: dashboardData.is_public || false,
          tags: dashboardData.tags || []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      return null;
    }
  }

  async updateDashboard(id: string, updates: Partial<CreateDashboardRequest>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('analytics_dashboards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating dashboard:', error);
      return false;
    }
  }

  async deleteDashboard(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('analytics_dashboards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      return false;
    }
  }

  /**
   * Data Visualization Management
   */
  async getVisualizations(dashboardId: string): Promise<DataVisualization[]> {
    try {
      const { data, error } = await supabase
        .from('data_visualizations')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching visualizations:', error);
      return [];
    }
  }

  async createVisualization(vizData: CreateVisualizationRequest): Promise<DataVisualization | null> {
    try {
      const { data, error } = await supabase
        .from('data_visualizations')
        .insert({
          dashboard_id: vizData.dashboard_id,
          name: vizData.name,
          chart_type: vizData.chart_type,
          data_source: vizData.data_source,
          chart_config: vizData.chart_config,
          position: vizData.position || { x: 0, y: 0, w: 6, h: 4 }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating visualization:', error);
      return null;
    }
  }

  async updateVisualization(id: string, updates: Partial<CreateVisualizationRequest>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('data_visualizations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating visualization:', error);
      return false;
    }
  }

  async deleteVisualization(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('data_visualizations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting visualization:', error);
      return false;
    }
  }

  /**
   * Scheduled Exports Management
   */
  async getScheduledExports(): Promise<ScheduledExport[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_exports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scheduled exports:', error);
      return [];
    }
  }

  async createScheduledExport(exportData: CreateExportRequest): Promise<ScheduledExport | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('scheduled_exports')
        .insert({
          user_id: user.id,
          name: exportData.name,
          export_type: exportData.export_type,
          schedule_cron: exportData.schedule_cron,
          data_query: exportData.data_query,
          export_config: exportData.export_config || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating scheduled export:', error);
      return null;
    }
  }

  /**
   * Business Metrics
   */
  async getBusinessMetrics(metricName?: string, period: string = '30d'): Promise<BusinessMetric[]> {
    try {
      const daysAgo = period === '30d' ? 30 : period === '7d' ? 7 : 1;
      const fromDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString();

      let query = supabase
        .from('business_metrics')
        .select('*')
        .gte('created_at', fromDate);

      if (metricName) {
        query = query.eq('metric_name', metricName);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching business metrics:', error);
      return [];
    }
  }

  /**
   * Data Export Functions
   */
  async exportDashboardData(dashboardId: string, format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<string | null> {
    try {
      // Get dashboard and its visualizations
      const [dashboard, visualizations] = await Promise.all([
        supabase.from('analytics_dashboards').select('*').eq('id', dashboardId).single(),
        this.getVisualizations(dashboardId)
      ]);

      if (dashboard.error) throw dashboard.error;

      const exportData = {
        dashboard: dashboard.data,
        visualizations,
        exported_at: new Date().toISOString()
      };

      // In a real implementation, this would generate actual files
      switch (format) {
        case 'json':
          return JSON.stringify(exportData, null, 2);
        case 'csv':
          return this.convertToCSV(exportData);
        case 'pdf':
          return `PDF export would be generated here for dashboard: ${dashboard.data.name}`;
        default:
          return JSON.stringify(exportData, null, 2);
      }
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      return null;
    }
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const headers = ['Type', 'Name', 'Created At', 'Status'];
    const rows = [
      ['Dashboard', data.dashboard.name, data.dashboard.created_at, 'Active'],
      ...data.visualizations.map((viz: DataVisualization) => [
        'Visualization', viz.name, viz.created_at, viz.is_active ? 'Active' : 'Inactive'
      ])
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Advanced Analytics
   */
  async getAdvancedAnalytics(period: string = '30d'): Promise<Record<string, any>> {
    try {
      const [metrics, dashboardStats, visualizationStats] = await Promise.all([
        this.getBusinessMetrics(undefined, period),
        this.getDashboardStatistics(),
        this.getVisualizationStatistics()
      ]);

      return {
        period,
        metrics: this.aggregateMetrics(metrics),
        dashboardStats,
        visualizationStats,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting advanced analytics:', error);
      return {};
    }
  }

  private async getDashboardStatistics(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('analytics_dashboards')
        .select('is_public, created_at, tags');

      if (error) throw error;

      const stats = (data || []).reduce((acc: any, dashboard) => {
        acc.total++;
        if (dashboard.is_public) acc.public++;
        return acc;
      }, { total: 0, public: 0, private: 0 });

      stats.private = stats.total - stats.public;
      return stats;
    } catch (error) {
      console.error('Error getting dashboard statistics:', error);
      return {};
    }
  }

  private async getVisualizationStatistics(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('data_visualizations')
        .select('chart_type, is_active');

      if (error) throw error;

      const stats = (data || []).reduce((acc: any, viz) => {
        acc.total++;
        if (viz.is_active) acc.active++;
        acc.byType[viz.chart_type] = (acc.byType[viz.chart_type] || 0) + 1;
        return acc;
      }, { total: 0, active: 0, byType: {} });

      stats.inactive = stats.total - stats.active;
      return stats;
    } catch (error) {
      console.error('Error getting visualization statistics:', error);
      return {};
    }
  }

  private aggregateMetrics(metrics: BusinessMetric[]): Record<string, any> {
    return metrics.reduce((acc: any, metric) => {
      if (!acc[metric.metric_name]) {
        acc[metric.metric_name] = {
          values: [],
          total: 0,
          average: 0,
          count: 0
        };
      }
      
      acc[metric.metric_name].values.push({
        value: metric.metric_value,
        date: metric.created_at
      });
      acc[metric.metric_name].total += metric.metric_value;
      acc[metric.metric_name].count++;
      acc[metric.metric_name].average = acc[metric.metric_name].total / acc[metric.metric_name].count;
      
      return acc;
    }, {});
  }
}

export const businessIntelligenceService = new BusinessIntelligenceService();