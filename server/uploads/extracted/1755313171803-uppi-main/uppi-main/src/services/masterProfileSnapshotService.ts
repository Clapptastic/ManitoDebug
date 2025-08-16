/**
 * MasterProfileSnapshotService
 * Stage 1 stub for snapshot/rollback; full DB + Storage integration in Stage 5.
 */
import { supabase } from '@/integrations/supabase/client';
import type { MasterProfileSnapshot } from '@/types/admin/master-profiles';

class MasterProfileSnapshotServiceImpl {
  /** List snapshots (Stage 1 returns empty). */
  async list(profileId: string): Promise<MasterProfileSnapshot[]> {
    void supabase; // placeholder; Stage 5 will query master_profile_snapshots
    return [];
  }

  /** Create a snapshot (Stage 1 no-op). */
  async create(profileId: string, snapshot: Record<string, unknown>): Promise<boolean> {
    console.info('[SnapshotService:create] Deferred to Stage 5', { profileId, snapshot });
    return false;
  }

  /** Restore snapshot (Stage 1 no-op). */
  async restore(profileId: string, snapshotId: string): Promise<boolean> {
    console.info('[SnapshotService:restore] Deferred to Stage 5', { profileId, snapshotId });
    return false;
  }
}

export const MasterProfileSnapshotService = new MasterProfileSnapshotServiceImpl();
export type MasterProfileSnapshotServiceType = typeof MasterProfileSnapshotService;
