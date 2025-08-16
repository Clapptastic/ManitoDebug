/**
 * Unified Type System - Single Source of Truth
 * Consolidates all type definitions to eliminate conflicts
 */

// Core Enums - Single source of truth
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  GUEST = 'guest'
}

export enum ComponentStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  OUTAGE = 'outage',
  MAINTENANCE = 'maintenance'
}

export enum ApiStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  DOWN = 'down',
  MAINTENANCE = 'maintenance',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending'
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// User Types - Unified
export interface BaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends BaseUser {
  user_metadata?: {
    role?: UserRole;
    full_name?: string;
    [key: string]: any;
  };
}

export interface UserProfile extends BaseUser {
  full_name?: string;
  avatar_url?: string;
  role?: UserRole;
  is_active?: boolean;
  last_sign_in_at?: string;
}

export interface User extends UserProfile {
  role: UserRole;
  is_active: boolean;
}

// Authentication Types
export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user: AuthUser;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  initialized: boolean;
}

// Permission Types
export interface UserPermissions {
  canManageUsers: boolean;
  canManageSystem: boolean;
  canViewAnalytics: boolean;
  canManageApiKeys: boolean;
  canAccessAdmin: boolean;
}

export const rolePermissions: Record<UserRole, UserPermissions> = {
  [UserRole.USER]: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAnalytics: false,
    canManageApiKeys: true,
    canAccessAdmin: false
  },
  [UserRole.ADMIN]: {
    canManageUsers: true,
    canManageSystem: false,
    canViewAnalytics: true,
    canManageApiKeys: true,
    canAccessAdmin: true
  },
  [UserRole.SUPER_ADMIN]: {
    canManageUsers: true,
    canManageSystem: true,
    canViewAnalytics: true,
    canManageApiKeys: true,
    canAccessAdmin: true
  },
  [UserRole.GUEST]: {
    canManageUsers: false,
    canManageSystem: false,
    canViewAnalytics: false,
    canManageApiKeys: false,
    canAccessAdmin: false
  }
};

// API Types
export interface ApiStatusInfo {
  status: ApiStatus;
  isWorking: boolean;
  lastChecked?: string;
  errorMessage?: string;
  responseTime?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: Error | string;
  message?: string;
}

// System Health Types moved to src/types/system-health.ts to avoid duplicates
// Import from there: import { SystemHealthData, SystemComponent } from '@/types/system-health';

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  resolved?: boolean;
}

// Error Types
export interface TrackedError {
  id: string;
  message: string;
  source: string;
  timestamp: string;
  handled: boolean;
  stack?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorReport {
  id: string;
  error_id: string;
  user_id?: string;
  context: Record<string, any>;
  created_at: string;
}

// Database Types
export interface QueryMetric {
  id: string;
  query: string;
  execution_time_ms: number;
  rows_affected?: number;
  timestamp: string;
  user_id?: string;
}

export interface TableStats {
  table_name: string;
  row_count: number;
  size_mb: number;
  last_analyzed: string;
}

// Utility Types
export type DatabaseTable = 
  | 'users' 
  | 'api_keys' 
  | 'competitor_analysis' 
  | 'user_roles' 
  | 'system_health' 
  | 'error_logs'
  | 'organizations';

export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  direction: SortDirection;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface DataFetchOptions {
  sort?: SortOptions;
  pagination?: PaginationOptions;
  filters?: FilterOptions;
}

// Legacy type aliases for backward compatibility
export type UserRoleString = keyof typeof UserRole;
export type ComponentStatusType = ComponentStatus;
export type ApiStatusType = ApiStatus;

// Display names for enums
export const userRoleDisplayNames: Record<UserRole, string> = {
  [UserRole.USER]: 'User',
  [UserRole.ADMIN]: 'Admin', 
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.GUEST]: 'Guest'
};

export const componentStatusDisplayNames: Record<ComponentStatus, string> = {
  [ComponentStatus.OPERATIONAL]: 'Operational',
  [ComponentStatus.DEGRADED]: 'Degraded',
  [ComponentStatus.OUTAGE]: 'Outage',
  [ComponentStatus.MAINTENANCE]: 'Maintenance'
};

export const apiStatusDisplayNames: Record<ApiStatus, string> = {
  [ApiStatus.OPERATIONAL]: 'Operational',
  [ApiStatus.DEGRADED]: 'Degraded',
  [ApiStatus.DOWN]: 'Down',
  [ApiStatus.MAINTENANCE]: 'Maintenance',
  [ApiStatus.ACTIVE]: 'Active',
  [ApiStatus.INACTIVE]: 'Inactive',
  [ApiStatus.ERROR]: 'Error',
  [ApiStatus.PENDING]: 'Pending'
};

// API Key Types - Re-exported from unified API types
export * from '../api-keys/unified';