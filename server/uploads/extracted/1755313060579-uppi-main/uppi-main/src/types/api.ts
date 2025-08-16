export interface ApiKeyData {
  id: string;
  provider: string;
  status: 'active' | 'inactive' | 'expired';
  masked_key: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CompetitorData {
  id: string;
  name: string;
  url?: string;
  description?: string;
  industry?: string;
  strengths?: string[];
  weaknesses?: string[];
  pricing?: Record<string, unknown>;
  features?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AnalysisProgress {
  sessionId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentCompetitor: string;
  completedCount: number;
  totalCount: number;
  results: CompetitorAnalysisResult[];
  error?: string;
  progress: number;
  statusMessage: string;
}

export interface CompetitorAnalysisResult {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  pricing: Record<string, unknown>;
  features: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface SavedAnalysis {
  id: string;
  name: string;
  description: string;
  results: CompetitorAnalysisResult[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface DiagnosticResult {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface ApiStatusData {
  status: 'active' | 'inactive' | 'warning' | 'error';
  lastChecked: string;
  responseTime?: number;
  message?: string;
}