/**
 * MasterProfileAuditService
 * Stage 1 stub for admin edit auditing; full DB write in Stage 5.
 */
import { supabase } from '@/integrations/supabase/client';
import type { MasterProfileAuditEntry } from '@/types/admin/master-profiles';

class MasterProfileAuditServiceImpl {
  /** List recent audit entries for a profile (Stage 1 returns empty). */
  async list(profileId: string): Promise<MasterProfileAuditEntry[]> {
    void supabase; // placeholder; Stage 5 will query master_profile_audit
    return [];
  }

  /** Record an audit entry (Stage 1 no-op). */
  async record(profileId: string, changeSet: Record<string, unknown>): Promise<boolean> {
    console.info('[AuditService:record] Deferred to Stage 5', { profileId, changeSet });
    return false;
  }
}

export const MasterProfileAuditService = new MasterProfileAuditServiceImpl();
export type MasterProfileAuditServiceType = typeof MasterProfileAuditService;
