import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Key, Plus, Activity, TrendingUp, DollarSign, Zap, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AdminSystemDiagnostics } from '@/components/admin/AdminSystemDiagnostics';
import { APIIntegrationMap } from '@/components/admin/APIIntegrationMap';
import { Helmet } from 'react-helmet-async';
import { useEdgeFunctionsList } from '@/hooks/useEdgeFunctionsList';
import { useApiServicesDiscovery } from '@/hooks/useApiServicesDiscovery';
import { useMicroservices } from '@/hooks/admin/useMicroservices';


interface AdminApiKey {
  id: string;
  provider: string;
  name: string;
  masked_key: string;
  is_active: boolean;
  created_at: string;
  last_validated?: string;
  status: string;
  usage_limit_per_month?: number;
  current_month_usage: number;
  created_by: string;
}

interface AdminApiMetrics {
  totalAdminKeys: number;
  activeAdminKeys: number;
  totalPlatformRequests: number;
  totalPlatformCost: number;
  monthlyUsageByProvider: Record<string, number>;
  avgExecutionTime?: number;
}

const APIManagementPage: React.FC = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAdminAuth();
  const [adminApiKeys, setAdminApiKeys] = useState<AdminApiKey[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<AdminApiMetrics>({
    totalAdminKeys: 0,
    activeAdminKeys: 0,
    totalPlatformRequests: 0,
    totalPlatformCost: 0,
    monthlyUsageByProvider: {}
  });
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAdminApiKey, setNewAdminApiKey] = useState({
    provider: '',
    name: '',
    api_key: '',
    usage_limit_per_month: null as number | null
  });

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchAdminApiKeys();
      fetchAdminMetrics();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        fetchAdminApiKeys();
        fetchAdminMetrics();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isAdmin]);

  const fetchAdminApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_api_keys')
        .select('id, provider, name, masked_key, is_active, created_at, last_validated, status, usage_limit_per_month, current_month_usage, created_by, updated_at, last_used_at, expires_at, error_message, metadata, key_prefix, key_hash')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAdminApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching admin API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch admin API keys',
        variant: 'destructive',
      });
    }
  };

  const fetchAdminMetrics = async () => {
    try {
      // Get real admin API keys count
      const { count: totalAdminKeys } = await supabase
        .from('admin_api_keys')
        .select('id', { count: 'exact', head: true });

      const { count: activeAdminKeys } = await supabase
        .from('admin_api_keys')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get real platform requests count
      const { count: totalPlatformRequests } = await supabase
        .from('admin_api_usage_tracking')
        .select('*', { count: 'exact', head: true });

      // Get real cost data
      const { data: costData } = await supabase
        .from('admin_api_usage_tracking')
        .select('cost_usd');

      const totalPlatformCost = costData?.reduce((sum, item) => sum + (item.cost_usd || 0), 0) || 0;

      // Get real monthly usage by provider
      const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { data: usageRows, error: usageErr } = await supabase
        .from('admin_api_usage_tracking')
        .select('admin_api_key_id, tokens_used, created_at')
        .gte('created_at', currentMonth.toISOString());

      let monthlyUsageByProvider: Record<string, number> = {};
      if (!usageErr && usageRows && usageRows.length) {
        const keyIds = Array.from(new Set(usageRows.map((r: any) => r.admin_api_key_id).filter(Boolean)));
        if (keyIds.length) {
          const { data: keyRows, error: keysErr } = await supabase
            .from('admin_api_keys')
            .select('id, provider')
            .in('id', keyIds as string[]);

          const providerById = new Map<string, string>();
          if (!keysErr && keyRows) {
            keyRows.forEach((k: any) => providerById.set(k.id, k.provider || 'unknown'));
          }

          monthlyUsageByProvider = usageRows.reduce((acc: Record<string, number>, row: any) => {
            const provider = providerById.get(row.admin_api_key_id) || 'unknown';
            const tokens = row.tokens_used || 0;
            acc[provider] = (acc[provider] || 0) + tokens;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Get real edge function metrics for additional insights
      const { data: edgeFunctionData } = await supabase
        .from('edge_function_metrics')
        .select('function_name, execution_time_ms, status')
        .gte('created_at', currentMonth.toISOString())
        .limit(100);

      const avgExecutionTime = edgeFunctionData?.length > 0 
        ? edgeFunctionData.reduce((sum, item) => sum + (item.execution_time_ms || 0), 0) / edgeFunctionData.length
        : 0;

      setAdminMetrics({
        totalAdminKeys: totalAdminKeys || 0,
        activeAdminKeys: activeAdminKeys || 0,
        totalPlatformRequests: totalPlatformRequests || 0,
        totalPlatformCost,
        monthlyUsageByProvider,
        avgExecutionTime: Math.round(avgExecutionTime)
      });
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
      // Set default values on error to avoid showing undefined
      setAdminMetrics({
        totalAdminKeys: 0,
        activeAdminKeys: 0,
        totalPlatformRequests: 0,
        totalPlatformCost: 0,
        monthlyUsageByProvider: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminApiKeyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setAdminApiKeys(prev => prev.map(key => 
        key.id === id ? { ...key, is_active: !currentStatus } : key
      ));

      toast({
        title: 'Success',
        description: `Admin API key ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling admin API key status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update admin API key status',
        variant: 'destructive',
      });
    }
  };

  const addAdminApiKey = async () => {
    if (!newAdminApiKey.provider || !newAdminApiKey.name || !newAdminApiKey.api_key) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create a simple hash for the key_hash field
      const keyHash = btoa(newAdminApiKey.api_key).substring(0, 16);

      const { error } = await supabase
        .from('admin_api_keys')
        .insert({
          created_by: user.id,
          provider: newAdminApiKey.provider,
          name: newAdminApiKey.name,
          api_key: newAdminApiKey.api_key,
          masked_key: `${newAdminApiKey.api_key.substring(0, 8)}...${newAdminApiKey.api_key.slice(-4)}`,
          key_prefix: newAdminApiKey.api_key.substring(0, 8),
          key_hash: keyHash,
          is_active: true,
          status: 'active',
          usage_limit_per_month: newAdminApiKey.usage_limit_per_month,
          current_month_usage: 0
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Admin API key added successfully',
      });

      setIsAddDialogOpen(false);
      setNewAdminApiKey({ provider: '', name: '', api_key: '', usage_limit_per_month: null });
      fetchAdminApiKeys();
    } catch (error) {
      console.error('Error adding admin API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to add admin API key',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;

  if (!isAuthenticated || !isAdmin) {
    return (
      <Card className="w-96 mx-auto mt-20">
        <CardHeader>
          <CardTitle className="text-destructive">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You do not have permission to access admin API management.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin API Management | Edge Functions & Services</title>
        <meta name="description" content="Manage admin API keys and view live inventory of edge functions, API services, and microservices." />
        <link rel="canonical" href="/admin/api-management" />
      </Helmet>
      <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Key className="h-8 w-8" />
            Admin API Management
          </h1>
          <p className="text-muted-foreground">Manage platform-wide API keys, monitor usage, and track costs across all users.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Admin API Key</DialogTitle>
              <DialogDescription>
                Add a new platform-wide API key that can be used across the entire application for AI providers.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={newAdminApiKey.provider}
                  onValueChange={(value) => setNewAdminApiKey(prev => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="perplexity">Perplexity</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="mistral">Mistral AI</SelectItem>
                    <SelectItem value="newsapi">NewsAPI</SelectItem>
                    <SelectItem value="finnhub">Finnhub Financial Data</SelectItem>
                    <SelectItem value="alphavantage">Alpha Vantage</SelectItem>
                    <SelectItem value="serpapi">SerpAPI (Google Search)</SelectItem>
                    <SelectItem value="crunchbase">Crunchbase</SelectItem>
                    <SelectItem value="clearbit">Clearbit</SelectItem>
                    <SelectItem value="polygonio">Polygon.io</SelectItem>
                    <SelectItem value="rapidapi">RapidAPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Primary OpenAI Key, Backup Anthropic Key"
                  value={newAdminApiKey.name}
                  onChange={(e) => setNewAdminApiKey(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Enter the API key"
                  value={newAdminApiKey.api_key}
                  onChange={(e) => setNewAdminApiKey(prev => ({ ...prev, api_key: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="usage_limit">Monthly Usage Limit (optional)</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  placeholder="e.g. 1000000 (tokens per month)"
                  value={newAdminApiKey.usage_limit_per_month || ''}
                  onChange={(e) => setNewAdminApiKey(prev => ({ 
                    ...prev, 
                    usage_limit_per_month: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addAdminApiKey}>Add Admin API Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admin API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics.totalAdminKeys}</div>
            <p className="text-xs text-muted-foreground">
              {adminMetrics.activeAdminKeys} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminMetrics.totalPlatformRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total platform requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${adminMetrics.totalPlatformCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total platform API costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Cost/Request</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${adminMetrics.totalPlatformRequests > 0 ? (adminMetrics.totalPlatformCost / adminMetrics.totalPlatformRequests).toFixed(4) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per platform request
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">API Integrations</TabsTrigger>
          <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
            <CardTitle>Admin API Keys</CardTitle>
            <CardDescription>
              Manage platform-wide API keys used for all user requests and system operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Masked Key</TableHead>
                      <TableHead>Usage Limit</TableHead>
                      <TableHead>Monthly Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminApiKeys.map((adminApiKey) => (
                      <TableRow key={adminApiKey.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Zap className="h-4 w-4" />
                            </div>
                        <span className="font-medium capitalize">{adminApiKey.provider}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{adminApiKey.name}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {adminApiKey.masked_key}
                      </code>
                    </TableCell>
                    <TableCell>
                      {adminApiKey.usage_limit_per_month 
                        ? adminApiKey.usage_limit_per_month.toLocaleString() 
                        : 'Unlimited'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{adminApiKey.current_month_usage.toLocaleString()}</span>
                        {adminApiKey.usage_limit_per_month && (
                          <span className="text-xs text-muted-foreground">
                            {((adminApiKey.current_month_usage / adminApiKey.usage_limit_per_month) * 100).toFixed(1)}% used
                          </span>
                        )}
                      </div>
                        </TableCell>
                        <TableCell>
                      <Badge 
                        variant={adminApiKey.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleAdminApiKeyStatus(adminApiKey.id, adminApiKey.is_active)}
                      >
                        {adminApiKey.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                    <TableCell>
                      {new Date(adminApiKey.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Test
                            </Button>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm">
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

          {adminApiKeys.length === 0 && (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No admin API keys found. Add your first platform API key to get started.</p>
            </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <APIIntegrationMap />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <AdminSystemDiagnostics />
        </TabsContent>
      </Tabs>
    </main>
    </>
  );
};

export default APIManagementPage;