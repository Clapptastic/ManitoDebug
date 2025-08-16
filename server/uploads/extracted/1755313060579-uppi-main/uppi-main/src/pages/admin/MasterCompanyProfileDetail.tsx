import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  RefreshCw, 
  Shield, 
  Building2, 
  MapPin, 
  Calendar,
  Users,
  DollarSign,
  Globe,
  TrendingUp,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { MasterCompanyProfileService, MasterCompanyProfile, ValidationLog, ProfileMerge, ConfidenceHistory } from '@/services/masterCompanyProfileService';

export default function MasterCompanyProfileDetail() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<MasterCompanyProfile | null>(null);
  const [validationLogs, setValidationLogs] = useState<ValidationLog[]>([]);
  const [mergeHistory, setMergeHistory] = useState<ProfileMerge[]>([]);
  const [confidenceHistory, setConfidenceHistory] = useState<ConfidenceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchValidationLogs();
      fetchMergeHistory();
      fetchConfidenceHistory();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    if (!profileId) return;
    
    try {
      setLoading(true);
      const data = await MasterCompanyProfileService.getProfileById(profileId);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to fetch company profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchValidationLogs = async () => {
    if (!profileId) return;
    
    try {
      const logs = await MasterCompanyProfileService.getValidationLogs(profileId);
      setValidationLogs(logs);
    } catch (error) {
      console.error('Error fetching validation logs:', error);
    }
  };

  const fetchMergeHistory = async () => {
    if (!profileId) return;
    
    try {
      const history = await MasterCompanyProfileService.getMergeHistory(profileId);
      setMergeHistory(history);
    } catch (error) {
      console.error('Error fetching merge history:', error);
    }
  };

  const fetchConfidenceHistory = async () => {
    if (!profileId) return;
    
    try {
      const history = await MasterCompanyProfileService.getConfidenceHistory(profileId);
      setConfidenceHistory(history);
    } catch (error) {
      console.error('Error fetching confidence history:', error);
    }
  };

  const handleValidate = async () => {
    if (!profileId) return;
    
    try {
      setValidating(true);
      const success = await MasterCompanyProfileService.validateProfile(profileId);
      
      if (success) {
        // Refresh data after validation
        setTimeout(() => {
          fetchProfile();
          fetchValidationLogs();
          fetchConfidenceHistory();
        }, 2000);
      }
    } catch (error) {
      console.error('Error validating profile:', error);
    } finally {
      setValidating(false);
    }
  };

  const getValidationStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Validated</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Info className="h-3 w-3" />{status}</Badge>;
    }
  };

  const getConfidenceBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatEmployeeCount = (count?: number) => {
    if (!count) return 'N/A';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <CardDescription>Company profile not found.</CardDescription>
          <Button 
            onClick={() => navigate('/admin/master-profiles')} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profiles
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate('/admin/master-profiles')} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{profile.company_name}</h1>
              {getValidationStatusBadge(profile.validation_status)}
              <Badge variant={getConfidenceBadgeVariant(profile.overall_confidence_score)}>
                {profile.overall_confidence_score.toFixed(1)}% Confidence
              </Badge>
            </div>
            <p className="text-muted-foreground">{profile.description || 'No description available'}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleValidate}
            variant="outline" 
            size="sm"
            disabled={validating || profile.validation_status === 'pending'}
          >
            {validating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Validate Profile
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Industry</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.industry || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEmployeeCount(profile.employee_count)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profile.revenue_estimate)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.data_completeness_score}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial Data</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="validation">Validation Logs</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Headquarters:</span>
                    <p>{profile.headquarters || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Founded:</span>
                    <p>{profile.founded_year || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Business Model:</span>
                    <p>{profile.business_model || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Website:</span>
                    <p>
                       {profile.website_url ? (
                        <a 
                          href={profile.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {profile.website_url}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium text-muted-foreground">Verification Status:</span>
                    <p>{profile.verification_status || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Source Analyses:</span>
                    <p>{profile.source_analyses?.length || 0} analyses</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Last Updated:</span>
                    <p>{new Date(profile.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Last Validation:</span>
                    <p>{new Date(profile.last_validation_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Revenue Estimate:</span>
                  <p className="text-lg font-semibold">{formatCurrency(profile.revenue_estimate)}</p>
                </div>
                {profile.financial_metrics && Object.keys(profile.financial_metrics).length > 0 && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-muted-foreground">Financial Metrics:</span>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded">
                      {JSON.stringify(profile.financial_metrics, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Technology Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.technology_stack && Object.keys(profile.technology_stack).length > 0 ? (
                <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                  {JSON.stringify(profile.technology_stack, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No technology stack information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Validation Logs
              </CardTitle>
              <CardDescription>Recent validation activities for this profile</CardDescription>
            </CardHeader>
            <CardContent>
              {validationLogs.length > 0 ? (
                <div className="space-y-4">
                  {validationLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{log.data_field}</h4>
                          <p className="text-sm text-muted-foreground">
                            {log.validation_source} • {log.validation_method}
                          </p>
                          {log.confidence_score && (
                            <Badge variant="outline" className="mt-1">
                              {log.confidence_score}% confidence
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.validated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No validation logs available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Merge History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mergeHistory.length > 0 ? (
                  <div className="space-y-3">
                    {mergeHistory.slice(0, 5).map((merge) => (
                      <div key={merge.id} className="border-l-2 border-muted pl-3">
                        <div className="text-sm">
                          <span className="font-medium">{merge.merge_type}</span>
                          <span className="text-muted-foreground ml-2">
                            {merge.fields_updated.length} fields updated
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(merge.performed_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No merge history available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Confidence History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {confidenceHistory.length > 0 ? (
                  <div className="space-y-3">
                    {confidenceHistory.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="border-l-2 border-muted pl-3">
                        <div className="text-sm">
                          <span className="font-medium">{entry.data_field}</span>
                          <Badge variant="outline" className="ml-2">
                            {entry.confidence_score}%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(entry.recorded_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No confidence history available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}