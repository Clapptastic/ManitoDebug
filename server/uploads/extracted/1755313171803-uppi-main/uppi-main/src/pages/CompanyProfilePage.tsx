import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Globe, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin,
  Plus,
  Edit,
  Save,
  X
} from 'lucide-react';
import { AIProfileSetup } from '@/components/company-profile/AIProfileSetup';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { OutboundLink } from '@/components/shared/OutboundLink';

interface CompanyProfile {
  id: string;
  company_name: string;
  website_url?: string;
  industry?: string;
  description?: string;
  headquarters?: string;
  founded_year?: number;
  employee_count?: number;
  revenue_estimate?: number;
  business_model?: string;
  funding_stage?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

const CompanyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAISetup, setShowAISetup] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CompanyProfile>>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load company profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditForm(profile || {});
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (!user) return;

      // Ensure company_name is provided for new profiles
      if (!profile && !editForm.company_name?.trim()) {
        toast({
          title: 'Company Name Required',
          description: 'Please enter a company name',
          variant: 'destructive',
        });
        return;
      }

      const profileData = {
        ...editForm,
        user_id: user.id,
        updated_at: new Date().toISOString(),
        // Ensure company_name is always provided for database requirements
        company_name: editForm.company_name || profile?.company_name || 'Unnamed Company'
      };

      if (profile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('company_profiles')
          .update(profileData)
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('company_profiles')
          .insert(profileData)
          .select()
          .single();

        if (error) throw error;
        setProfile(data);
      }

      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Company profile updated successfully',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company profile',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleAIProfileCreated = (aiProfile: any) => {
    setProfile(aiProfile);
    setShowAISetup(false);
    toast({
      title: 'Success',
      description: 'AI-powered company profile created successfully',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
          <p className="text-muted-foreground">Loading your company information...</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showAISetup) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
          <p className="text-muted-foreground">
            Create your company profile with AI assistance
          </p>
        </div>
        <AIProfileSetup
          onProfileCreated={handleAIProfileCreated}
          onCancel={() => setShowAISetup(false)}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
          <p className="text-muted-foreground">
            Create and manage your company information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>No Company Profile Found</span>
            </CardTitle>
            <CardDescription>
              Get started by creating your company profile manually or with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-3">
              <Button onClick={() => setShowAISetup(true)} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Create with AI
              </Button>
              <Button variant="outline" onClick={handleEdit} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Create Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatEmployeeCount = (count?: number) => {
    if (!count) return 'Not specified';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
          <p className="text-muted-foreground">
            Manage your company information and profile
          </p>
        </div>
        
        <div className="flex space-x-2">
          {!isEditing && (
            <>
              <Button variant="outline" onClick={() => setShowAISetup(true)}>
                <Plus className="h-4 w-4 mr-2" />
                AI Update
              </Button>
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Company Details</TabsTrigger>
          <TabsTrigger value="metrics">Business Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Company Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          value={editForm.company_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Describe your company"
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">{profile.company_name}</h2>
                      <p className="text-muted-foreground mt-1">
                        {profile.description || 'No description provided'}
                      </p>
                      <div className="flex items-center space-x-4 mt-3">
                        {profile.industry && (
                          <Badge variant="secondary">{profile.industry}</Badge>
                        )}
                        {profile.funding_stage && (
                          <Badge variant="outline">{profile.funding_stage}</Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Website</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {profile.website_url ? (
                    <OutboundLink href={profile.website_url} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline">
                      View Site
                    </OutboundLink>
                  ) : 'Not set'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Employees</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {formatEmployeeCount(profile.employee_count)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(profile.revenue_estimate)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Founded</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {profile.founded_year || 'Unknown'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic information about your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website_url">Website URL</Label>
                    <Input
                      id="website_url"
                      value={editForm.website_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={editForm.industry || ''}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>
                  <div>
                    <Label htmlFor="headquarters">Headquarters</Label>
                    <Input
                      id="headquarters"
                      value={editForm.headquarters || ''}
                      onChange={(e) => setEditForm({ ...editForm, headquarters: e.target.value })}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_model">Business Model</Label>
                    <Input
                      id="business_model"
                      value={editForm.business_model || ''}
                      onChange={(e) => setEditForm({ ...editForm, business_model: e.target.value })}
                      placeholder="e.g., SaaS, E-commerce, Marketplace"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Website</label>
                      <p className="text-sm">{profile.website_url || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Industry</label>
                      <p className="text-sm">{profile.industry || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Headquarters</label>
                      <p className="text-sm flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.headquarters || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Business Model</label>
                      <p className="text-sm">{profile.business_model || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
              <CardDescription>
                Financial and operational metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="founded_year">Founded Year</Label>
                    <Input
                      id="founded_year"
                      type="number"
                      value={editForm.founded_year || ''}
                      onChange={(e) => setEditForm({ ...editForm, founded_year: parseInt(e.target.value) || undefined })}
                      placeholder="e.g., 2020"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employee_count">Employee Count</Label>
                    <Input
                      id="employee_count"
                      type="number"
                      value={editForm.employee_count || ''}
                      onChange={(e) => setEditForm({ ...editForm, employee_count: parseInt(e.target.value) || undefined })}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="revenue_estimate">Annual Revenue (USD)</Label>
                    <Input
                      id="revenue_estimate"
                      type="number"
                      value={editForm.revenue_estimate || ''}
                      onChange={(e) => setEditForm({ ...editForm, revenue_estimate: parseInt(e.target.value) || undefined })}
                      placeholder="e.g., 1000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="funding_stage">Funding Stage</Label>
                    <Input
                      id="funding_stage"
                      value={editForm.funding_stage || ''}
                      onChange={(e) => setEditForm({ ...editForm, funding_stage: e.target.value })}
                      placeholder="e.g., Seed, Series A, Bootstrap"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Founded</label>
                      <p className="text-sm">{profile.founded_year || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Employees</label>
                      <p className="text-sm">{formatEmployeeCount(profile.employee_count)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Annual Revenue</label>
                      <p className="text-sm">{formatCurrency(profile.revenue_estimate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Funding Stage</label>
                      <p className="text-sm">{profile.funding_stage || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyProfilePage;