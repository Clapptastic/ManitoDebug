export interface SystemHealthData {
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime: number;
  response_time: number;
  last_check: string;
  components: SystemComponent[];
  performanceMetrics: SystemPerformanceMetric[];
  alerts: SystemAlert[];
  lastUpdated: string;
}

export interface SystemComponent {
  id: string;
  name: string;
  description?: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime_percentage?: number;
  response_time?: number;
  last_checked?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  component?: string;
  created_at: string;
  resolved?: boolean;
}

export interface SystemPerformanceMetric {
  id: string;
  metric_name: string;
  value: number;
  unit: string;
  timestamp: string;
  component_id?: string;
}

export type SystemHealthStatus = SystemHealthData['status'];