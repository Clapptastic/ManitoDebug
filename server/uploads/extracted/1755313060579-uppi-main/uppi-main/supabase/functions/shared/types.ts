import type { ApiResponse as SharedApiResponse } from '../_shared/types.ts';

export interface AnalyzeCompetitorRequest {
  competitor: string;
  userId: string;
  enabledApis: string[];
  mode?: 'full_analysis' | 'find_similar' | 'basic';
  includeSourceAttribution?: boolean;
}

// Single source of truth for ApiResponse
export type ApiResponse<T = any> = SharedApiResponse<T>;

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

