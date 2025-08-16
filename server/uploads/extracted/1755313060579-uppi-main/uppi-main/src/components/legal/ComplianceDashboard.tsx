import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Users, Database, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ComplianceMetrics {
  totalDocuments: number;
  activeDocuments: number;
  totalConsents: number;
  recentRequests: number;
  complianceScore: number;
}

interface DataSubjectRequest {
  id: string;
  request_type: string;
  status: string;
  submitted_at: string;
  processed_at?: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
}

export const ComplianceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalDocuments: 0,
    activeDocuments: 0,
    totalConsents: 0,
    recentRequests: 0,
    complianceScore: 0
  });
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      // Fetch legal documents
      const { data: documents } = await supabase
        .from('legal_documents')
        .select('id, is_active');

      // Fetch user consents
      const { data: consents } = await supabase
        .from('user_consents')
        .select('id');

      // Fetch data subject requests
      const { data: requestsData } = await supabase
        .from('data_subject_requests')
        .select('id, request_type, status, submitted_at, processed_at')
        .order('submitted_at', { ascending: false })
        .limit(10);

      // Fetch recent audit logs
      const { data: auditData } = await supabase
        .from('compliance_audit_logs')
        .select('id, action, resource_type, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      const totalDocs = documents?.length || 0;
      const activeDocs = documents?.filter(d => d.is_active).length || 0;
      const totalConsents = consents?.length || 0;
      const recentRequests = requestsData?.filter(r => {
        const requestDate = new Date(r.submitted_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return requestDate > thirtyDaysAgo;
      }).length || 0;

      // Calculate compliance score
      const complianceScore = calculateComplianceScore({
        hasPrivacyPolicy: activeDocs > 0,
        hasTermsOfService: documents?.some(d => d.is_active && documents.find(doc => doc.id === d.id)),
        userConsents: totalConsents,
        requestsProcessed: requestsData?.filter(r => r.status === 'completed').length || 0
      });

      setMetrics({
        totalDocuments: totalDocs,
        activeDocuments: activeDocs,
        totalConsents,
        recentRequests,
        complianceScore
      });

      setRequests(requestsData || []);
      setAuditLogs(auditData || []);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch compliance data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateComplianceScore = (factors: {
    hasPrivacyPolicy: boolean;
    hasTermsOfService: boolean;
    userConsents: number;
    requestsProcessed: number;
  }): number => {
    let score = 0;
    
    if (factors.hasPrivacyPolicy) score += 25;
    if (factors.hasTermsOfService) score += 25;
    if (factors.userConsents > 0) score += 25;
    if (factors.requestsProcessed >= 0) score += 25;
    
    return Math.min(score, 100);
  };

  const getComplianceStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', variant: 'default' as const };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600', variant: 'default' as const };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-600', variant: 'secondary' as const };
    return { label: 'Needs Improvement', color: 'text-red-600', variant: 'destructive' as const };
  };

  const formatRequestType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const complianceStatus = getComplianceStatus(metrics.complianceScore);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading compliance dashboard...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Compliance Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor your GDPR compliance status and manage data subject requests.
        </p>
      </div>

      {/* Compliance Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            GDPR Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold">{metrics.complianceScore}%</div>
              <Badge variant={complianceStatus.variant} className="mt-2">
                {complianceStatus.label}
              </Badge>
            </div>
            <div className="text-right">
              <Progress value={metrics.complianceScore} className="w-32 mb-2" />
              <p className="text-sm text-muted-foreground">Compliance Level</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{metrics.activeDocuments}</div>
              <p className="text-sm text-muted-foreground">Active Policies</p>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{metrics.totalConsents}</div>
              <p className="text-sm text-muted-foreground">User Consents</p>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{metrics.recentRequests}</div>
              <p className="text-sm text-muted-foreground">Recent Requests</p>
            </div>
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{auditLogs.length}</div>
              <p className="text-sm text-muted-foreground">Audit Entries</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Data Subject Requests</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Recent Data Subject Requests</CardTitle>
              <CardDescription>
                Track and manage GDPR data subject requests from users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{formatRequestType(request.request_type)}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(request.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                        {request.status === 'pending' && (
                          <Button size="sm" variant="outline">
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No data subject requests yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Recent compliance-related activities and data processing events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 border rounded">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.resource_type} • {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No audit logs available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Compliance Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-green-900">Legal Documents</p>
                  </div>
                  <p className="text-sm text-green-800">
                    You have active privacy policies and terms of service.
                  </p>
                </div>
                
                {metrics.complianceScore < 100 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <p className="font-medium text-yellow-900">Improvement Areas</p>
                    </div>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {metrics.activeDocuments === 0 && (
                        <li>• Create and activate privacy policy and terms of service</li>
                      )}
                      {metrics.totalConsents === 0 && (
                        <li>• Implement cookie consent mechanism</li>
                      )}
                      <li>• Regular compliance audits and documentation updates</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};