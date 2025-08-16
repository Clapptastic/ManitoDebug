import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  Trash2,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FlowTestRun {
  id: string;
  created_at: string;
  run_type: string;
  competitor: string | null;
  success: boolean;
  steps: any;
  providers: any;
  function_error: any;
}

export const HistoryPanel: React.FC = () => {
  const [runs, setRuns] = useState<FlowTestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<FlowTestRun | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_last_flow_test_runs', { 
          run_type_param: 'competitor_flow_monitor',
          limit_param: 10 
        });

      if (error) throw error;
      setRuns((data || []).map((run: any) => ({
        ...run,
        steps: Array.isArray(run.steps) ? run.steps : [],
        providers: Array.isArray(run.providers) ? run.providers : []
      })));
    } catch (error) {
      console.error('Failed to load history:', error);
      toast({
        title: 'Load Error',
        description: 'Failed to load test run history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      // Note: This would need a proper RPC function to clear history safely
      toast({
        title: 'Clear History',
        description: 'History clearing not implemented yet',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const formatDuration = (steps: any[]) => {
    const totalDuration = steps.reduce((sum, step) => sum + (step.duration || 0), 0);
    return totalDuration > 0 ? `${Math.round(totalDuration)}ms` : '—';
  };

  const getSuccessRate = (steps: any[]) => {
    if (!steps.length) return 0;
    const successSteps = steps.filter(s => s.status === 'success').length;
    return Math.round((successSteps / steps.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Test Run History</h3>
          <p className="text-sm text-muted-foreground">
            Recent competitor analysis flow tests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadHistory}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearHistory}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* History List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Recent Runs ({runs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : runs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No test runs found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run a flow test to see history here
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {runs.map((run, index) => (
                    <div key={run.id}>
                      <div 
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedRun?.id === run.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                        }`}
                        onClick={() => setSelectedRun(run)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {run.success ? (
                                <CheckCircle className="h-4 w-4 text-success" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                              <span className="font-medium text-sm">
                                {run.competitor || 'Unknown Competitor'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {new Date(run.created_at).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={run.success ? 'success' : 'destructive'} 
                                className="text-xs"
                              >
                                {getSuccessRate(run.steps)}% Success
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{run.steps?.length || 0} steps</span>
                            <span>{formatDuration(run.steps || [])}</span>
                          </div>
                        </div>
                      </div>
                      {index < runs.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Run Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Run Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRun ? (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {/* Run Summary */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Test Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Competitor:</span>
                        <p className="font-medium">{selectedRun.competitor || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className={`font-medium ${selectedRun.success ? 'text-success' : 'text-destructive'}`}>
                          {selectedRun.success ? 'Success' : 'Failed'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Steps:</span>
                        <p className="font-medium">{selectedRun.steps?.length || 0}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium">{formatDuration(selectedRun.steps || [])}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Step Details */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Step Results</h4>
                    <div className="space-y-2">
                      {(selectedRun.steps || []).map((step: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <div className="flex items-center gap-2">
                            {step.status === 'success' ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : step.status === 'error' ? (
                              <XCircle className="h-3 w-3 text-destructive" />
                            ) : (
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-sm">{step.name || `Step ${index + 1}`}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {step.duration ? `${Math.round(step.duration)}ms` : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Provider Results */}
                  {selectedRun.providers && selectedRun.providers.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Provider Results</h4>
                        <div className="space-y-2">
                          {selectedRun.providers.map((provider: any, index: number) => (
                            <div key={index} className="p-2 rounded-md bg-muted/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{provider.name}</span>
                                <Badge 
                                  variant={provider.status === 'success' ? 'success' : 'destructive'}
                                  className="text-xs"
                                >
                                  {provider.status}
                                </Badge>
                              </div>
                              {provider.tokens && (
                                <div className="text-xs text-muted-foreground">
                                  {provider.tokens} tokens • ${provider.cost?.toFixed(4) || '0.0000'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Error Details */}
                  {selectedRun.function_error && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-destructive">Error Details</h4>
                        <pre className="text-xs bg-destructive/10 p-2 rounded-md text-destructive overflow-x-auto">
                          {JSON.stringify(selectedRun.function_error, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Eye className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Select a run to view details</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click on any test run from the history list
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};