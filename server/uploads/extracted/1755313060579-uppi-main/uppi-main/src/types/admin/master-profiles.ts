/**
 * Admin types for Master Profiles (single source of truth)
 *
 * NOTE: Keep these interfaces aligned with DB types and UI needs.
 * Avoid using `any`; prefer explicit fields or `Record<string, unknown>`.
 */

export type FeatureScope = 'global' | 'organization' | 'user' | 'default';

/** Feature flag descriptor */
export interface FeatureFlag {
  flag_key: string; // e.g., 'master_profiles'
  description?: string;
  default_enabled: boolean; // Project default for the flag
}

/** Computed, effective state of a feature flag for a caller */
export interface EffectiveFeatureState {
  enabled: boolean;
  source: FeatureScope; // which scope produced the final value
}

/** Minimal core fields for a master company profile */
export interface MasterCompanyProfileAdminCore {
  id: string;
  company_name: string;
  website_url?: string | null;
  industry?: string | null;
  description?: string | null;
  overall_confidence_score?: number | null;
  validation_status?: string | null; // 'validated' | 'pending' | 'failed' | etc.
  updated_at: string;
  last_validation_date?: string;
  employee_count?: number | null;
  revenue_estimate?: number | null;
  source_analyses?: Array<{ analysis_id: string; provider?: string }>; // summarized
}

/** Flow monitoring event captured for visualization */
export interface FlowEvent {
  id: string;
  user_id?: string;
  analysis_id?: string;
  company_profile_id?: string;
  stage:
    | 'gate'
    | 'orchestration'
    | 'provider_run'
    | 'provider_result'
    | 'aggregation'
    | 'combined'
    | 'master_profile';
  status: 'ok' | 'warn' | 'error';
  component: string; // function/table/component name
  error?: { message: string; code?: string } | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

/** Audit entry for admin edits */
export interface MasterProfileAuditEntry {
  id: string;
  profile_id: string;
  actor_id: string;
  change_set: Record<string, unknown>; // diff of changes
  created_at: string;
}

/** Snapshot for rollback */
export interface MasterProfileSnapshot {
  id: string;
  profile_id: string;
  version: number;
  snapshot: Record<string, unknown>;
  created_at: string;
}

/** Admin overlay metrics to enrich detail view */
export interface MasterProfileAdminOverlayMetrics {
  analyses_count: number;
  source_providers: string[];
  field_update_counts: Record<string, number>; // field -> updates count (last 30 days)
}

export type { MasterCompanyProfileAdminCore as MasterCompanyProfile };
