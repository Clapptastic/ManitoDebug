import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AffiliateLink } from '@/types/admin';

interface AffiliateFormProps {
  link?: AffiliateLink;
  onSubmit: (data: Partial<AffiliateLink>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const AffiliateForm: React.FC<AffiliateFormProps> = ({ 
  link, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: link?.name || '',
    url: link?.url || '',
    affiliate_code: link?.affiliate_code || '',
    program_name: link?.program_name || '',
    category: link?.category || 'General',
    status: link?.status || 'active' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast({
        title: "Validation Error",
        description: "Name and URL are required",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSubmit(formData);
      toast({
        title: "Success",
        description: `Affiliate link ${link ? 'updated' : 'created'} successfully`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${link ? 'update' : 'create'} affiliate link`,
        variant: "destructive"
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{link ? 'Edit' : 'Add'} Affiliate Link</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., DigitalOcean"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="program_name">Program Name</Label>
              <Input
                id="program_name"
                value={formData.program_name}
                onChange={(e) => handleChange('program_name', e.target.value)}
                placeholder="e.g., DigitalOcean Referral Program"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://example.com/referral?code=YOUR_CODE"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="affiliate_code">Affiliate Code</Label>
              <Input
                id="affiliate_code"
                value={formData.affiliate_code}
                onChange={(e) => handleChange('affiliate_code', e.target.value)}
                placeholder="e.g., REF123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Cloud Services">Cloud Services</SelectItem>
                  <SelectItem value="Software Tools">Software Tools</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (link ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AffiliateForm;