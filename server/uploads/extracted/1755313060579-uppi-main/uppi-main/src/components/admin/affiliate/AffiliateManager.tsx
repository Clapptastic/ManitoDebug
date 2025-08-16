import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { affiliateService } from '@/services/affiliateService';
import { AffiliateLink } from '@/types/admin';
import { Plus, ExternalLink, Edit, Trash2, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OutboundLink } from '@/components/shared/OutboundLink';

export const AffiliateManager = () => {
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    url: string;
    affiliate_code: string;
    category: string;
    program_name: string;
    status: 'active' | 'inactive' | 'pending';
  }>({
    name: '',
    url: '',
    affiliate_code: '',
    category: '',
    program_name: '',
    status: 'active'
  });

  useEffect(() => {
    loadAffiliateLinks();
  }, []);

  const loadAffiliateLinks = async () => {
    try {
      const response = await affiliateService.getAffiliateLinks();
      setAffiliateLinks(response);
    } catch (error) {
      console.error('Error loading affiliate links:', error);
      toast({
        title: 'Error',
        description: 'Failed to load affiliate links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLink) {
        await affiliateService.updateAffiliateLink(editingLink.id, formData);
        toast({
          title: 'Success',
          description: 'Affiliate link updated successfully',
        });
      } else {
        await affiliateService.createAffiliateLink({
          ...formData,
          revenue: 0
        });
        toast({
          title: 'Success',
          description: 'Affiliate link created successfully',
        });
      }
      
      resetForm();
      loadAffiliateLinks();
    } catch (error) {
      console.error('Error saving affiliate link:', error);
      toast({
        title: 'Error',
        description: 'Failed to save affiliate link',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await affiliateService.deleteAffiliateLink(id);
      toast({
        title: 'Success',
        description: 'Affiliate link deleted successfully',
      });
      loadAffiliateLinks();
    } catch (error) {
      console.error('Error deleting affiliate link:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete affiliate link',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      affiliate_code: '',
      category: '',
      program_name: '',
      status: 'active'
    });
    setEditingLink(null);
    setShowAddDialog(false);
  };

  const openEditDialog = (link: AffiliateLink) => {
    setFormData({
      name: link.name,
      url: link.url,
      affiliate_code: link.affiliate_code || '',
      category: link.category || '',
      program_name: link.program_name || '',
      status: link.status
    });
    setEditingLink(link);
    setShowAddDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Affiliate Link Management</h2>
          <p className="text-muted-foreground">Manage your affiliate links and track performance</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Affiliate Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLink ? 'Edit Affiliate Link' : 'Add New Affiliate Link'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., OpenAI API"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="affiliate_code">Affiliate Code</Label>
                <Input
                  id="affiliate_code"
                  value={formData.affiliate_code}
                  onChange={(e) => setFormData({ ...formData, affiliate_code: e.target.value })}
                  placeholder="Your affiliate code"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., AI Services, Tools"
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingLink ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {affiliateLinks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No affiliate links</h3>
              <p className="text-muted-foreground">Get started by adding your first affiliate link.</p>
            </CardContent>
          </Card>
        ) : (
          affiliateLinks.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{link.name}</h3>
                      <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                        {link.status}
                      </Badge>
                      <Badge variant="outline">{link.category}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Code: {link.affiliate_code}</span>
                      <span>Clicks: {link.clicks}</span>
                      <span>Revenue: ${link.revenue}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <OutboundLink href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </OutboundLink>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(link)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(link.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};