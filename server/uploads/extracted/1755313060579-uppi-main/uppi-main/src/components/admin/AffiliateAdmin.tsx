import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { affiliateService } from '@/services/affiliateService';
import { AffiliateLink } from '@/services/affiliateService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AffiliateAdmin: React.FC = () => {
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAffiliateLinks();
  }, []);

  const loadAffiliateLinks = async () => {
    try {
      setLoading(true);
      const links = await affiliateService.getAffiliateLinks();
      setAffiliateLinks(links.map(link => ({
        ...link,
        category: link.category || 'general'
      })));
    } catch (error) {
      console.error('Failed to load affiliate links:', error);
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
          affiliate_code: `AF${Date.now()}`,
          category: 'general',
          revenue: 0,
          program_name: 'Default Program'
        });
        toast({
          title: 'Success',
          description: 'Affiliate link created successfully',
        });
      }
      
      setIsDialogOpen(false);
      setEditingLink(null);
      setFormData({ name: '', url: '', status: 'active' });
      loadAffiliateLinks();
    } catch (error) {
      console.error('Failed to save affiliate link:', error);
      toast({
        title: 'Error',
        description: 'Failed to save affiliate link',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (link: AffiliateLink) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      url: link.url,
      status: link.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this affiliate link?')) {
      return;
    }

    try {
      await affiliateService.deleteAffiliateLink(id);
      toast({
        title: 'Success',
        description: 'Affiliate link deleted successfully',
      });
      loadAffiliateLinks();
    } catch (error) {
      console.error('Failed to delete affiliate link:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete affiliate link',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading affiliate links...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Management</h1>
          <p className="text-muted-foreground">
            Manage your affiliate links and track performance
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingLink(null);
              setFormData({ name: '', url: '', status: 'active' });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Affiliate Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLink ? 'Edit Affiliate Link' : 'Add New Affiliate Link'}
              </DialogTitle>
              <DialogDescription>
                {editingLink 
                  ? 'Update the affiliate link details below.' 
                  : 'Create a new affiliate link to track performance.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter affiliate link name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/affiliate-link"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'pending') => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLink ? 'Update' : 'Create'} Link
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Links</CardTitle>
          <CardDescription>
            Manage and monitor your affiliate program links
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliateLinks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No affiliate links found.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Affiliate Link
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliateLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="truncate max-w-[200px]">{link.url}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(link.status)}>
                        {link.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{link.clicks || 0}</TableCell>
                    <TableCell>{link.conversions || 0}</TableCell>
                    <TableCell>${(link.revenue || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(link)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(link.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateAdmin;