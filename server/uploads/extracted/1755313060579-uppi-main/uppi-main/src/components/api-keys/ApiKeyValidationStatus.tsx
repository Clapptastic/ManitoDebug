
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Clock, Zap } from 'lucide-react';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { ApiKeyType } from '@/types/api-keys/unified';
import { toast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { unifiedApiKeyService, type ApiKeyStatus } from '@/services/api-keys/unifiedApiKeyService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useProviderUsage } from '@/hooks/useProviderUsage';
interface ApiKeyValidationStatusProps {
  onValidate?: (provider: ApiKeyType) => void;
}

type UsageProvider = 'openai' | 'anthropic';

const ProviderUsageRow: React.FC<{ provider: UsageProvider }> = ({ provider }) => {
  const { usage, isLoading, error } = useProviderUsage(provider);
  if (isLoading) return <div className="text-xs text-muted-foreground">Loading {provider} usage…</div>;
  if (error) return <div className="text-xs text-red-600">Usage error: {error}</div>;
  if (!usage) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium capitalize">{provider} usage</span>
        <span className="text-muted-foreground">
          {usage.usage.used} / {usage.usage.limit} {usage.usage.currency} ({usage.usage.period})
        </span>
      </div>
      <Progress value={Math.min(100, usage.usage.percentage)} className="h-2" />
    </div>
  );
};

export const ApiKeyValidationStatus: React.FC<ApiKeyValidationStatusProps> = ({ onValidate }) => {
  const { apiKeys, isLoading: managerLoading } = useUnifiedApiKeys();
  const [validationStates, setValidationStates] = useState<Record<string, boolean>>({});
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ApiKeyStatus>>({});
  const [lastValidationTime, setLastValidationTime] = useState<Date | null>(null);

  // Cost & usage state for providers
  const [providerCosts, setProviderCosts] = useState<Record<string, { costPer1k: number | null; monthlyAllotment: number | null; updatedAt?: string }>>({});
  const [costInputs, setCostInputs] = useState<Record<string, string>>({});
  const [allotInputs, setAllotInputs] = useState<Record<string, string>>({});
  const [providerUsageUSD, setProviderUsageUSD] = useState<Record<string, number>>({});
  const [savingProvider, setSavingProvider] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);

  // Wrapper for RPC calls - IMPORTANT: call supabase.rpc directly to preserve `this` context
  // Detaching the method (e.g., const fn = supabase.rpc) would lose context and break with
  // "Cannot read properties of undefined (reading 'rest')" inside supabase-js.
  const callRpc = React.useCallback(
    async <T = unknown>(fn: string, args?: Record<string, unknown>) => {
      const { data, error } = await supabase.rpc(fn as any, args as any);
      return { data: data as T | null, error } as { data: T | null; error: unknown };
    },
    []
  );

  // Load provider statuses on mount and when API keys change
  useEffect(() => {
    loadProviderStatuses();
  }, [apiKeys.length]);

  const loadProviderStatuses = async () => {
    try {
      const statuses = await unifiedApiKeyService.getAllProviderStatuses();
      setProviderStatuses(statuses);
      setLastValidationTime(new Date());
    } catch (error) {
      console.error('Error loading provider statuses:', error);
    }
  };

  // Load per-provider cost settings and usage
  const loadProviderCostsAndUsage = async () => {
    try {
      const { data: authInfo } = await supabase.auth.getUser();
      const uid = authInfo?.user?.id || null;
      setUserId(uid);
      if (!uid) return;

      // Costs
      const { data: costsData } = await callRpc<any[]>('get_user_provider_costs');
      if (costsData) {
        const mapped: Record<string, { costPer1k: number | null; monthlyAllotment: number | null; updatedAt?: string }> = {};
        const costInputsInit: Record<string, string> = {};
        const allotInputsInit: Record<string, string> = {};
        costsData.forEach((row: any) => {
          mapped[row.provider] = {
            costPer1k: row.cost_per_1k_tokens == null ? null : Number(row.cost_per_1k_tokens),
            monthlyAllotment: row.monthly_token_allotment == null ? null : Number(row.monthly_token_allotment),
            updatedAt: row.updated_at
          };
          if (mapped[row.provider].costPer1k != null) costInputsInit[row.provider] = String(mapped[row.provider].costPer1k);
          if (mapped[row.provider].monthlyAllotment != null) allotInputsInit[row.provider] = String(mapped[row.provider].monthlyAllotment);
        });
        setProviderCosts(mapped);
        setCostInputs(costInputsInit);
        setAllotInputs(allotInputsInit);
      }

      // Usage this month (USD)
      const start = new Date();
      start.setDate(1);
      const startStr = start.toISOString().slice(0, 10);
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: usageRows } = await supabase
        .from('api_usage_costs')
        .select('provider,cost_usd,date,user_id')
        .gte('date', startStr)
        .lte('date', todayStr)
        .eq('user_id', uid);
      if (usageRows) {
        const sums: Record<string, number> = {};
        (usageRows as any[]).forEach((r) => {
          const p = r.provider || 'unknown';
          sums[p] = (sums[p] || 0) + Number(r.cost_usd || 0);
        });
        setProviderUsageUSD(sums);
      }
    } catch (e) {
      console.warn('Could not load provider costs/usage', e);
    }
  };

  useEffect(() => {
    loadProviderCostsAndUsage();
  }, []);
  const getStatusIcon = (status: ApiKeyStatus, isValidating: boolean = false) => {
    if (isValidating) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    
    if (!status.exists) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    
    if (status.isWorking && status.status === 'active') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (status.status === 'pending') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: ApiKeyStatus, isValidating: boolean = false) => {
    if (isValidating) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Validating...</Badge>;
    }
    
      if (!status.exists) {
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Not Set</Badge>;
      }
      
      if (status.isWorking && status.status === 'active') {
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">✅ Active</Badge>;
      }
      
      if (status.status === 'pending') {
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">⏳ Testing</Badge>;
      }
      
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">❌ Error</Badge>;
  };

  const handleValidateKey = async (provider: ApiKeyType) => {
    const status = providerStatuses[provider];
    if (!status?.exists) {
      toast({
        title: 'No API Key Found',
        description: `${provider} API key is not configured. Add your API key using the "Manage Keys" tab.`,
        variant: 'destructive',
      });
      return;
    }
    
    setValidationStates(prev => ({ ...prev, [provider]: true }));
    
    try {
      console.log(`🔍 Validating ${provider} API key...`);
      await unifiedApiKeyService.validateAndUpdateProviderStatus(provider);
      await loadProviderStatuses();
      
      const updatedStatus = providerStatuses[provider];
      if (updatedStatus?.isWorking) {
        toast({
          title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Validated`,
          description: `✅ API key is active and working correctly.`,
          variant: 'default',
        });
      } else {
        toast({
          title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Validation Failed`,
          description: `❌ ${updatedStatus?.errorMessage || 'API key is invalid or service is unreachable. Please verify your key in the provider dashboard.'}`,
          variant: 'destructive',
        });
      }
      
      if (onValidate) {
        onValidate(provider);
      }
    } catch (error) {
      console.error(`❌ Validation failed for ${provider}:`, error);
      toast({
        title: 'Validation Error',
        description: `Unable to validate ${provider} API key. Check your internet connection and try again.`,
        variant: 'destructive',
      });
    } finally {
      setValidationStates(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleValidateAll = async () => {
    const existingProviders = Object.keys(providerStatuses).filter(
      provider => providerStatuses[provider]?.exists
    );
    
    if (existingProviders.length === 0) {
      toast({
        title: 'No API Keys Configured',
        description: 'Add API keys using the "Manage Keys" tab before testing.',
        variant: 'destructive',
      });
      return;
    }

    // Set all keys as validating
    const validatingStates = existingProviders.reduce((acc, provider) => ({
      ...acc,
      [provider]: true
    }), {});
    setValidationStates(validatingStates);

    let successCount = 0;
    let failureCount = 0;

    // Validate each key
    for (const provider of existingProviders) {
      try {
        await unifiedApiKeyService.validateAndUpdateProviderStatus(provider as ApiKeyType);
        await loadProviderStatuses();
        
        const status = providerStatuses[provider];
        if (status?.isWorking) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
        console.error(`Validation error for ${provider}:`, error);
      }
      setValidationStates(prev => ({ ...prev, [provider]: false }));
    }

    setLastValidationTime(new Date());

    // Show summary toast
    if (successCount > 0 && failureCount === 0) {
      toast({
        title: '✅ All Keys Validated',
        description: `${successCount} API key${successCount > 1 ? 's are' : ' is'} active and working correctly.`,
      });
    } else if (successCount > 0 && failureCount > 0) {
      toast({
        title: '⚠️ Mixed Validation Results',
        description: `${successCount} working, ${failureCount} failed. Check individual key statuses above.`,
        variant: 'destructive',
      });
    } else if (failureCount > 0) {
      toast({
        title: '❌ Validation Complete - Issues Found',
        description: `${failureCount} API key${failureCount > 1 ? 's have' : ' has'} issues. Please check your keys and try again.`,
        variant: 'destructive',
      });
    }
  };

  // Save per-provider cost and optional monthly token allotment
  const handleSaveProviderCost = async (providerId: string) => {
    try {
      if (!userId) {
        toast({ title: 'Authentication required', description: 'Please sign in again.', variant: 'destructive' });
        return;
      }
      const rawCost = (costInputs[providerId] ?? '').trim();
      const rawAllot = (allotInputs[providerId] ?? '').trim();
      const costPer1k = rawCost === '' ? providerCosts[providerId]?.costPer1k : Number(rawCost);
      const monthlyAllotment = rawAllot === '' ? providerCosts[providerId]?.monthlyAllotment ?? null : Number(rawAllot);

      if (costPer1k == null || !Number.isFinite(costPer1k) || Number(costPer1k) <= 0) {
        toast({ title: 'Invalid amount', description: 'Enter a cost per 1K tokens greater than 0.', variant: 'destructive' });
        return;
      }

      setSavingProvider(prev => ({ ...prev, [providerId]: true }));

      const { error } = await callRpc('set_user_provider_cost', {
        user_id_param: userId,
        provider_param: providerId,
        cost_per_1k_tokens_param: Number(costPer1k),
        monthly_token_allotment_param: monthlyAllotment == null ? null : Math.max(0, Math.floor(Number(monthlyAllotment)))
      });

      if (error) throw error as unknown;

      setProviderCosts(prev => ({
        ...prev,
        [providerId]: {
          costPer1k: Number(costPer1k),
          monthlyAllotment: monthlyAllotment == null ? null : Math.floor(Number(monthlyAllotment)),
          updatedAt: new Date().toISOString()
        }
      }));

      toast({ title: 'Saved', description: 'Cost settings updated.' });
      await loadProviderCostsAndUsage();
    } catch (e) {
      console.error('Failed to save provider cost', e);
      toast({ title: 'Save failed', description: 'Could not update cost settings.', variant: 'destructive' });
    } finally {
      setSavingProvider(prev => ({ ...prev, [providerId]: false }));
    }
  };
  if (managerLoading) {
    return <LoadingSpinner />;
  }

  const hasInvalidKeys = Object.values(providerStatuses).some(
    status => status?.exists && !status.isWorking
  );

  const existingProviders = Object.keys(providerStatuses).filter(
    provider => providerStatuses[provider]?.exists
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            API Key Status
          </CardTitle>
          {lastValidationTime && (
            <p className="text-sm text-muted-foreground mt-1">
              Last checked: {lastValidationTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleValidateAll}
          disabled={Object.values(validationStates).some(Boolean) || existingProviders.length === 0}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${Object.values(validationStates).some(Boolean) ? 'animate-spin' : ''}`} />
          Test All Keys
        </Button>
      </CardHeader>
      <CardContent>
        {hasInvalidKeys && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">⚠️ Action Required</span>
            </div>
            <p className="text-sm text-red-700">
              Some API keys are invalid or unreachable. AI analysis features may be limited until these issues are resolved. 
              Click "Test" next to each key to see detailed error information.
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          {existingProviders.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-muted-foreground mb-1">No API Keys Configured</p>
              <p className="text-sm text-muted-foreground">
                Add your first API key using the "Manage Keys" tab to unlock AI-powered analysis features.
              </p>
            </div>
          ) : (
            Object.entries(providerStatuses)
              .filter(([_, status]) => status?.exists)
              .map(([provider, status]) => {
                const isValidating = validationStates[provider] || false;
                
                return (
                  <div key={provider} className="p-3 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(status, isValidating)}
                        <div>
                          <p className="font-medium capitalize">{provider}</p>
                          <p className="text-sm text-muted-foreground">
                            {status.maskedKey || `${provider} API Key`}
                          </p>
                          {status.errorMessage && !status.isWorking && (
                            <p className="text-xs text-red-600 mt-1">{status.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(status, isValidating)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleValidateKey(provider as ApiKeyType)}
                          disabled={isValidating || managerLoading}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${isValidating ? 'animate-spin' : ''}`} />
                          Test
                        </Button>
                      </div>
                    </div>

                    <Separator />

                     <div className="space-y-3">
                      {(provider === 'openai' || provider === 'anthropic') && (
                        <ProviderUsageRow provider={provider as UsageProvider} />
                      )}
                      {/* API Usage (internal estimate) */}
                      <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">API Usage This Month</span>
                          <span className="text-muted-foreground">
                            ${(providerUsageUSD[provider] || 0).toFixed(2)}
                          </span>
                        </div>
                        {providerCosts[provider]?.monthlyAllotment && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Token Usage</span>
                              <span>
                                {Math.round((providerUsageUSD[provider] || 0) / (providerCosts[provider]?.costPer1k || 1) * 1000)} / {providerCosts[provider]?.monthlyAllotment} tokens
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(100, ((providerUsageUSD[provider] || 0) / (providerCosts[provider]?.costPer1k || 1) * 1000) / (providerCosts[provider]?.monthlyAllotment || 1) * 100)} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`${provider}-cost`}>Cost per 1K tokens ($)</Label>
                          <Input
                            id={`${provider}-cost`}
                            type="number"
                            inputMode="decimal"
                            step={0.001}
                            min={0}
                            value={costInputs[provider] ?? ''}
                            onChange={(e) => setCostInputs(prev => ({ ...prev, [provider]: e.target.value }))}
                            placeholder={providerCosts[provider]?.costPer1k != null ? String(providerCosts[provider]?.costPer1k) : 'e.g., 0.50'}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`${provider}-allot`}>Monthly token allotment</Label>
                          <Input
                            id={`${provider}-allot`}
                            type="number"
                            inputMode="numeric"
                            step={1}
                            min={0}
                            value={allotInputs[provider] ?? ''}
                            onChange={(e) => setAllotInputs(prev => ({ ...prev, [provider]: e.target.value }))}
                            placeholder={providerCosts[provider]?.monthlyAllotment != null ? String(providerCosts[provider]?.monthlyAllotment) : 'optional'}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="secondary"
                          onClick={() => handleSaveProviderCost(provider)}
                          disabled={!userId || !!savingProvider[provider]}
                        >
                          {savingProvider[provider] ? 'Saving…' : 'Save cost settings'}
                        </Button>
                      </div>

                      {(() => {
                        const pc = providerCosts[provider];
                        const usd = providerUsageUSD[provider] || 0;
                        const cost = pc?.costPer1k ?? null;
                        const allot = pc?.monthlyAllotment ?? null;
                        if (cost && allot) {
                          const est = Math.floor((usd / cost) * 1000);
                          const pct = Math.min(100, Math.max(0, Math.round((est / allot) * 100)));
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Estimated tokens used this month</span>
                                <span>{est.toLocaleString()} / {allot.toLocaleString()} tokens</span>
                              </div>
                              <Progress value={pct} />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Estimated from your recorded spend of ${usd.toFixed(2)}</span>
                                <span>{pct}%</span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <p className="text-xs text-muted-foreground">
                            Set cost per 1K tokens and an optional monthly allotment to see usage progress here.
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
