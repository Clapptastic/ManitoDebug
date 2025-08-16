import React, { useState } from 'react';
import { useEnterprise } from '@/hooks/useEnterprise';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, CreditCard, Activity, Plus, Settings, Users, Database } from 'lucide-react';
import { toast } from 'sonner';

const EnterprisePage: React.FC = () => {
  const {
    ssoConfigurations,
    auditLogs,
    userSubscription,
    allSubscriptions,
    complianceReports,
    enterpriseAnalytics,
    createSSOConfig,
    generateReport,
    isLoading
  } = useEnterprise();

  // Form states
  const [ssoForm, setSSOForm] = useState({
    provider: 'saml',
    provider_config: '{}',
    metadata: '{}'
  });
  
  const [reportForm, setReportForm] = useState({
    report_type: 'data_usage',
    period_start: '',
    period_end: ''
  });

  // Dialog states
  const [showCreateSSO, setShowCreateSSO] = useState(false);
  const [showGenerateReport, setShowGenerateReport] = useState(false);

  const handleCreateSSO = async () => {
    try {
      const config = await createSSOConfig({
        provider: ssoForm.provider,
        provider_config: JSON.parse(ssoForm.provider_config),
        metadata: JSON.parse(ssoForm.metadata)
      });
      
      if (config) {
        setSSOForm({ provider: 'saml', provider_config: '{}', metadata: '{}' });
        setShowCreateSSO(false);
      }
    } catch (error) {
      toast.error('Invalid JSON in configuration');
    }
  };

  const handleGenerateReport = async () => {
    if (!reportForm.period_start || !reportForm.period_end) {
      toast.error('Please select both start and end dates');
      return;
    }

    const report = await generateReport({
      report_type: reportForm.report_type,
      period_start: reportForm.period_start,
      period_end: reportForm.period_end,
      report_data: {
        generated_date: new Date().toISOString(),
        type: reportForm.report_type
      }
    });

    if (report) {
      setReportForm({ report_type: 'data_usage', period_start: '', period_end: '' });
      setShowGenerateReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Enterprise Dashboard</h1>
        <p className="text-muted-foreground">Manage SSO, compliance, billing, and enterprise features.</p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enterpriseAnalytics?.userActivity?.totalActions || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allSubscriptions.filter(s => s.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SSO Configurations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssoConfigurations.filter(c => c.is_active).length}</div>
            <p className="text-xs text-muted-foreground">Active configurations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceReports.length}</div>
            <p className="text-xs text-muted-foreground">Generated reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="sso" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sso">SSO Configuration</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="sso">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    SSO Configurations
                  </CardTitle>
                  <CardDescription>Manage Single Sign-On providers and configurations</CardDescription>
                </div>
                <Dialog open={showCreateSSO} onOpenChange={setShowCreateSSO}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add SSO Provider
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Configure SSO Provider</DialogTitle>
                      <DialogDescription>Set up a new Single Sign-On provider</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sso-provider">Provider Type</Label>
                        <select
                          id="sso-provider"
                          value={ssoForm.provider}
                          onChange={(e) => setSSOForm(prev => ({ ...prev, provider: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="saml">SAML 2.0</option>
                          <option value="oidc">OpenID Connect</option>
                          <option value="oauth2">OAuth 2.0</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="provider-config">Provider Configuration (JSON)</Label>
                        <Textarea
                          id="provider-config"
                          value={ssoForm.provider_config}
                          onChange={(e) => setSSOForm(prev => ({ ...prev, provider_config: e.target.value }))}
                          placeholder='{"entityId": "...", "ssoUrl": "...", "certificate": "..."}'
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="metadata">Metadata (JSON)</Label>
                        <Textarea
                          id="metadata"
                          value={ssoForm.metadata}
                          onChange={(e) => setSSOForm(prev => ({ ...prev, metadata: e.target.value }))}
                          placeholder='{"description": "Company SSO", "domain": "company.com"}'
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleCreateSSO} className="w-full">
                        Create SSO Configuration
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ssoConfigurations.map((config) => (
                  <div key={config.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{config.provider.toUpperCase()}</h4>
                        <Badge variant={config.is_active ? 'default' : 'secondary'}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(config.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {ssoConfigurations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No SSO configurations yet. Add your first provider to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>Track all system activities and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditLogs.slice(0, 20).map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Resource: {log.resource_type} {log.resource_id && `(${log.resource_id})`}
                    </p>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit logs available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Management
              </CardTitle>
              <CardDescription>Monitor subscriptions and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              {userSubscription && (
                <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-medium mb-2">Your Current Subscription</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Plan: {userSubscription.plan_name}</div>
                    <div>Status: <Badge>{userSubscription.status}</Badge></div>
                    <div>Period Start: {userSubscription.current_period_start ? new Date(userSubscription.current_period_start).toLocaleDateString() : 'N/A'}</div>
                    <div>Period End: {userSubscription.current_period_end ? new Date(userSubscription.current_period_end).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <h4 className="font-medium">All Subscriptions</h4>
                {allSubscriptions.map((subscription) => (
                  <div key={subscription.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{subscription.plan_name}</span>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      User: {subscription.user_id}
                    </p>
                  </div>
                ))}
                {allSubscriptions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No subscriptions found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Compliance Reports
                  </CardTitle>
                  <CardDescription>Generate and manage compliance reports</CardDescription>
                </div>
                <Dialog open={showGenerateReport} onOpenChange={setShowGenerateReport}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Compliance Report</DialogTitle>
                      <DialogDescription>Create a new compliance report for the specified period</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="report-type">Report Type</Label>
                        <select
                          id="report-type"
                          value={reportForm.report_type}
                          onChange={(e) => setReportForm(prev => ({ ...prev, report_type: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="data_usage">Data Usage Report</option>
                          <option value="user_activity">User Activity Report</option>
                          <option value="security_audit">Security Audit Report</option>
                          <option value="gdpr_compliance">GDPR Compliance Report</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="period-start">Period Start</Label>
                        <Input
                          id="period-start"
                          type="date"
                          value={reportForm.period_start}
                          onChange={(e) => setReportForm(prev => ({ ...prev, period_start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="period-end">Period End</Label>
                        <Input
                          id="period-end"
                          type="date"
                          value={reportForm.period_end}
                          onChange={(e) => setReportForm(prev => ({ ...prev, period_end: e.target.value }))}
                        />
                      </div>
                      <Button onClick={handleGenerateReport} className="w-full">
                        Generate Report
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceReports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{report.report_type.replace('_', ' ').toUpperCase()}</h4>
                      <Badge>{report.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Period: {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}</p>
                      <p>Generated: {new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                    {report.file_url && (
                      <Button variant="outline" size="sm" className="mt-2">
                        Download Report
                      </Button>
                    )}
                  </div>
                ))}
                {complianceReports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No compliance reports generated yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterprisePage;