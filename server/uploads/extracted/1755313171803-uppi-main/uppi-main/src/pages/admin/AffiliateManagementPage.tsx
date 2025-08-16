import React, { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Link2, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAffiliateManagement } from '@/hooks/admin/useAffiliateManagement';
import AffiliateLinksTable from '@/components/admin/affiliate/AffiliateLinksTable';
import AffiliateAlerts from '@/components/admin/affiliate/AffiliateAlerts';
import { useToast } from '@/hooks/use-toast';
import { AffiliateLink, AffiliateAlert, AffiliateProgram, AffiliateLinkSuggestion } from '@/types/admin';
import { OutboundLink } from '@/components/shared/OutboundLink';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
const AffiliateManagementPage: React.FC = () => {
  const { affiliatePrograms, isLoading, error } = useAffiliateManagement();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Suggestions state and handlers (admin-focused, falls back to user-owned via RLS)
  const [suggestions, setSuggestions] = useState<AffiliateLinkSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionStatus, setSuggestionStatus] = useState<'all' | 'new' | 'reviewed' | 'ignored'>('new');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AffiliateLinkSuggestion | null>(null);
  const [programName, setProgramName] = useState('');
  const [provider, setProvider] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [defaultUrl, setDefaultUrl] = useState('');

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      let query = supabase
        .from('affiliate_link_suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      if (suggestionStatus !== 'all') {
        query = query.eq('status', suggestionStatus);
      }
      const { data, error } = await query;
      if (error) throw error;
      setSuggestions((data || []) as AffiliateLinkSuggestion[]);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      toast({ title: 'Failed to load suggestions', variant: 'destructive' });
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const updateSuggestionStatus = async (id: string, status: 'new' | 'reviewed' | 'ignored') => {
    const { error } = await supabase
      .from('affiliate_link_suggestions')
      .update({ status })
      .eq('id', id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Suggestion updated' });
      loadSuggestions();
    }
  };

  const setSuggestionSignupUrl = async (id: string, url: string) => {
    const { error } = await supabase
      .from('affiliate_link_suggestions')
      .update({ signup_url: url })
      .eq('id', id);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Signup URL saved' });
      loadSuggestions();
    }
  };

  const openCreateDialog = (s: AffiliateLinkSuggestion) => {
    setSelectedSuggestion(s);
    setProgramName(s.detected_program_name || s.domain);
    setProvider(s.provider || '');
    setAffiliateCode('');
    setAffiliateUrl('');
    setDefaultUrl('');
    setShowCreateDialog(true);
  };

  const createProgramFromSuggestion = async () => {
    if (!selectedSuggestion) return;
    if (!affiliateCode || !programName) {
      toast({ title: 'Missing fields', description: 'Program name and affiliate code are required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase
      .from('affiliate_programs')
      .insert({
        program_name: programName,
        provider: provider || null,
        affiliate_code: affiliateCode,
        commission_rate: null,
        status: 'active',
        default_url: defaultUrl || null,
        affiliate_url: affiliateUrl || null,
        is_active: true,
        domain: selectedSuggestion.domain,
      });
    if (error) {
      toast({ title: 'Create failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Program created' });
    setShowCreateDialog(false);
    // Mark suggestion as reviewed and refresh data
    await updateSuggestionStatus(selectedSuggestion.id, 'reviewed');
    await loadSuggestions();
  };

  const fetchLinks = async () => {
    setLoading(true);
    try {
      // Simulate fetching affiliate links
      setLinks([]);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  useEffect(() => {
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestionStatus]);
  // Simulated data for alerts and analytics since we don't have this in the API yet
  const [alerts, setAlerts] = useState<AffiliateAlert[]>([
    {
      id: '1',
      type: 'warning',
      message: 'No clicks detected in the past 30 days',
      created_at: new Date().toISOString(),
      resolved: false,
      program_name: 'Amazon Associates',
      alert_type: 'warning',
      status: 'active',
      is_dismissed: false
    },
    {
      id: '2',
      type: 'error',
      message: 'Affiliate link returning 404 error',
      created_at: new Date().toISOString(),
      resolved: false,
      program_name: 'DigitalOcean',
      alert_type: 'error',
      status: 'active',
      is_dismissed: false
    }
  ]);
  
  // Programs data (derived from links)
  const programs = React.useMemo(() => {
    const programMap = new Map<string, AffiliateProgram>();
    
    links.forEach(link => {
      if (!programMap.has(link.program_name)) {
        programMap.set(link.program_name, {
          id: link.id,
          name: link.program_name,
          description: '',
          commission_rate: 0,
          payment_terms: '',
          status: link.status as 'active' | 'inactive' | 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          links_count: 1,
          total_clicks: link.clicks,
          total_conversions: link.conversions,
          conversion_rate: link.clicks > 0 ? (link.conversions / link.clicks) * 100 : 0
        });
      } else {
        const program = programMap.get(link.program_name)!;
        program.links_count += 1;
        program.total_clicks += link.clicks;
        program.total_conversions += link.conversions;
        program.conversion_rate = program.total_clicks > 0 
          ? (program.total_conversions / program.total_clicks) * 100 
          : 0;
      }
    });
    
    return Array.from(programMap.values());
  }, [links]);
  
  // Analytics data
  const analytics = React.useMemo(() => {
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
    const totalConversions = links.reduce((sum, link) => sum + link.conversions, 0);
    
    return {
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      active_programs: programs.length,
      active_links: links.filter(l => l.status === 'active').length,
    };
  }, [links, programs]);
  
  const handleRefresh = () => {
    fetchLinks();
    toast({
      title: "Refreshed",
      description: "Affiliate data has been refreshed",
    });
  };
  
  const handleAddLink = () => {
    setShowAddDialog(true);
  };
  
  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, is_dismissed: true } : alert
    ));
    
    toast({
      title: "Alert dismissed",
      description: "The alert has been dismissed",
    });
  };

  const handleEditLink = (link: AffiliateLink) => {
    // In a real implementation, this would open an edit modal
    toast({
      title: "Edit Link",
      description: `Editing ${link.program_name} affiliate link`,
    });
  };
  
  const handleDeleteLink = (id: string) => {
    // In a real implementation, this would confirm and delete the link
    toast({
      title: "Delete Link",
      description: "This would delete the affiliate link",
      variant: "destructive",
    });
  };
  
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Affiliate Management"
        description="Manage affiliate links, track conversions, and monitor performance"
        icon={<Link2 className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleAddLink}>
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </>
        }
      />
      
      <div className="grid gap-6">
        <AffiliateAlerts 
          alerts={alerts.filter(a => !a.is_dismissed)} 
          onDismiss={handleDismissAlert}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_clicks}</div>
              <p className="text-xs text-muted-foreground">Across all affiliate links</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_conversions}</div>
              <p className="text-xs text-muted-foreground">Successful referrals</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.conversion_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Average across all programs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.active_programs}</div>
              <p className="text-xs text-muted-foreground">{analytics.active_links} active links</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Tabs defaultValue="links" className="space-y-4">
        <TabsList>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="links">
          <Card>
            <CardContent className="pt-6">
              <AffiliateLinksTable 
                links={links.map(link => ({
                  ...link,
                  status: link.status as 'active' | 'inactive' | 'pending'
                }))} 
                isLoading={loading} 
                onEdit={handleEditLink}
                onDelete={handleDeleteLink}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance by Program</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 flex items-center justify-center">
                        <p className="text-muted-foreground">Charts and detailed analytics will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Click Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 flex items-center justify-center">
                        <p className="text-muted-foreground">Time-based click data will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Conversion Funnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-muted-foreground">Conversion funnel data will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Link Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">Filter:</span>
                <Button size="sm" variant={suggestionStatus === 'new' ? 'default' : 'outline'} onClick={() => setSuggestionStatus('new')}>New</Button>
                <Button size="sm" variant={suggestionStatus === 'reviewed' ? 'default' : 'outline'} onClick={() => setSuggestionStatus('reviewed')}>Reviewed</Button>
                <Button size="sm" variant={suggestionStatus === 'ignored' ? 'default' : 'outline'} onClick={() => setSuggestionStatus('ignored')}>Ignored</Button>
                <Button size="sm" variant={suggestionStatus === 'all' ? 'default' : 'outline'} onClick={() => setSuggestionStatus('all')}>All</Button>
                <div className="ml-auto">
                  <Button size="sm" variant="outline" onClick={loadSuggestions}>Refresh</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Original URL</TableHead>
                      <TableHead>Detected Program</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Signup URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.domain}</TableCell>
                        <TableCell>
                          <OutboundLink href={s.original_url} className="text-primary hover:underline">{s.original_url}</OutboundLink>
                        </TableCell>
                        <TableCell>{s.detected_program_name || '-'}</TableCell>
                        <TableCell>{s.provider || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input defaultValue={s.signup_url || ''} placeholder="https://..." onBlur={(e) => setSuggestionSignupUrl(s.id, e.currentTarget.value)} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => updateSuggestionStatus(s.id, 'reviewed')}>Review</Button>
                          <Button size="sm" variant="outline" onClick={() => updateSuggestionStatus(s.id, 'ignored')}>Ignore</Button>
                          <Button size="sm" onClick={() => openCreateDialog(s)}>Create Program</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!suggestionsLoading && suggestions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No suggestions found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="programs">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead className="text-right">Links</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.name}</TableCell>
                        <TableCell className="text-right">{program.links_count}</TableCell>
                        <TableCell className="text-right">{program.total_clicks}</TableCell>
                        <TableCell className="text-right">{program.total_conversions}</TableCell>
                        <TableCell className="text-right">
                          {program.conversion_rate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{program.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {programs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No affiliate programs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Program Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Affiliate Program</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Program Name</Label>
                  <Input value={programName} onChange={(e) => setProgramName(e.currentTarget.value)} />
                </div>
                <div>
                  <Label>Provider</Label>
                  <Input value={provider} onChange={(e) => setProvider(e.currentTarget.value)} placeholder="openai | digitalocean | ..." />
                </div>
                <div>
                  <Label>Affiliate Code</Label>
                  <Input value={affiliateCode} onChange={(e) => setAffiliateCode(e.currentTarget.value)} placeholder="Required" />
                </div>
                <div>
                  <Label>Affiliate URL</Label>
                  <Input value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.currentTarget.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>Default URL</Label>
                  <Input value={defaultUrl} onChange={(e) => setDefaultUrl(e.currentTarget.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>Domain</Label>
                  <Input value={selectedSuggestion?.domain || ''} disabled />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={createProgramFromSuggestion}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  );
};

export default AffiliateManagementPage;
