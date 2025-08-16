/**
 * API Key Status Summary Component
 * Real-time status display for the API Keys page
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';

// Provider info constants
const PROVIDER_INFO = [
  { id: 'openai', name: 'OpenAI', icon: '🤖', description: 'GPT models for analysis' },
  { id: 'anthropic', name: 'Anthropic', icon: '🧠', description: 'Claude models for analysis' },
  { id: 'gemini', name: 'Google Gemini', icon: '💎', description: 'Google AI models' },
  { id: 'perplexity', name: 'Perplexity', icon: '🌐', description: 'Real-time web search' },
  { id: 'groq', name: 'Groq', icon: '⚡', description: 'Ultra-fast AI inference' },
  { id: 'mistral', name: 'Mistral', icon: '🇪🇺', description: 'European AI models' },
  { id: 'cohere', name: 'Cohere', icon: '🔗', description: 'Enterprise AI platform' },
  { id: 'huggingface', name: 'Hugging Face', icon: '🤗', description: 'Open source AI models' },
  { id: 'serpapi', name: 'SerpAPI', icon: '🐍', description: 'Google search results' },
  { id: 'newsapi', name: 'NewsAPI', icon: '📰', description: 'News data for research' },
  { id: 'alphavantage', name: 'Alpha Vantage', icon: '💹', description: 'Financial market data' },
  { id: 'google', name: 'Google', icon: '🔍', description: 'Google services' }
];

export const ApiKeyStatusSummary: React.FC = () => {
  const { 
    apiKeys, 
    isLoading, 
    refreshApiKeys, 
    statuses, 
    refreshStatuses, 
    hasWorkingApis, 
    workingApis 
  } = useUnifiedApiKeys();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      refreshApiKeys(),
      refreshStatuses()
    ]);
    setLastRefresh(new Date());
  };

  const getStatusIcon = (provider: string) => {
    const status = statuses[provider];
    if (!status) return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    if (status.isWorking) return <Wifi className="h-4 w-4 text-emerald-500" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = (provider: string) => {
    const status = statuses[provider];
    if (!status) return <Badge variant="outline">Not Configured</Badge>;
    if (status.isWorking) return <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>;
    return <Badge variant="destructive">Error</Badge>;
  };

  const configuredCount = Object.keys(statuses).length;
  const activeCount = workingApis.length;
  const totalProviders = PROVIDER_INFO.length;

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-Time API Status
            </CardTitle>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-emerald-700">{activeCount}</div>
              <div className="text-sm text-emerald-600">Active</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Wifi className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">{configuredCount}</div>
              <div className="text-sm text-blue-600">Configured</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
              <XCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-700">{configuredCount - activeCount}</div>
              <div className="text-sm text-orange-600">Errors</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
              <WifiOff className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-700">{totalProviders - configuredCount}</div>
              <div className="text-sm text-gray-600">Not Set</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <div>
              Health Score: {Math.round((activeCount / totalProviders) * 100)}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active APIs List */}
      {hasWorkingApis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ready for Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
            {workingApis.map(provider => {
              const providerInfo = PROVIDER_INFO.find(p => p.id === provider);
              return (
                <Badge 
                  key={provider} 
                  className="bg-emerald-100 text-emerald-800 border-emerald-200"
                >
                  {providerInfo?.icon} {providerInfo?.name || provider}
                </Badge>
              );
            })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error States */}
      {!hasWorkingApis && configuredCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ API keys configured but not working. Check the "Manage Keys" tab to validate your keys and resolve any issues.
          </AlertDescription>
        </Alert>
      )}

      {configuredCount === 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            🚀 Ready to get started? Add your first API key using the "Manage Keys" tab to unlock AI-powered features.
          </AlertDescription>
        </Alert>
      )}

      {/* Individual Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Provider Status Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PROVIDER_INFO.map(provider => (
              <div 
                key={provider.id} 
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{provider.icon}</span>
                  {getStatusIcon(provider.id)}
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">{provider.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(provider.id)}
                  {statuses[provider.id]?.lastChecked && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(statuses[provider.id].lastChecked).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};