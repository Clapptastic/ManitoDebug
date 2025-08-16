import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus, RefreshCw } from 'lucide-react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import AffiliateAlerts from '@/components/admin/affiliate/AffiliateAlerts';
import { AffiliateLinksTable } from '@/components/admin/affiliate/AffiliateLinksTable';
import AffiliateForm from '@/components/admin/affiliate/AffiliateForm';
import AffiliateStats from '@/components/admin/affiliate/AffiliateStats';
import { AffiliateLink, AffiliateAlert } from '@/types/admin';
import { affiliateService } from '@/services/affiliateService';
import { Badge } from '@/components/ui/badge';
import { useAffiliateSuggestionsRealtime } from '@/hooks/admin/useAffiliateSuggestionsRealtime';
import AffiliateSuggestionsPanel from '@/components/admin/affiliate/AffiliateSuggestionsPanel';
import { Helmet } from 'react-helmet-async';

const AffiliateAdmin: React.FC = () => {
  const { isAdmin, loading } = useAdminAuth();
  const { toast } = useToast();
  
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [alerts, setAlerts] = useState<AffiliateAlert[]>([]);
  const [stats, setStats] = useState({
    totalLinks: 0,
    activeLinks: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    conversionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<AffiliateLink | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  // Realtime notifications for new affiliate suggestions
  const { newCount, lastSuggestion } = useAffiliateSuggestionsRealtime({ enabled: isAdmin });

  useEffect(() => {
    if (lastSuggestion) {
      toast({ title: 'New affiliate suggestion', description: `${lastSuggestion.domain} suggested`, variant: 'default' });
    }
  }, [lastSuggestion, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch links and stats in parallel
      const [linksResponse, statsData] = await Promise.all([
        affiliateService.getAffiliateLinks(),
        affiliateService.getPerformanceStats()
      ]);

      setLinks(linksResponse || []);
      setStats(statsData);

      // Create alerts based on performance
      const performanceAlerts: AffiliateAlert[] = (linksResponse || [])
        .filter(link => link.clicks > 0 && link.conversions === 0)
        .map(link => ({
          id: `alert-${link.id}`,
          type: 'warning' as const,
          message: `${link.name} has ${link.clicks} clicks but no conversions`,
          link_id: link.id,
          created_at: new Date().toISOString(),
          resolved: false
        }));

      setAlerts(performanceAlerts);
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch affiliate data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async (linkData: { name: string; url: string; [key: string]: any }) => {
    try {
      setFormLoading(true);
      const newLink = await affiliateService.createAffiliateLink({
        ...linkData,
        status: 'active',
        affiliate_code: `AF${Date.now()}`,
        program_name: 'Default Program',
        category: 'general',
        revenue: 0
      });
      setLinks(prev => [newLink, ...prev]);
      setIsFormOpen(false);
      setEditingLink(undefined);
      await fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error creating affiliate link:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateLink = async (linkData: Partial<AffiliateLink>) => {
    if (!editingLink) return;
    
    try {
      setFormLoading(true);
      const updatedLink = await affiliateService.updateAffiliateLink(editingLink.id, linkData);
      setLinks(prev => prev.map(link => 
        link.id === editingLink.id ? updatedLink : link
      ));
      setIsFormOpen(false);
      setEditingLink(undefined);
      await fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error updating affiliate link:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this affiliate link?')) {
      return;
    }

    try {
      await affiliateService.deleteAffiliateLink(id);
      setLinks(prev => prev.filter(link => link.id !== id));
      await fetchData(); // Refresh stats
      toast({
        title: "Success",
        description: "Affiliate link deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting affiliate link:', error);
      toast({
        title: "Error",
        description: "Failed to delete affiliate link",
        variant: "destructive"
      });
    }
  };

  const handleEditLink = (link: AffiliateLink) => {
    setEditingLink(link);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingLink(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLink(undefined);
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Affiliate Management | Admin</title>
        <meta name="description" content="Admin interface to manage affiliate programs, links, and suggestions." />
        <link rel="canonical" href="/admin/affiliate" />
      </Helmet>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Affiliate Management
            {newCount > 0 && (
              <Badge variant="secondary">{newCount} new suggestions</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage affiliate links and track performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Affiliate Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <AffiliateForm
                link={editingLink}
                onSubmit={editingLink ? handleUpdateLink : handleCreateLink}
                onCancel={handleCloseForm}
                isLoading={formLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Performance Stats */}
        <AffiliateStats {...stats} />

        {/* Alerts */}
        <AffiliateAlerts alerts={alerts} />
        
        {/* Affiliate Links Table */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Affiliate Links</CardTitle>
            <CardDescription>
              Manage and monitor your affiliate partnerships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AffiliateLinksTable 
              links={links}
              isLoading={isLoading}
              onEdit={handleEditLink}
              onDelete={handleDeleteLink}
            />
          </CardContent>
        </Card>

        {/* Suggestions Panel */}
        <AffiliateSuggestionsPanel />
      </div>
    </div>
  );
};

export default AffiliateAdmin;