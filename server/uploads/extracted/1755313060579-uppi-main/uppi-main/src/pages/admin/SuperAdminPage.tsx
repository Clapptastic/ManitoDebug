import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Settings, Loader2 } from 'lucide-react';
import { AdminSystemDiagnostics } from '@/components/admin/AdminSystemDiagnostics';
import { Switch } from '@/components/ui/switch';
import { featureFlagService, type FeatureFlag } from '@/services/featureFlagService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { Helmet } from 'react-helmet-async';

export default function SuperAdminPage() {
  // Super Admin global toggle for Competitor Analysis (kill-switch)
const [flag, setFlag] = useState<FeatureFlag | null>(null);
const [loading, setLoading] = useState<boolean>(true);
const [updating, setUpdating] = useState<boolean>(false);
const [migrating, setMigrating] = useState<boolean>(false);
const [migrationSummary, setMigrationSummary] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const f = await featureFlagService.getFeatureFlag('competitor_analysis');
        if (mounted) setFlag(f);
      } catch (e) {
        console.error('Failed to load competitor_analysis flag', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleFlag = async (checked: boolean) => {
    if (!flag) return;
    try {
      setUpdating(true);
      const updated = await featureFlagService.updateFeatureFlag('competitor_analysis', {
        is_enabled: checked,
        updated_at: new Date().toISOString()
      });
      setFlag(updated);
      toast.success(`Competitor Analysis ${checked ? 'enabled' : 'disabled'}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update flag');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Migrate all users' API keys into Supabase Vault via Edge Function.
   * Security:
   * - Requires Supabase Vault enabled
   * - Edge function enforces auth and admin checks for 'all' scope
   * Observability:
   * - Summary displayed in-page and details available in function logs
   */
  const migrateToVault = async () => {
    try {
      setMigrating(true);
      setMigrationSummary(null);
      // TODO: Function 'migrate-api-keys' does not exist - fix or implement
      // const { data, error } = await supabase.functions.invoke('migrate-api-keys', {
      //   body: { scope: 'all' }
      // });
      const data = null, error = new Error('migrate-api-keys function does not exist');
      if (error) throw error;
      const totals = (data as any)?.totals ?? {};
      setMigrationSummary(
        `migratedToVault=${totals.migratedToVault ?? 0}, skipped=${totals.skippedNoPlaintext ?? 0}, errors=${totals.errors ?? 0}`
      );
      toast.success('Vault migration completed');
    } catch (e: any) {
      toast.error(e?.message || 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Super Admin Dashboard | API Key Vault Migration</title>
        <meta name="description" content="Manage feature flags and migrate API keys to Supabase Vault securely." />
        <link rel="canonical" href="/admin/super-admin" />
      </Helmet>
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide administration and monitoring</p>
        </div>
      </div>

      {/* Global Competitor Analysis Kill-Switch */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Competitor Analysis Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading flag...
            </div>
          ) : flag ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Global enable/disable for competitor analysis (kill-switch)
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!flag.is_enabled}
                  onCheckedChange={toggleFlag}
                  disabled={updating}
                />
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Flag not found. It will appear once configured in the database.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* API Keys → Vault Migration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Keys → Vault Migration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Moves all users' API keys into Supabase Vault (requires Vault enabled).
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={migrateToVault} disabled={migrating}>
                {migrating ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Migrating...</span>
                ) : (
                  'Migrate to Vault'
                )}
              </Button>
            </div>
          </div>
          {migrationSummary && (
            <div className="mt-2 text-xs text-muted-foreground">
              {migrationSummary}
            </div>
          )}
        </CardContent>
      </Card>
      
      <AdminSystemDiagnostics autoRun={false} />
    </div>
  );
}
