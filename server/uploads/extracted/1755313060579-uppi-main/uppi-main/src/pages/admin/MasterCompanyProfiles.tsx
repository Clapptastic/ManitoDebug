
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Building2, 
  TrendingUp,
  AlertCircle,
  Bug
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { devErrorHandler } from '@/utils/devErrorHandler';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MasterCompanyProfile {
  id: string;
  company_name: string;
  normalized_name: string;
  industry?: string;
  description?: string;
  website_url?: string;
  validation_status: string;
  overall_confidence_score?: number;
  data_completeness_score?: number;
  source_analyses?: string[];
  created_at: string;
  updated_at: string;
}

const MasterCompanyProfiles: React.FC = () => {
  const [profiles, setProfiles] = useState<MasterCompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [consolidating, setConsolidating] = useState(false);
  const [aggregating, setAggregating] = useState(false);
  const [combinedCount, setCombinedCount] = useState(0);
  const [backfillAvailable, setBackfillAvailable] = useState(false);

  // Load profiles
  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('master_company_profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading master profiles:', error);
        toast({
          title: 'Error',
          description: 'Failed to load master company profiles',
          variant: 'destructive'
        });
        return;
      }

      // Normalize DB JSON fields to strict TS types for UI safety
      const normalized = (data || []).map((d: any) => ({
        ...d,
        source_analyses: Array.isArray(d?.source_analyses)
          ? d.source_analyses.map((x: any) => String(x))
          : typeof d?.source_analyses === 'string'
            ? d.source_analyses.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
      })) as MasterCompanyProfile[];

      setProfiles(normalized);
    } catch (error) {
      console.error('Unexpected error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check analysis_combined count (only when authenticated to avoid RLS/403)
  const checkCombinedAnalysisCount = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        setCombinedCount(0);
        return;
      }

      const { count, error } = await supabase
        .from('analysis_combined')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking analysis_combined count:', error);
        return;
      }

      setCombinedCount(count || 0);
    } catch (error) {
      console.error('Error in checkCombinedAnalysisCount:', error);
    }
  }, []);

  // Check whether the backfill edge function is available to avoid 404 spam
  const checkBackfillAvailability = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke('get-function-url', {
        body: { function_name: 'aggregate-analysis' }
      });
      setBackfillAvailable(Boolean((data as any)?.url));
    } catch {
      setBackfillAvailable(false);
    }
  }, []);

  // Trigger initial consolidation
  const triggerInitialConsolidation = useCallback(async () => {
    try {
      setConsolidating(true);
      
      const { data, error } = await supabase.functions.invoke('bulk-consolidate-companies');

      if (error) {
        if ((error as any)?.name === 'FunctionsHttpError') {
          console.warn('Consolidation function returned non-2xx:', error);
          toast({
            title: 'Consolidation Failed',
            description: (((error as any)?.message ? String((error as any).message) + ' — ' : '') + 'Check Edge Function logs. Ensure SUPABASE_SERVICE_ROLE_KEY is configured for bulk-consolidate-companies.'),
            variant: 'destructive'
          });
        } else {
          console.error('Error in bulk consolidation:', error);
          toast({
            title: 'Consolidation Failed',
            description: (error as any)?.message || 'Failed to consolidate company data',
            variant: 'destructive'
          });
        }
        return;
      }

      if (data?.success) {
        toast({
          title: 'Consolidation Complete',
          description: `Created ${data.profilesCreated} profiles, updated ${data.profilesUpdated}`,
        });
        await loadProfiles();
      }
    } catch (error) {
      console.error('Unexpected error in consolidation:', error);
      toast({
        title: 'Consolidation Error',
        description: 'An unexpected error occurred during consolidation',
        variant: 'destructive'
      });
    } finally {
      setConsolidating(false);
    }
  }, [loadProfiles]);

  // Backfill combined analyses
  const backfillCombinedAnalyses = useCallback(async () => {
    try {
      setAggregating(true);
      
      const { data, error } = await supabase.functions.invoke('aggregate-analysis', {
        body: { action: 'backfill_all' }
      });

      if (error) {
        if ((error as any)?.name === 'FunctionsHttpError') {
          console.warn('Backfill function unavailable or returned non-2xx:', error);
          toast({
            title: 'Backfill Unavailable',
            description: 'The backfill service is not available right now.',
            variant: 'destructive'
          });
        } else {
          console.error('Error in backfill:', error);
          toast({
            title: 'Backfill Failed',
            description: (error as any)?.message || 'Failed to backfill combined analyses',
            variant: 'destructive'
          });
        }
        return;
      }

      if (data?.success) {
        toast({
          title: 'Backfill Complete',
          description: `Processed ${data.processed || 0} analyses`,
        });
        await checkCombinedAnalysisCount();
      }
    } catch (error) {
      console.error('Unexpected error in backfill:', error);
      toast({
        title: 'Backfill Error',
        description: 'An unexpected error occurred during backfill',
        variant: 'destructive'
      });
    } finally {
      setAggregating(false);
    }
  }, [checkCombinedAnalysisCount]);

  // Filter profiles
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || profile.validation_status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    loadProfiles();
    checkCombinedAnalysisCount();
    checkBackfillAvailability();
  }, []); // Remove dependencies to prevent infinite loop

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const copyErrorReport = () => {
    const errors = devErrorHandler.getRecentErrors();
    if (errors.length === 0) {
      toast({
        title: 'No Errors',
        description: 'No recent errors to copy',
      });
      return;
    }

    const report = devErrorHandler.generateErrorReport(errors[0]);
    navigator.clipboard.writeText(report).then(() => {
      toast({
        title: 'Error Report Copied',
        description: 'Error report copied to clipboard',
      });
    }).catch(() => {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy error report',
        variant: 'destructive'
      });
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Helmet>
        <title>Master Company Profiles - Admin</title>
        <meta name="description" content="Manage and review master company profiles" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Master Company Profiles</h1>
          <p className="text-muted-foreground">
            Consolidated company data from {profiles.length} profiles
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Bug className="h-4 w-4 mr-2" />
                Error Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Development Error Report</DialogTitle>
                <DialogDescription>
                  Recent errors captured during development
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={copyErrorReport} variant="outline" size="sm">
                    Copy Latest Error Report
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {devErrorHandler.getRecentErrors().length} recent errors logged
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={triggerInitialConsolidation}
            disabled={consolidating}
            variant="outline"
          >
            {consolidating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4 mr-2" />
            )}
            {consolidating ? 'Consolidating...' : 'Consolidate'}
          </Button>
          <Button onClick={loadProfiles} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {profiles.filter(p => p.validation_status === 'validated').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {profiles.filter(p => p.validation_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combined Analyses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combinedCount}</div>
            {backfillAvailable ? (
              <Button 
                onClick={backfillCombinedAnalyses}
                disabled={aggregating}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                {aggregating ? 'Processing...' : 'Backfill'}
              </Button>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Backfill service unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies, industries, descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'validated' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('validated')}
            size="sm"
          >
            Validated
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
            size="sm"
          >
            Pending
          </Button>
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading master company profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by consolidating competitor analyses'
              }
            </p>
            {profiles.length === 0 && (
              <Button onClick={triggerInitialConsolidation} disabled={consolidating}>
                {consolidating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4 mr-2" />
                )}
                {consolidating ? 'Consolidating...' : 'Start Consolidation'}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{profile.company_name}</CardTitle>
                  <Badge className={getStatusColor(profile.validation_status)}>
                    {profile.validation_status}
                  </Badge>
                </div>
                {profile.industry && (
                  <p className="text-sm text-muted-foreground">{profile.industry}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.description && (
                  <p className="text-sm line-clamp-2">{profile.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Confidence: </span>
                    <span className={getConfidenceColor(profile.overall_confidence_score)}>
                      {profile.overall_confidence_score || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Completeness: </span>
                    <span>{profile.data_completeness_score || 0}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sources: </span>
                    <span>{profile.source_analyses?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated: </span>
                    <span>{new Date(profile.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {profile.website_url && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Website: </span>
                    <a 
                      href={profile.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {profile.website_url}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MasterCompanyProfiles;
