import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Key, Shield, Eye } from 'lucide-react';
import { debugApiKeysService, type ApiKeyDebugResult } from '@/services/debugApiKeysService';
import { toast } from '@/hooks/use-toast';

export const ApiKeyHealthPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugResults, setDebugResults] = useState<ApiKeyDebugResult[]>([]);
  const [summary, setSummary] = useState<{
    totalKeys: number;
    workingKeys: number;
    encryptionIssues: number;
    validationIssues: number;
  }>({ totalKeys: 0, workingKeys: 0, encryptionIssues: 0, validationIssues: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const result = await debugApiKeysService.debugAllApiKeys();
      
      if (result.success) {
        setDebugResults(result.results);
        setSummary(result.summary);
        setLastUpdated(new Date());
        
        toast({
          title: 'Diagnostics Complete',
          description: `Found ${result.summary.workingKeys}/${result.summary.totalKeys} working API keys`,
          variant: result.summary.workingKeys > 0 ? 'default' : 'destructive'
        });
      } else {
        toast({
          title: 'Diagnostics Failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixCorruptedKeys = async () => {
    setIsLoading(true);
    try {
      const result = await debugApiKeysService.fixCorruptedKeys();
      
      if (result.success) {
        toast({
          title: 'Fix Attempted',
          description: `Fixed ${result.fixed.length} keys. ${result.errors.length} errors.`,
          variant: result.fixed.length > 0 ? 'default' : 'destructive'
        });
        
        // Re-run diagnostics after fix attempt
        await runDiagnostics();
      } else {
        toast({
          title: 'Fix Failed',
          description: result.errors.join(', '),
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (result: ApiKeyDebugResult) => {
    if (result.validationStatus === 'working') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (result.decryptionStatus === 'failed') return <XCircle className="h-4 w-4 text-red-600" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  };

  const getStatusBadge = (result: ApiKeyDebugResult) => {
    if (result.validationStatus === 'working') return <Badge variant="default" className="bg-green-100 text-green-800">Working</Badge>;
    if (!result.hasKey) return <Badge variant="outline">No Key</Badge>;
    if (result.decryptionStatus === 'failed') return <Badge variant="destructive">Decryption Error</Badge>;
    if (result.validationStatus === 'failed') return <Badge variant="secondary">Validation Failed</Badge>;
    return <Badge variant="outline">Unknown</Badge>;
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              API Key Health Diagnostics
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Comprehensive debugging of API key encryption, decryption, and validation
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fixCorruptedKeys}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Fix Issues
            </Button>
            <Button
              onClick={runDiagnostics}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Run Diagnostics
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Running comprehensive API key diagnostics...
            </AlertDescription>
          </Alert>
        )}

        {summary.totalKeys > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.totalKeys}</div>
              <div className="text-sm text-muted-foreground">Total Keys</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.workingKeys}</div>
              <div className="text-sm text-muted-foreground">Working</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.encryptionIssues}</div>
              <div className="text-sm text-muted-foreground">Encryption Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.validationIssues}</div>
              <div className="text-sm text-muted-foreground">Validation Issues</div>
            </div>
          </div>
        )}

        {debugResults.length > 0 && (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {debugResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result)}
                      <h4 className="font-semibold capitalize">{result.provider}</h4>
                      {getStatusBadge(result)}
                    </div>
                    {result.keyPreview && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Key className="h-3 w-3" />
                        {result.keyPreview}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Key Format:</strong> 
                      <Badge variant="outline" className="ml-2">
                        {result.keyFormat}
                      </Badge>
                    </div>
                    <div>
                      <strong>Decryption:</strong> 
                      <Badge 
                        variant={result.decryptionStatus === 'success' ? 'default' : 'destructive'} 
                        className="ml-2"
                      >
                        {result.decryptionStatus}
                      </Badge>
                    </div>
                    <div>
                      <strong>Validation:</strong> 
                      <Badge 
                        variant={result.validationStatus === 'working' ? 'default' : 'destructive'} 
                        className="ml-2"
                      >
                        {result.validationStatus}
                      </Badge>
                    </div>
                    <div>
                      <strong>Last Validated:</strong> 
                      <span className="ml-2 text-muted-foreground">
                        {result.lastValidated ? new Date(result.lastValidated).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  {result.error && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {lastUpdated && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};