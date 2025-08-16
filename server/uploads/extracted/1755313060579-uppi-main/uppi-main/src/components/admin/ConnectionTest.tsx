import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Wifi } from 'lucide-react';
import { runConnectionTests, ConnectionTestResults } from '@/utils/connectionTest';

const ConnectionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ConnectionTestResults | null>(null);

  const handleRunTests = async () => {
    setTesting(true);
    try {
      const testResults = await runConnectionTests();
      setResults(testResults);
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    if (testing) return <Loader2 className="h-4 w-4 animate-spin" />;
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: boolean) => {
    if (testing) return <Badge variant="secondary">Testing...</Badge>;
    return <Badge variant={status ? "default" : "destructive"}>{status ? "Connected" : "Failed"}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={handleRunTests} disabled={testing} className="w-full">
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connections...
              </>
            ) : (
              'Test All Connections'
            )}
          </Button>

          {results && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.supabaseConnection)}
                  <span>Supabase Connection</span>
                </div>
                {getStatusBadge(results.supabaseConnection)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.authentication)}
                  <span>Authentication</span>
                </div>
                {getStatusBadge(results.authentication)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.database)}
                  <span>Database Access</span>
                </div>
                {getStatusBadge(results.database)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.edgeFunctions)}
                  <span>Edge Functions</span>
                </div>
                {getStatusBadge(results.edgeFunctions)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.apiKeys)}
                  <span>API Keys</span>
                </div>
                {getStatusBadge(results.apiKeys)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.realtimeConnection)}
                  <span>Real-time</span>
                </div>
                {getStatusBadge(results.realtimeConnection)}
              </div>

              {results.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionTest;