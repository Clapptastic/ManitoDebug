
export type UserRole = 'user' | 'admin' | 'super_admin';
export type ApiStatus = 'active' | 'inactive' | 'error' | 'pending';
export type ComponentStatus = 'operational' | 'degraded' | 'down' | 'maintenance';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  organization_id?: string;
  provider: string;
  api_key: string;
  masked_key: string;
  status: ApiStatus;
  last_validated?: string;
  error_message?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetitorAnalysis {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  status: AnalysisStatus;
  website_url?: string;
  industry?: string;
  description?: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  business_model?: string;
  target_market: string[];
  pricing_strategy: Record<string, any>;
  market_position?: string;
  funding_info: Record<string, any>;
  employee_count?: number;
  founded_year?: number;
  headquarters?: string;
  data_quality_score: number;
  analysis_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface SystemComponent {
  id: string;
  name: string;
  description?: string;
  status: ComponentStatus;
  uptime_percentage: number;
  response_time?: number;
  last_checked: string;
  created_at: string;
  updated_at: string;
}

export interface Documentation {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  version?: string;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
