import { useState, useEffect } from 'react';
import { 
  businessIntelligenceService,
  AnalyticsDashboard,
  DataVisualization,
  ScheduledExport,
  BusinessMetric,
  CreateDashboardRequest,
  CreateVisualizationRequest,
  CreateExportRequest
} from '@/services/core/businessIntelligenceService';
import { toast } from 'sonner';

interface UseBusinessIntelligenceReturn {
  // Dashboards
  dashboards: AnalyticsDashboard[];
  selectedDashboard: AnalyticsDashboard | null;
  setSelectedDashboard: (dashboard: AnalyticsDashboard | null) => void;
  createDashboard: (data: CreateDashboardRequest) => Promise<AnalyticsDashboard | null>;
  updateDashboard: (id: string, updates: Partial<CreateDashboardRequest>) => Promise<boolean>;
  deleteDashboard: (id: string) => Promise<boolean>;
  
  // Visualizations
  visualizations: DataVisualization[];
  createVisualization: (data: CreateVisualizationRequest) => Promise<DataVisualization | null>;
  updateVisualization: (id: string, updates: Partial<CreateVisualizationRequest>) => Promise<boolean>;
  deleteVisualization: (id: string) => Promise<boolean>;
  
  // Exports
  scheduledExports: ScheduledExport[];
  createScheduledExport: (data: CreateExportRequest) => Promise<ScheduledExport | null>;
  exportDashboard: (dashboardId: string, format?: 'csv' | 'json' | 'pdf') => Promise<string | null>;
  
  // Metrics & Analytics
  businessMetrics: BusinessMetric[];
  advancedAnalytics: Record<string, any>;
  loadAnalytics: (period?: string) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  refreshAll: () => Promise<void>;
}

export function useBusinessIntelligence(): UseBusinessIntelligenceReturn {
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<AnalyticsDashboard | null>(null);
  const [visualizations, setVisualizations] = useState<DataVisualization[]>([]);
  const [scheduledExports, setScheduledExports] = useState<ScheduledExport[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([]);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedDashboard) {
      loadVisualizationsForDashboard(selectedDashboard.id);
    } else {
      setVisualizations([]);
    }
  }, [selectedDashboard]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadDashboards(),
        loadScheduledExports(),
        loadBusinessMetrics(),
        loadAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading business intelligence data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboards = async () => {
    try {
      const data = await businessIntelligenceService.getDashboards(true);
      setDashboards(data);
      
      // Auto-select first dashboard if none selected
      if (!selectedDashboard && data.length > 0) {
        setSelectedDashboard(data[0]);
      }
    } catch (error) {
      console.error('Error loading dashboards:', error);
    }
  };

  const loadVisualizationsForDashboard = async (dashboardId: string) => {
    try {
      const data = await businessIntelligenceService.getVisualizations(dashboardId);
      setVisualizations(data);
    } catch (error) {
      console.error('Error loading visualizations:', error);
    }
  };

  const loadScheduledExports = async () => {
    try {
      const data = await businessIntelligenceService.getScheduledExports();
      setScheduledExports(data);
    } catch (error) {
      console.error('Error loading scheduled exports:', error);
    }
  };

  const loadBusinessMetrics = async () => {
    try {
      const data = await businessIntelligenceService.getBusinessMetrics();
      setBusinessMetrics(data);
    } catch (error) {
      console.error('Error loading business metrics:', error);
    }
  };

  const loadAnalytics = async (period: string = '30d') => {
    try {
      const data = await businessIntelligenceService.getAdvancedAnalytics(period);
      setAdvancedAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const createDashboard = async (data: CreateDashboardRequest): Promise<AnalyticsDashboard | null> => {
    try {
      const newDashboard = await businessIntelligenceService.createDashboard(data);
      if (newDashboard) {
        setDashboards(prev => [newDashboard, ...prev]);
        setSelectedDashboard(newDashboard);
        toast.success('Dashboard created successfully');
      }
      return newDashboard;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast.error('Failed to create dashboard');
      return null;
    }
  };

  const updateDashboard = async (id: string, updates: Partial<CreateDashboardRequest>): Promise<boolean> => {
    try {
      const success = await businessIntelligenceService.updateDashboard(id, updates);
      if (success) {
        setDashboards(prev => prev.map(dash => 
          dash.id === id ? { ...dash, ...updates } : dash
        ));
        if (selectedDashboard?.id === id) {
          setSelectedDashboard(prev => prev ? { ...prev, ...updates } : null);
        }
        toast.success('Dashboard updated successfully');
      }
      return success;
    } catch (error) {
      console.error('Error updating dashboard:', error);
      toast.error('Failed to update dashboard');
      return false;
    }
  };

  const deleteDashboard = async (id: string): Promise<boolean> => {
    try {
      const success = await businessIntelligenceService.deleteDashboard(id);
      if (success) {
        setDashboards(prev => prev.filter(dash => dash.id !== id));
        if (selectedDashboard?.id === id) {
          setSelectedDashboard(null);
        }
        toast.success('Dashboard deleted successfully');
      }
      return success;
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast.error('Failed to delete dashboard');
      return false;
    }
  };

  const createVisualization = async (data: CreateVisualizationRequest): Promise<DataVisualization | null> => {
    try {
      const newViz = await businessIntelligenceService.createVisualization(data);
      if (newViz) {
        setVisualizations(prev => [...prev, newViz]);
        toast.success('Visualization created successfully');
      }
      return newViz;
    } catch (error) {
      console.error('Error creating visualization:', error);
      toast.error('Failed to create visualization');
      return null;
    }
  };

  const updateVisualization = async (id: string, updates: Partial<CreateVisualizationRequest>): Promise<boolean> => {
    try {
      const success = await businessIntelligenceService.updateVisualization(id, updates);
      if (success) {
        setVisualizations(prev => prev.map(viz => 
          viz.id === id ? { ...viz, ...updates } : viz
        ));
        toast.success('Visualization updated successfully');
      }
      return success;
    } catch (error) {
      console.error('Error updating visualization:', error);
      toast.error('Failed to update visualization');
      return false;
    }
  };

  const deleteVisualization = async (id: string): Promise<boolean> => {
    try {
      const success = await businessIntelligenceService.deleteVisualization(id);
      if (success) {
        setVisualizations(prev => prev.filter(viz => viz.id !== id));
        toast.success('Visualization deleted successfully');
      }
      return success;
    } catch (error) {
      console.error('Error deleting visualization:', error);
      toast.error('Failed to delete visualization');
      return false;
    }
  };

  const createScheduledExport = async (data: CreateExportRequest): Promise<ScheduledExport | null> => {
    try {
      const newExport = await businessIntelligenceService.createScheduledExport(data);
      if (newExport) {
        setScheduledExports(prev => [newExport, ...prev]);
        toast.success('Scheduled export created successfully');
      }
      return newExport;
    } catch (error) {
      console.error('Error creating scheduled export:', error);
      toast.error('Failed to create scheduled export');
      return null;
    }
  };

  const exportDashboard = async (dashboardId: string, format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<string | null> => {
    try {
      const exportData = await businessIntelligenceService.exportDashboardData(dashboardId, format);
      if (exportData) {
        // In a real implementation, this would trigger a download
        toast.success(`Dashboard exported as ${format.toUpperCase()}`);
      }
      return exportData;
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      toast.error('Failed to export dashboard');
      return null;
    }
  };

  const refreshAll = async () => {
    await loadAllData();
  };

  return {
    dashboards,
    selectedDashboard,
    setSelectedDashboard,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    visualizations,
    createVisualization,
    updateVisualization,
    deleteVisualization,
    scheduledExports,
    createScheduledExport,
    exportDashboard,
    businessMetrics,
    advancedAnalytics,
    loadAnalytics,
    isLoading,
    refreshAll
  };
}

// Specific hook for metrics tracking
export function useMetricsTracking() {
  const trackMetric = async (metricName: string, value: number, metricType: string = 'count', dimensions?: Record<string, any>) => {
    try {
      // In a real implementation, this would call the business intelligence service
      // to record metrics that would be processed by background jobs
      console.log('Tracking metric:', { metricName, value, metricType, dimensions });
    } catch (error) {
      console.error('Error tracking metric:', error);
    }
  };

  return { trackMetric };
}