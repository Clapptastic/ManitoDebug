/**
 * SINGLE SOURCE OF TRUTH: Unified API Key Manager Component
 * Consolidates all API key management functionality
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Key, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Zap,
  Wifi,
  WifiOff,
  Trash2,
  Plus
} from 'lucide-react';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { ApiKeyType } from '@/types/api-keys/unified';
import { toast } from '@/hooks/use-toast';

const API_PROVIDERS = [
  { 
    id: 'openai' as ApiKeyType, 
    name: 'OpenAI', 
    description: 'GPT models for analysis',
    placeholder: 'sk-... or sk-proj-...',
    pattern: /^sk-(proj-)?[A-Za-z0-9_-]{20,}$/,
    color: 'hsl(var(--chart-1))',
    bgColor: 'hsl(var(--chart-1) / 0.1)',
    icon: '🤖'
  },
  { 
    id: 'anthropic' as ApiKeyType, 
    name: 'Anthropic', 
    description: 'Claude models for analysis',
    placeholder: 'sk-ant-...',
    pattern: /^sk-ant-[A-Za-z0-9_-]{80,140}$/,
    color: 'hsl(var(--chart-2))',
    bgColor: 'hsl(var(--chart-2) / 0.1)',
    icon: '🧠'
  },
  { 
    id: 'gemini' as ApiKeyType, 
    name: 'Google Gemini', 
    description: 'Google AI models',
    placeholder: 'AIza...',
    pattern: /^AIza[0-9A-Za-z-_]{30,}$/,
    color: 'hsl(var(--chart-3))',
    bgColor: 'hsl(var(--chart-3) / 0.1)',
    icon: '💎'
  },
  { 
    id: 'perplexity' as ApiKeyType, 
    name: 'Perplexity', 
    description: 'Real-time web search',
    placeholder: 'pplx-...',
    pattern: /^pplx-[A-Za-z0-9]{32,}$/,
    color: 'hsl(var(--chart-5))',
    bgColor: 'hsl(var(--chart-5) / 0.1)',
    icon: '🌐'
  },
  { 
    id: 'groq' as ApiKeyType, 
    name: 'Groq', 
    description: 'Ultra-fast AI inference',
    placeholder: 'gsk_...',
    pattern: /^gsk_[A-Za-z0-9]{20,}$/,
    color: 'hsl(var(--primary))',
    bgColor: 'hsl(var(--primary) / 0.1)',
    icon: '⚡'
  }
];

export const UnifiedApiKeyManager: React.FC = () => {
  const {
    apiKeys,
    isLoading,
    error,
    saveApiKey,
    deleteApiKey,
    validateApiKey,
    refreshApiKeys,
    getApiKeyByProvider,
    hasApiKey
  } = useUnifiedApiKeys();

  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [newApiKeys, setNewApiKeys] = useState<{ [key: string]: string }>({});
  const [isAddingKey, setIsAddingKey] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const [validationProgress, setValidationProgress] = useState(0);

  const validateApiKeyFormat = (apiKey: string, provider: ApiKeyType): { isValid: boolean; error?: string } => {
    if (!apiKey || apiKey.trim().length === 0) {
      return { isValid: false, error: 'API key cannot be empty' };
    }

    const providerConfig = API_PROVIDERS.find(p => p.id === provider);
    if (!providerConfig) {
      return { isValid: false, error: 'Unknown provider' };
    }

    if (!providerConfig.pattern.test(apiKey)) {
      return { isValid: false, error: `Invalid ${providerConfig.name} API key format` };
    }
    
    return { isValid: true };
  };

  const handleSaveApiKey = async (provider: ApiKeyType, apiKey: string) => {
    if (!apiKey.trim()) {
      return;
    }

    // Validate format before sending
    const validation = validateApiKeyFormat(apiKey.trim(), provider);
    
    if (!validation.isValid) {
      toast({
        title: `Invalid ${API_PROVIDERS.find(p => p.id === provider)?.name} API Key`,
        description: `${validation.error}. Please check the format and try again.`,
        variant: 'destructive',
      });
      return;
    }

    setIsAddingKey(provider);
    setValidationProgress(0);

    try {
      console.log('🔍 UnifiedApiKeyManager: Starting save process for provider:', provider);
      setValidationProgress(30);
      console.log('🔍 UnifiedApiKeyManager: Calling saveApiKey service...');
      await saveApiKey(provider, apiKey.trim());
      console.log('🔍 UnifiedApiKeyManager: Save successful!');
      setValidationProgress(100);
      
      // Clear the input on success
      setNewApiKeys(prev => ({ ...prev, [provider]: '' }));
    } catch (error) {
      console.error('Error saving API key:', error);
      setValidationProgress(0);
    } finally {
      setIsAddingKey(null);
      setTimeout(() => setValidationProgress(0), 500);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await deleteApiKey(id);
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const handleValidateApiKey = async (provider: ApiKeyType) => {
    setIsValidating(provider);
    try {
      const key = getApiKeyByProvider(provider);
      if (key) {
        await validateApiKey(provider);
      }
    } catch (error) {
      console.error('Error validating API key:', error);
    } finally {
      setIsValidating(null);
    }
  };

  const getStatusIcon = (provider: ApiKeyType) => {
    const key = getApiKeyByProvider(provider);
    
    if (!key) {
      return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
    
    if (key.status === 'active') {
      return <Wifi className="h-4 w-4 text-emerald-500" />;
    }
    
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = (provider: ApiKeyType) => {
    const key = getApiKeyByProvider(provider);
    
    if (!key) {
      return <Badge variant="outline" className="bg-muted/50">Not Set</Badge>;
    }
    
    if (key.status === 'active') {
      return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-200">Active</Badge>;
    }
    
    return <Badge variant="destructive" className="bg-red-500/20 text-red-700 border-red-200">Offline</Badge>;
  };

  const workingProvidersCount = apiKeys.filter(key => key.is_active && key.status === 'active').length;
  const totalProvidersCount = API_PROVIDERS.length;

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
            <Badge variant="outline">
              {workingProvidersCount}/{totalProvidersCount} Active
            </Badge>
          </CardTitle>
          <CardDescription>
            Secure API key management with real-time validation and vault encryption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={(workingProvidersCount / totalProvidersCount) * 100} className="h-2" />
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={refreshApiKeys}
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

            {/* Active Providers Summary */}
            {workingProvidersCount > 0 && (
              <div className="p-3 rounded-md bg-background/80 border">
                <p className="text-sm font-medium mb-2">Active Providers:</p>
                <div className="flex flex-wrap gap-2">
                  {apiKeys
                    .filter(key => key.is_active && key.status === 'active')
                    .map(key => (
                      <Badge key={key.id} className="bg-emerald-500/20 text-emerald-700 border-emerald-200">
                        {API_PROVIDERS.find(p => p.id === key.provider)?.name || key.provider}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Keys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {API_PROVIDERS.map((provider) => {
          const existingKey = getApiKeyByProvider(provider.id);
          const isCurrentlyValidating = isValidating === provider.id;
          const isCurrentlyAdding = isAddingKey === provider.id;

          return (
            <Card 
              key={provider.id} 
              className="group relative transition-all duration-300 hover:shadow-lg border-0"
              style={{ 
                borderLeft: `4px solid ${provider.color}`,
                backgroundColor: existingKey?.status === 'active' ? provider.bgColor : 'hsl(var(--card))'
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{provider.icon}</span>
                      {getStatusIcon(provider.id)}
                    </div>
                    <div>
                      <h4 className="font-medium">{provider.name}</h4>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(provider.id)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {existingKey ? (
                  <>
                    {/* Existing key info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/30">
                        <Key className="h-4 w-4" />
                        <span className="font-mono text-xs">{existingKey.masked_key}</span>
                      </div>
                      
                      {existingKey.updated_at && (
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(existingKey.updated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleValidateApiKey(provider.id)}
                        disabled={isCurrentlyValidating}
                        className="flex-1"
                      >
                        {isCurrentlyValidating ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Validate
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteApiKey(existingKey.id)}
                        disabled={isLoading}
                        className="px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Add new key */}
                    <div className="space-y-3">
                      <Label htmlFor={`api-key-${provider.id}`}>
                        {provider.name} API Key
                      </Label>
                      <div className="relative">
                        <Input
                          id={`api-key-${provider.id}`}
                          type={showApiKey[provider.id] ? 'text' : 'password'}
                          placeholder={provider.placeholder}
                          value={newApiKeys[provider.id] || ''}
                          onChange={(e) => setNewApiKeys(prev => ({ 
                            ...prev, 
                            [provider.id]: e.target.value 
                          }))}
                          disabled={isCurrentlyAdding}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() => setShowApiKey(prev => ({ 
                            ...prev, 
                            [provider.id]: !prev[provider.id] 
                          }))}
                        >
                          {showApiKey[provider.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {isCurrentlyAdding && validationProgress > 0 && (
                        <Progress value={validationProgress} className="h-2" />
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleSaveApiKey(provider.id, newApiKeys[provider.id] || '')}
                      disabled={
                        isCurrentlyAdding || 
                        !newApiKeys[provider.id]?.trim()
                      }
                      className="w-full"
                    >
                      {isCurrentlyAdding ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add API Key
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
