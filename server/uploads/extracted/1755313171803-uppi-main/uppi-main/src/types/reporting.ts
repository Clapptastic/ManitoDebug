/**
 * Business Intelligence & Reporting Types
 * Phase 12 implementation for comprehensive reporting system
 */

// Chart and visualization types
export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'doughnut' 
  | 'area' 
  | 'scatter' 
  | 'radar' 
  | 'heatmap' 
  | 'funnel'
  | 'treemap';

export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export type DataSourceType = 
  | 'competitor_analyses'
  | 'business_plans' 
  | 'api_usage'
  | 'user_activity'
  | 'billing'
  | 'support_tickets'
  | 'custom_query';

// Core reporting interfaces
export interface CustomReport {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  query_config: ReportQueryConfig;
  chart_config: ChartConfig;
  schedule_config?: ReportScheduleConfig;
  is_shared: boolean;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportQueryConfig {
  data_source: DataSourceType;
  filters: ReportFilter[];
  group_by?: string[];
  aggregations: ReportAggregation[];
  date_range: {
    type: DateRange;
    start_date?: string;
    end_date?: string;
  };
  limit?: number;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
}

export interface ReportAggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct_count';
  alias?: string;
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  x_axis?: ChartAxis;
  y_axis?: ChartAxis;
  colors?: string[];
  show_legend?: boolean;
  show_labels?: boolean;
  animation?: boolean;
  responsive?: boolean;
}

export interface ChartAxis {
  label: string;
  field: string;
  format?: 'number' | 'currency' | 'percentage' | 'date';
  scale?: 'linear' | 'logarithmic';
}

export interface ReportScheduleConfig {
  frequency: ReportFrequency;
  recipients: string[];
  is_active: boolean;
  next_send_at?: string;
  format: 'pdf' | 'excel' | 'csv';
  include_chart: boolean;
}

// Dashboard and KPI interfaces
export interface BusinessDashboard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'kpi' | 'table' | 'metric';
  title: string;
  report_id?: string;
  config: WidgetConfig;
  position: WidgetPosition;
}

export interface WidgetConfig {
  refresh_interval?: number; // in minutes
  auto_refresh?: boolean;
  custom_query?: ReportQueryConfig;
  display_options?: {
    show_title?: boolean;
    show_border?: boolean;
    background_color?: string;
  };
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardLayout {
  grid_size: {
    columns: number;
    rows: number;
  };
  responsive_breakpoints?: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

// KPI and metrics interfaces
export interface KPIMetric {
  id: string;
  name: string;
  description?: string;
  value: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change_percentage?: number;
  period: string;
  category: KPICategory;
}

export type KPICategory = 
  | 'revenue'
  | 'growth'
  | 'engagement'
  | 'retention'
  | 'acquisition'
  | 'performance'
  | 'support'
  | 'satisfaction';

// Data export interfaces
export interface ExportRequest {
  report_id?: string;
  query_config?: ReportQueryConfig;
  format: 'csv' | 'excel' | 'pdf' | 'json';
  include_charts?: boolean;
  email_recipients?: string[];
}

export interface ExportJob {
  id: string;
  user_id: string;
  request: ExportRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// Analytics and insights interfaces
export interface BusinessInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'alert';
  title: string;
  description: string;
  data_source: DataSourceType;
  confidence_score: number;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  action_items?: string[];
  created_at: string;
}

export interface TrendAnalysis {
  metric: string;
  period: string;
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trend_strength: number; // 0-1
  forecast?: ForecastData[];
  seasonality_detected?: boolean;
}

export interface ForecastData {
  date: string;
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
}

// Request/Response types for API
export interface CreateReportRequest {
  name: string;
  description?: string;
  query_config: ReportQueryConfig;
  chart_config: ChartConfig;
  schedule_config?: ReportScheduleConfig;
  is_shared?: boolean;
}

export interface UpdateReportRequest {
  name?: string;
  description?: string;
  query_config?: ReportQueryConfig;
  chart_config?: ChartConfig;
  schedule_config?: ReportScheduleConfig;
  is_shared?: boolean;
}

export interface ExecuteReportRequest {
  report_id: string;
  parameters?: Record<string, any>;
}

export interface ReportExecutionResult {
  data: any[];
  metadata: {
    total_rows: number;
    execution_time_ms: number;
    query_hash: string;
    cached: boolean;
  };
  chart_data?: ChartDataPoint[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
  metadata?: Record<string, any>;
}

// Filter and search types
export interface ReportFilters {
  search?: string;
  category?: string[];
  data_source?: DataSourceType[];
  is_shared?: boolean;
  created_by?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface DashboardFilters {
  search?: string;
  is_default?: boolean;
  created_by?: string;
}

// Constants
export const CHART_TYPES: Array<{ value: ChartType; label: string; description: string }> = [
  { value: 'line', label: 'Line Chart', description: 'Show trends over time' },
  { value: 'bar', label: 'Bar Chart', description: 'Compare values across categories' },
  { value: 'pie', label: 'Pie Chart', description: 'Show part-to-whole relationships' },
  { value: 'doughnut', label: 'Doughnut Chart', description: 'Pie chart with center hole' },
  { value: 'area', label: 'Area Chart', description: 'Show cumulative values over time' },
  { value: 'scatter', label: 'Scatter Plot', description: 'Show correlation between variables' },
  { value: 'radar', label: 'Radar Chart', description: 'Compare multiple metrics' },
  { value: 'heatmap', label: 'Heatmap', description: 'Show intensity of data points' },
  { value: 'funnel', label: 'Funnel Chart', description: 'Show process flow and conversion' },
  { value: 'treemap', label: 'Treemap', description: 'Show hierarchical data' }
];

export const DATA_SOURCES: Array<{ value: DataSourceType; label: string; description: string }> = [
  { value: 'competitor_analyses', label: 'Competitor Analysis', description: 'Data from competitor research' },
  { value: 'business_plans', label: 'Business Plans', description: 'Business plan metrics and data' },
  { value: 'api_usage', label: 'API Usage', description: 'API call metrics and performance' },
  { value: 'user_activity', label: 'User Activity', description: 'User engagement and behavior' },
  { value: 'billing', label: 'Billing & Revenue', description: 'Financial and subscription data' },
  { value: 'support_tickets', label: 'Support Tickets', description: 'Customer support metrics' },
  { value: 'custom_query', label: 'Custom Query', description: 'Custom database queries' }
];

export const KPI_CATEGORIES: Array<{ value: KPICategory; label: string; color: string }> = [
  { value: 'revenue', label: 'Revenue', color: '#10B981' },
  { value: 'growth', label: 'Growth', color: '#3B82F6' },
  { value: 'engagement', label: 'Engagement', color: '#8B5CF6' },
  { value: 'retention', label: 'Retention', color: '#F59E0B' },
  { value: 'acquisition', label: 'Acquisition', color: '#EF4444' },
  { value: 'performance', label: 'Performance', color: '#06B6D4' },
  { value: 'support', label: 'Support', color: '#84CC16' },
  { value: 'satisfaction', label: 'Satisfaction', color: '#EC4899' }
];

export const REPORT_FREQUENCIES: Array<{ value: ReportFrequency; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' }
];

export const DATE_RANGES: Array<{ value: DateRange; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];