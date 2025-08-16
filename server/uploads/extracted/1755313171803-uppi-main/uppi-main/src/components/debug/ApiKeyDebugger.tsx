import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Check, X, Wrench } from 'lucide-react';

interface DebugInfo {
  provider: string;
  id: string;
  masked_key?: string;
  status?: string;
  has_vault_secret?: boolean;
  vault_secret_id?: string;
  storage_type?: string;
  is_working?: boolean;
  can_validate?: boolean;
  validation_error?: string;
  last_validated?: string;
  error?: string;
}

const ApiKeyDebugger: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugResults, setDebugResults] = useState<DebugInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    setIsLoading(true);
    setError(null);
    setDebugResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('debug-api-key');
      
      if (error) throw error;
      
      if (data?.success) {
        setDebugResults(data.debug_info);
      } else {
        throw new Error(data?.error || 'Debug failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCorruptedKey = async (keyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('manage_api_key', {
        operation: 'delete',
        user_id_param: user.id,
        api_key_id_param: keyId,
      });
      
      if (error) throw error;
      await runDebug();
    } catch (err: any) {
      setError(`Failed to delete key: ${err.message}`);
    }
  };

  const getStatusBadge = (info: DebugInfo) => {
    if (info.error) {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (!info.has_vault_secret) {
      return <Badge variant="secondary">No Vault Secret</Badge>;
    }
    if (!info.is_working) {
      return <Badge variant="destructive">Not Working</Badge>;
    }
    if (info.storage_type !== 'supabase_vault') {
      return <Badge variant="outline">Legacy Storage</Badge>;
    }
    return <Badge variant="default">Vault Active</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          API Key Debug Tool
        </CardTitle>
        <CardDescription>
          Diagnose issues with API key encryption and storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDebug} disabled={isLoading}>
          {isLoading ? 'Running Debug...' : 'Debug API Keys'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {debugResults && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Debug Results</h3>
            {debugResults.map((info, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{info.provider}</h4>
                    {getStatusBadge(info)}
                  </div>
                  
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>ID: {info.id}</div>
                      <div>Masked Key: {info.masked_key || 'N/A'}</div>
                      <div>Has Vault Secret: {info.has_vault_secret ? '✓' : '✗'}</div>
                      <div>Storage Type: {info.storage_type || 'Unknown'}</div>
                      <div>Is Working: {info.is_working ? '✓' : '✗'}</div>
                      <div>Status: {info.status || 'Unknown'}</div>
                      {info.last_validated && <div>Last Validated: {new Date(info.last_validated).toLocaleString()}</div>}
                    </div>

                    {info.validation_error && (
                      <Alert variant="destructive" className="mt-2">
                        <X className="h-4 w-4" />
                        <AlertDescription>
                          Validation Error: {info.validation_error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {info.error && (
                      <Alert variant="destructive" className="mt-2">
                        <X className="h-4 w-4" />
                        <AlertDescription>
                          General Error: {info.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {info.is_working && (
                      <Alert className="mt-2">
                        <Check className="h-4 w-4" />
                        <AlertDescription>
                          API key is working and accessible from Vault
                        </AlertDescription>
                      </Alert>
                    )}

                    {!info.has_vault_secret && info.storage_type !== 'supabase_vault' && (
                      <Button 
                        onClick={() => deleteCorruptedKey(info.id)} 
                        variant="destructive" 
                        size="sm" 
                        className="mt-2"
                      >
                        Delete Legacy Key
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

export default ApiKeyDebugger;