import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IntegrityIssue {
  provider: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
}

interface IntegrityReport {
  user_id: string;
  vault_available: boolean;
  issues: IntegrityIssue[];
  checked_at: string;
}

export const ApiKeyIntegrityChecker: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runIntegrityCheck = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      console.log('🔍 Running API key integrity check...');
      
      const { data, error } = await supabase.rpc('validate_api_key_integrity');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(String(data.error));
      }
      
      setReport(data as unknown as IntegrityReport);
      
      const reportData = data as unknown as IntegrityReport;
      const criticalIssues = reportData?.issues?.filter((issue: IntegrityIssue) => issue.severity === 'critical') || [];
      
      if (criticalIssues.length > 0) {
        toast.error(`Found ${criticalIssues.length} critical encryption issues`);
      } else {
        toast.success('API key integrity check completed successfully');
      }
      
    } catch (err) {
      console.error('❌ Integrity check failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Integrity check failed: ${errorMessage}`);
    } finally {
      setIsChecking(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'warning':
        return 'bg-warning text-warning-foreground';
      case 'info':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getIssueDescription = (issue: string) => {
    switch (issue) {
      case 'missing_both_vault_and_plaintext':
        return 'API key has no vault secret ID and no plaintext backup. Key is unrecoverable.';
      case 'missing_plaintext_no_vault':
        return 'No vault available and no plaintext stored. Key cannot be decrypted.';
      case 'vault_secret_missing':
        return 'Vault secret ID exists but secret not found in vault.';
      case 'encryption_mismatch':
        return 'Key appears to be encrypted with incompatible method.';
      default:
        return issue;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          API Key Encryption Integrity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Check for encryption/decryption issues and vault inconsistencies
          </p>
          <Button 
            onClick={runIntegrityCheck} 
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Run Check
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Vault Status:</span>
                <Badge 
                  variant={report.vault_available ? "success" : "secondary"}
                  className="ml-2"
                >
                  {report.vault_available ? 'Available' : 'Not Available'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Checked:</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(report.checked_at).toLocaleString()}
                </span>
              </div>
            </div>

            {report.issues.length === 0 ? (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  No integrity issues found. All API keys are properly encrypted and accessible.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Issues Found:</h4>
                {report.issues.map((issue, index) => (
                  <Alert key={index} variant={issue.severity === 'critical' ? 'destructive' : 'default'}>
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{issue.provider}</span>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getIssueDescription(issue.issue)}
                        </p>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}

            {report.issues.some(issue => issue.severity === 'critical') && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Critical issues detected!</strong> Some API keys may be corrupted or unrecoverable. 
                  Consider re-entering these keys or running the migration tool.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};