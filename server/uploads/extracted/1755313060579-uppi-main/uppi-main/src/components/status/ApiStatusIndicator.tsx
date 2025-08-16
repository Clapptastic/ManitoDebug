/**
 * API Status Indicator Component
 * Shows real-time status of all API providers with health monitoring
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { competitorAnalysisService } from '@/services/competitorAnalysisService';
import { useRealtimeApiKeys } from '@/hooks/realtime/useRealtimeApiKeys';
import { ApiKeyType } from '@/types/api-keys/unified';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Activity,
  Zap
} from 'lucide-react';

export interface ApiStatusIndicatorProps {
  compact?: boolean;
  showValidateButton?: boolean;
}

interface ApiProviderStatus {
  type: ApiKeyType;
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  responseTime?: number;
  lastChecked?: string;
  isConfigured: boolean;
}

export const ApiStatusIndicator = ({ 
  compact = false, 
  showValidateButton = true 
}: ApiStatusIndicatorProps) => {
  const [providers, setProviders] = useState<ApiProviderStatus[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date>(new Date());
  
  const { isConnected: realtimeConnected, subscribe, unsubscribe } = useRealtimeApiKeys();

  const providerConfig: Record<ApiKeyType, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    gemini: 'Gemini',
    serpapi: 'SerpAPI',
    perplexity: 'Perplexity',
    groq: 'Groq',
    mistral: 'Mistral',
    cohere: 'Cohere',
    huggingface: 'Hugging Face',
    newsapi: 'NewsAPI',
    alphavantage: 'Alpha Vantage',
    bing: 'Bing',
    azure: 'Azure'
  };

  useEffect(() => {
    loadProviderStatuses();
    
    // Subscribe to real-time updates
    subscribe((apiKey) => {
      updateProviderStatus(apiKey.provider as ApiKeyType, {
        status: apiKey.is_active ? 'operational' : 'down',
        isConfigured: true,
        lastChecked: new Date().toISOString()
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  const loadProviderStatuses = async () => {
    const availableProviders = await competitorAnalysisService.getAvailableProvidersTyped();
    const validationResults = await competitorAnalysisService.validateAllProviders();

    const statusList: ApiProviderStatus[] = Object.entries(providerConfig).map(([type, name]) => ({
      type: type as ApiKeyType,
      name,
      status: getStatusFromValidation(type as ApiKeyType, availableProviders, validationResults),
      isConfigured: availableProviders.includes(type as ApiKeyType),
      lastChecked: new Date().toISOString()
    }));

    setProviders(statusList);
  };

  const getStatusFromValidation = (
    type: ApiKeyType, 
    available: ApiKeyType[], 
    validation: Map<ApiKeyType, boolean>
  ): 'operational' | 'degraded' | 'down' | 'unknown' => {
    if (!available.includes(type)) return 'unknown';
    const isValid = validation.get(type);
    return isValid ? 'operational' : 'down';
  };

  const updateProviderStatus = (type: ApiKeyType, updates: Partial<ApiProviderStatus>) => {
    setProviders(prev => prev.map(provider => 
      provider.type === type ? { ...provider, ...updates } : provider
    ));
  };

  const validateAllProviders = async () => {
    setIsValidating(true);
    try {
      const validationResults = await competitorAnalysisService.validateAllProviders();
      
      setProviders(prev => prev.map(provider => ({
        ...provider,
        status: getStatusFromValidation(provider.type, 
          prev.filter(p => p.isConfigured).map(p => p.type), 
          validationResults
        ),
        lastChecked: new Date().toISOString()
      })));
      
      setLastValidated(new Date());
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, isConfigured: boolean) => {
    if (!isConfigured) {
      return <Badge variant="outline">Not Configured</Badge>;
    }

    const variants = {
      operational: 'default',
      degraded: 'secondary',
      down: 'destructive',
      unknown: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <div className="flex items-center gap-2">
              {realtimeConnected && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Real-time updates active</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={validateAllProviders}
                disabled={isValidating}
              >
                <RefreshCw className={`h-3 w-3 ${isValidating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {providers.map((provider) => (
              <TooltipProvider key={provider.type}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(provider.status)}
                      <span className="text-xs">{provider.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">{provider.name}</p>
                      <p>Status: {provider.status}</p>
                      {provider.lastChecked && (
                        <p>Last checked: {new Date(provider.lastChecked).toLocaleTimeString()}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Provider Status
          </CardTitle>
          <div className="flex items-center gap-2">
            {realtimeConnected && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Live
              </Badge>
            )}
            {showValidateButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={validateAllProviders}
                disabled={isValidating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                {isValidating ? 'Validating...' : 'Validate All'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {providers.map((provider) => (
            <div key={provider.type} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(provider.status)}
                <div>
                  <p className="font-medium">{provider.name}</p>
                  {provider.lastChecked && (
                    <p className="text-xs text-muted-foreground">
                      Last checked: {new Date(provider.lastChecked).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {provider.responseTime && (
                  <span className="text-xs text-muted-foreground">
                    {provider.responseTime}ms
                  </span>
                )}
                {getStatusBadge(provider.status, provider.isConfigured)}
              </div>
            </div>
          ))}
        </div>
        
        {providers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No API providers configured</p>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Last validation: {lastValidated.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};