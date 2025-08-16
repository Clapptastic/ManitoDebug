/**
 * Feature Flag Manager Component
 * Admin interface for managing feature flags
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Settings, Eye, EyeOff } from 'lucide-react';
import { featureFlagService, FeatureFlag, FEATURE_FLAGS } from '@/services/featureFlagService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/lib/supabase/client';

export const FeatureFlagManager = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [scopeType, setScopeType] = useState<'global' | 'organization' | 'user'>('global');
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newFlagName, setNewFlagName] = useState('');

  const loadFlags = async () => {
    try {
      setLoading(true);
      const dbFlags = await featureFlagService.getAllFeatureFlags();
      const known = Array.from(new Set<string>([
        ...Object.values(FEATURE_FLAGS),
        ...dbFlags.map((f) => f.flag_name),
      ]));
      const byName = new Map(dbFlags.map((f) => [f.flag_name, f] as const));
      const merged: FeatureFlag[] = known.map((name) =>
        byName.get(name) ?? {
          id: `placeholder:${name}`,
          flag_name: name,
          is_enabled: false,
          description: '',
          metadata: {},
          target_audience: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ).sort((a, b) => a.flag_name.localeCompare(b.flag_name));

      setFlags(merged);
    } catch (error) {
      toast({ title: 'Failed to load feature flags', variant: 'destructive' });
      console.error('Error loading feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flagName: string, newValue: boolean) => {
    try {
      setUpdating(flagName);
      const updated = await featureFlagService.updateFeatureFlag(
        flagName,
        {
          is_enabled: newValue,
          updated_at: new Date().toISOString()
        },
        {
          scopeType,
          scopeId: scopeType === 'organization' ? selectedOrgId : scopeType === 'user' ? currentUserId : null
        }
      );

      if (updated) {
        setFlags(prev => prev.map(flag => 
          flag.flag_name === flagName 
            ? { ...flag, is_enabled: newValue }
            : flag
        ));
        toast({ title: `Feature flag ${flagName} ${newValue ? 'enabled' : 'disabled'}` });
      } else {
        toast({ title: 'Failed to update feature flag', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error updating feature flag', variant: 'destructive' });
      console.error('Error updating feature flag:', error);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  useEffect(() => {
    // Load current user and organizations for scope selection
    (async () => {
      try {
        const user = await getCurrentUser();
        const uid = user?.id ?? null;
        setCurrentUserId(uid);
        if (uid) {
          const { data, error } = await supabase.rpc('get_user_organizations', { user_id_param: uid });
          if (error) {
            console.warn('Failed to fetch organizations', error.message);
            return;
          }
          const orgs = (data || []).map((o: any) => ({ id: o.id, name: o.name }));
          setOrganizations(orgs);
          if (orgs.length > 0) setSelectedOrgId(orgs[0].id);
        }
      } catch (e) {
        console.warn('Error loading user/orgs', e);
      }
    })();
  }, []);

  const getAudienceBadgeColor = (audience: string) => {
    switch (audience) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'secondary';
      case 'user': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading feature flags...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="feature-flag-manager">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feature Flags</h2>
          <p className="text-muted-foreground">
            Manage feature availability across the platform
          </p>
        </div>
        <Button 
          onClick={loadFlags} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Scope & Create controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Scope & New Flag</CardTitle>
          <CardDescription>Choose where updates apply and optionally create a new flag.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex flex-col">
              <label className="text-sm text-muted-foreground">Scope</label>
              <select
                className="border border-border rounded-md px-3 py-2 bg-background"
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value as 'global' | 'organization' | 'user')}
              >
                <option value="global">Global</option>
                <option value="organization">Organization</option>
                <option value="user">User</option>
              </select>
            </div>
            {scopeType === 'organization' && (
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground">Organization</label>
                <select
                  className="border border-border rounded-md px-3 py-2 bg-background min-w-[220px]"
                  value={selectedOrgId ?? ''}
                  onChange={(e) => setSelectedOrgId(e.target.value || null)}
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}
            {scopeType === 'user' && (
              <div className="flex flex-col">
                <label className="text-sm text-muted-foreground">User ID</label>
                <input
                  className="border border-border rounded-md px-3 py-2 bg-background min-w-[280px]"
                  value={currentUserId ?? ''}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                  placeholder="User UUID"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              className="border border-border rounded-md px-3 py-2 bg-background min-w-[240px]"
              value={newFlagName}
              onChange={(e) => setNewFlagName(e.target.value.trimStart())}
              placeholder="New flag key (e.g., my_feature)"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!newFlagName}
              onClick={async () => {
                try {
                  await featureFlagService.updateFeatureFlag(
                    newFlagName,
                    { is_enabled: false },
                    { scopeType, scopeId: scopeType === 'organization' ? selectedOrgId : scopeType === 'user' ? currentUserId : null }
                  );
                  toast({ title: 'Flag created' });
                  setNewFlagName('');
                  loadFlags();
                } catch (e) {
                  toast({ title: 'Failed to create flag', variant: 'destructive' });
                }
              }}
            >
              Create Flag
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {flag.flag_name}
                  </CardTitle>
                  {flag.description && (
                    <CardDescription>{flag.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getAudienceBadgeColor(flag.target_audience)}>
                    {flag.target_audience}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {flag.is_enabled ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={(checked) => handleToggleFlag(flag.flag_name, checked)}
                      disabled={updating === flag.flag_name}
                    />
                    {updating === flag.flag_name && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Status: {flag.is_enabled ? (
                    <span className="text-green-600 font-medium">Enabled</span>
                  ) : (
                    <span className="text-red-600 font-medium">Disabled</span>
                  )}
                </span>
                <span>
                  Updated: {new Date(flag.updated_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {flags.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Feature Flags Found</h3>
            <p className="text-muted-foreground">
              Feature flags will appear here once they are configured.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};