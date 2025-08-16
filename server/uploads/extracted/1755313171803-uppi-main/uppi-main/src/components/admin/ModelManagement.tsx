import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useModelTracking } from '@/hooks/useModelTracking';
import { AIModelRegistry } from '@/services/ai/modelRegistry';
import { supabase } from '@/integrations/supabase/client';

interface ModelStatus {
  provider: string;
  model_id: string;
  is_available: boolean;
  last_checked: string;
  error_message?: string;
}

interface SystemAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function ModelManagement() {
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { checkModelAvailability, isChecking, lastCheck } = useModelTracking();

  useEffect(() => {
    loadModelStatuses();
    loadSystemAlerts();
  }, []);

  const loadModelStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('model_availability')
        .select('*')
        .order('last_checked', { ascending: false });

      if (error) throw error;
      setModelStatuses(data || []);
    } catch (error) {
      console.error('Error loading model statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('type', 'model_deprecation')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSystemAlerts(data || []);
    } catch (error) {
      console.error('Error loading system alerts:', error);
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      setSystemAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleRefresh = async () => {
    await checkModelAvailability();
    await loadModelStatuses();
    await loadSystemAlerts();
  };

  const getStatusBadge = (isAvailable: boolean, errorMessage?: string) => {
    if (isAvailable) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Available</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Unavailable</Badge>;
    }
  };

  const getRecommendations = () => {
    const recs = AIModelRegistry.getRecommendations();
    return Object.entries(recs).map(([useCase, models]) => ({
      useCase,
      models: Object.entries(models).map(([provider, model]) => ({ provider, model }))
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading model information...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Model Management</h1>
          <p className="text-muted-foreground">Track model availability and manage deprecations</p>
        </div>
        <Button onClick={handleRefresh} disabled={isChecking}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Check Models'}
        </Button>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Model Deprecation Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900">{alert.title}</h4>
                    <p className="text-sm text-orange-700 mt-1">{alert.message}</p>
                    <p className="text-xs text-orange-600 mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAlertAsRead(alert.id)}
                    className="ml-3"
                  >
                    Mark as Read
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Status */}
        <Card>
          <CardHeader>
            <CardTitle>Model Availability Status</CardTitle>
            <CardDescription>
              Current status of tracked AI models
              {lastCheck && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  Last checked: {lastCheck.toLocaleString()}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {modelStatuses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p>No model status data available</p>
                  <p className="text-sm">Run a model check to see availability</p>
                </div>
              ) : (
                modelStatuses.map((status) => (
                  <div key={`${status.provider}-${status.model_id}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{status.provider}</Badge>
                        <span className="font-medium">{status.model_id}</span>
                      </div>
                      {status.error_message && (
                        <p className="text-xs text-red-600 mt-1">{status.error_message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Checked: {new Date(status.last_checked).toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(status.is_available, status.error_message)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Models */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Models</CardTitle>
            <CardDescription>Current best models for different use cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getRecommendations().map(({ useCase, models }) => (
                <div key={useCase} className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium capitalize">{useCase.replace(/([A-Z])/g, ' $1')}</h4>
                  <div className="mt-2 space-y-1">
                    {models.map(({ provider, model }) => (
                      <div key={`${provider}-${model}`} className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary" className="text-xs">{provider}</Badge>
                        <span className="font-mono text-xs">{model}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Overview</CardTitle>
          <CardDescription>Summary of model availability by provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['openai', 'anthropic', 'perplexity'].map((provider) => {
              const providerModels = modelStatuses.filter(s => s.provider === provider);
              const availableCount = providerModels.filter(s => s.is_available).length;
              const totalCount = providerModels.length;

              return (
                <div key={provider} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{provider}</h4>
                    <Badge variant={availableCount === totalCount ? "default" : "destructive"}>
                      {availableCount}/{totalCount}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {totalCount === 0 ? 'No models tracked' : `${availableCount} available, ${totalCount - availableCount} unavailable`}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}