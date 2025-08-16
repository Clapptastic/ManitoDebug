import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface DebugInfo {
  authentication: {
    isAuthenticated: boolean;
    userId?: string;
    error?: string;
  };
  apiKeys: {
    hasOpenAI: boolean;
    status?: string;
    error?: string;
  };
  database: {
    canReadAnalyses: boolean;
    canWriteAnalyses: boolean;
    error?: string;
  };
  edgeFunction: {
    isAvailable: boolean;
    lastTest?: string;
    error?: string;
  };
}

// Analysis session diagnostics types
interface AnalysisRun {
  id: string;
  session_id: string;
  status: string;
  run_type: string;
  started_at: string;
  completed_at: string | null;
  execution_time_ms: number | null;
  error_message: string | null;
}

interface ProgressRow {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  progress_percentage: number | null;
  total_competitors: number | null;
  completed_competitors: number | null;
  current_competitor: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const DebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Session diagnostics state
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionRuns, setSessionRuns] = useState<AnalysisRun[]>([]);
  const [sessionProgress, setSessionProgress] = useState<ProgressRow[]>([]);
  const [sessionDiagError, setSessionDiagError] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: DebugInfo = {
      authentication: { isAuthenticated: false },
      apiKeys: { hasOpenAI: false },
      database: { canReadAnalyses: false, canWriteAnalyses: false },
      edgeFunction: { isAvailable: false }
    };

    try {
      // Test authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        info.authentication.error = authError.message;
      } else if (session?.user) {
        info.authentication.isAuthenticated = true;
        info.authentication.userId = session.user.id;

        // Test API keys
        try {
          const { data: apiKeyData, error: keyError } = await supabase
            .rpc('manage_api_key', {
              operation: 'select',
              user_id_param: session.user.id
            });

          if (keyError) {
            info.apiKeys.error = keyError.message;
          } else {
            const keysArray = Array.isArray(apiKeyData) ? apiKeyData : [];
            const openaiKey = keysArray.find((key: any) => key.provider === 'openai');
            info.apiKeys.hasOpenAI = !!openaiKey;
            info.apiKeys.status = (openaiKey as any)?.status || 'not found';
          }
        } catch (error: any) {
          info.apiKeys.error = error.message;
        }

        // Test database access
        try {
          const { error: readError } = await supabase
            .from('competitor_analyses')
            .select('id')
            .limit(1);

          info.database.canReadAnalyses = !readError;
          if (readError) {
            info.database.error = readError.message;
          }
        } catch (error: any) {
          info.database.error = error.message;
        }

        // Test edge function
        try {
          const { data, error } = await supabase.functions.invoke('competitor-analysis', {
            body: { action: 'test' }
          });

          info.edgeFunction.isAvailable = !error;
          info.edgeFunction.lastTest = new Date().toISOString();
          if (error) {
            info.edgeFunction.error = error.message;
          }
        } catch (error: any) {
          info.edgeFunction.error = error.message;
        }
      }
    } catch (error: any) {
      info.authentication.error = error.message;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  // Session diagnostics executor
  const runSessionDiagnostics = async () => {
    if (!sessionId) {
      setSessionDiagError('Enter a session ID');
      return;
    }
    setSessionLoading(true);
    setSessionDiagError(null);
    try {
      const { data: runs, error: runsErr } = await supabase
        .from('analysis_runs')
        .select('id, session_id, status, run_type, started_at, completed_at, execution_time_ms, error_message')
        .eq('session_id', sessionId)
        .order('started_at', { ascending: false });
      if (runsErr) throw runsErr;
      setSessionRuns((runs || []) as AnalysisRun[]);

      const { data: progress, error: progErr } = await supabase
        .rpc('get_competitor_analysis_progress', { session_id_param: sessionId });
      if (progErr) throw progErr;
      const arr = Array.isArray(progress) ? progress : progress ? [progress] : [];
      setSessionProgress(arr as ProgressRow[]);
    } catch (e: any) {
      setSessionDiagError(e?.message || 'Failed to load session diagnostics');
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  if (!debugInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Running diagnostics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>System Diagnostics</CardTitle>
        <Button onClick={runDiagnostics} disabled={loading} size="sm">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon status={debugInfo.authentication.isAuthenticated} />
            <span>Authentication</span>
          </div>
          <div className="text-right">
            {debugInfo.authentication.isAuthenticated ? (
              <Badge variant="outline">User: {debugInfo.authentication.userId?.slice(0, 8)}...</Badge>
            ) : (
              <Badge variant="destructive">Not authenticated</Badge>
            )}
          </div>
        </div>
        {debugInfo.authentication.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{debugInfo.authentication.error}</AlertDescription>
          </Alert>
        )}

        {/* API Keys */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon status={debugInfo.apiKeys.hasOpenAI} />
            <span>OpenAI API Key</span>
          </div>
          <Badge variant={debugInfo.apiKeys.hasOpenAI ? "default" : "destructive"}>
            {debugInfo.apiKeys.status || 'Missing'}
          </Badge>
        </div>
        {debugInfo.apiKeys.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{debugInfo.apiKeys.error}</AlertDescription>
          </Alert>
        )}

        {/* Database */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon status={debugInfo.database.canReadAnalyses} />
            <span>Database Access</span>
          </div>
          <Badge variant={debugInfo.database.canReadAnalyses ? "default" : "destructive"}>
            {debugInfo.database.canReadAnalyses ? 'Working' : 'Failed'}
          </Badge>
        </div>
        {debugInfo.database.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{debugInfo.database.error}</AlertDescription>
          </Alert>
        )}

        {/* Edge Function */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon status={debugInfo.edgeFunction.isAvailable} />
            <span>Edge Function</span>
          </div>
          <Badge variant={debugInfo.edgeFunction.isAvailable ? "default" : "destructive"}>
            {debugInfo.edgeFunction.isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
        </div>
        {debugInfo.edgeFunction.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{debugInfo.edgeFunction.error}</AlertDescription>
          </Alert>
        )}

        {debugInfo.edgeFunction.lastTest && (
          <p className="text-sm text-muted-foreground">
            Last tested: {new Date(debugInfo.edgeFunction.lastTest).toLocaleString()}
          </p>
        )}

        {/* Analysis Session Diagnostics */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Analysis Session Diagnostics</h3>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter session_id"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            />
            <Button size="sm" onClick={runSessionDiagnostics} disabled={sessionLoading || !sessionId}>
              {sessionLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Check
            </Button>
          </div>

          {sessionDiagError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{sessionDiagError}</AlertDescription>
            </Alert>
          )}

          {(sessionRuns.length > 0 || sessionProgress.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Runs</h4>
                <div className="space-y-2">
                  {sessionRuns.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-md border p-2">
                      <div className="text-sm">
                        <div className="font-medium">{r.run_type}</div>
                        <div className="text-muted-foreground text-xs">{new Date(r.started_at).toLocaleString()}</div>
                      </div>
                      <Badge variant={r.status === 'completed' ? 'default' : r.status === 'failed' ? 'destructive' : 'outline'}>
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                  {sessionRuns.length === 0 && (
                    <p className="text-sm text-muted-foreground">No runs found for this session.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Progress</h4>
                {sessionProgress.length > 0 ? (
                  (() => {
                    const p = sessionProgress[0];
                    const pct = p?.progress_percentage ?? (
                      p?.total_competitors && p?.completed_competitors
                        ? Math.round((p.completed_competitors / p.total_competitors) * 100)
                        : null
                    );
                    return (
                      <div className="rounded-md border p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Status</span>
                          <Badge variant={p.status === 'completed' ? 'default' : p.status === 'failed' ? 'destructive' : 'outline'}>
                            {p.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{pct !== null ? `${pct}%` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Completed / Total</span>
                          <span>
                            {p.completed_competitors ?? 0} / {p.total_competitors ?? 0}
                          </span>
                        </div>
                        {p.current_competitor && (
                          <div className="flex items-center justify-between text-sm">
                            <span>Current</span>
                            <span>{p.current_competitor}</span>
                          </div>
                        )}
                        {p.error_message && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">{p.error_message}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-sm text-muted-foreground">No progress rows for this session.</p>
                )}
              </div>
            </div>
          )}

          {sessionRuns.length > 0 && sessionProgress.length > 0 && (() => {
            const latest = sessionRuns[0];
            const prog = sessionProgress[0];
            const mismatch = (latest.status === 'completed' && prog.status !== 'completed') ||
              (latest.status === 'failed' && prog.status !== 'failed');
            return mismatch ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Status mismatch detected between analysis_runs ({latest.status}) and progress ({prog.status}).
                </AlertDescription>
              </Alert>
            ) : null;
          })()}
        </div>
      </CardContent>
    </Card>
  );
};