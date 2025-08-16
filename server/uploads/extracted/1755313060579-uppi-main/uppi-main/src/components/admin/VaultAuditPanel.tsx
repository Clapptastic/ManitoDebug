import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Key,
  Settings,
  Server
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuditResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface VaultAuditReport {
  overall_status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  results: AuditResult[];
  recommendations: string[];
}

export const VaultAuditPanel: React.FC = () => {
  const [auditReport, setAuditReport] = useState<VaultAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState<string | null>(null);

  const runVaultAudit = async () => {
    setIsAuditing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('audit-vault-system');

      if (error) {
        throw error;
      }

      setAuditReport(data);
      setLastAuditTime(new Date().toISOString());
      
      toast({
        title: "Vault Audit Completed",
        description: `System status: ${data.overall_status}`,
        variant: data.overall_status === 'healthy' ? 'default' : 'destructive'
      });

    } catch (error) {
      console.error('Audit failed:', error);
      toast({
        title: "Audit Failed",
        description: "Failed to run vault system audit. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'vault_extension':
      case 'vault_operations':
        return <Shield className="h-4 w-4" />;
      case 'api_keys_schema':
      case 'api_key_functions':
        return <Key className="h-4 w-4" />;
      case 'rls_policies':
        return <Database className="h-4 w-4" />;
      case 'edge_function_auth':
        return <Server className="h-4 w-4" />;
      case 'environment_config':
        return <Settings className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Vault System Audit
              </CardTitle>
              <CardDescription>
                Comprehensive audit of Supabase vault configuration and API key management system
              </CardDescription>
            </div>
            <Button
              onClick={runVaultAudit}
              disabled={isAuditing}
              className="flex items-center gap-2"
            >
              {isAuditing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {isAuditing ? 'Running Audit...' : 'Run Audit'}
            </Button>
          </div>
        </CardHeader>

        {auditReport && (
          <CardContent className="space-y-6">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Overall System Status</h3>
                <p className="text-sm text-muted-foreground">
                  Last audited: {new Date(auditReport.timestamp).toLocaleString()}
                </p>
              </div>
              {getOverallStatusBadge(auditReport.overall_status)}
            </div>

            {/* Audit Results */}
            <div>
              <h3 className="font-semibold mb-4">Audit Results</h3>
              <div className="space-y-3">
                {auditReport.results.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      {getComponentIcon(result.component)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm capitalize">
                          {result.component.replace(/_/g, ' ')}
                        </h4>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.message}
                      </p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            View details
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusIcon(result.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {auditReport.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Recommendations</h3>
                <div className="space-y-2">
                  {auditReport.recommendations.map((recommendation, index) => (
                    <Alert key={index} className="border-blue-200 bg-blue-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {recommendation}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {auditReport.results.filter(r => r.status === 'pass').length}
                </div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {auditReport.results.filter(r => r.status === 'warning').length}
                </div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {auditReport.results.filter(r => r.status === 'fail').length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        )}

        {!auditReport && (
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Run an audit to check your vault system configuration</p>
              <p className="text-sm mt-1">This will test encryption, storage, and API key management</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};