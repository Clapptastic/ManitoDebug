import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Brain, Zap, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ChatSettings {
  id?: string;
  ai_provider: string;
  ai_model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}

const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: [
      { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1 (2025-04-14) - Flagship', description: 'Most capable model' },
      { value: 'o3-2025-04-16', label: 'O3 (2025-04-16) - Reasoning', description: 'Powerful reasoning model' },
      { value: 'o4-mini-2025-04-16', label: 'O4 Mini (2025-04-16) - Fast', description: 'Fast reasoning model' },
      { value: 'gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini (2025-04-14)', description: 'Smaller model with vision' },
      { value: 'gpt-4o', label: 'GPT-4o', description: 'Older powerful model with vision' }
    ]
  },
  anthropic: {
    name: 'Anthropic',
    models: [
      { value: 'claude-opus-4-20250514', label: 'Claude Opus 4', description: 'Most capable and intelligent' },
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'High-performance with efficiency' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', description: 'Fastest model' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'Previous intelligent model' }
    ]
  },
  perplexity: {
    name: 'Perplexity',
    models: [
      { value: 'llama-3.1-sonar-huge-128k-online', label: 'Sonar Huge (405B)', description: 'Most capable online model' },
      { value: 'llama-3.1-sonar-large-128k-online', label: 'Sonar Large (70B)', description: 'Large online model' },
      { value: 'llama-3.1-sonar-small-128k-online', label: 'Sonar Small (8B)', description: 'Fast online model' }
    ]
  }
};

const DEFAULT_SETTINGS: ChatSettings = {
  ai_provider: 'openai',
  ai_model: 'gpt-4.1-2025-04-14',
  temperature: 0.7,
  max_tokens: 1000,
  system_prompt: 'You are a helpful AI business advisor with access to the user\'s business data. Provide personalized strategic advice based on their competitive analyses, documents, and business context.'
};

export const ChatSettings: React.FC = () => {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { hasApiKey } = useUnifiedApiKeys();

  // Check if user has required API keys
  const getAvailableProviders = () => {
    return Object.keys(AI_PROVIDERS).filter(provider => 
      hasApiKey(provider as any)
    );
  };

  const availableProviders = getAvailableProviders();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading chat settings:', error);
      toast({
        title: 'Error Loading Settings',
        description: 'Failed to load your chat preferences. Using defaults.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('chat_settings')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          ...settings
        });

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'Your chat preferences have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving chat settings:', error);
      toast({
        title: 'Error Saving Settings',
        description: 'Failed to save your chat preferences. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    const defaultModel = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS]?.models[0]?.value;
    setSettings(prev => ({
      ...prev,
      ai_provider: provider,
      ai_model: defaultModel || prev.ai_model
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading chat settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Key Alert */}
      {availableProviders.length === 0 && (
        <Alert>
          <AlertTitle>API Keys Required</AlertTitle>
          <AlertDescription>
            Configure your AI provider API keys to enable chat functionality.
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('/api-keys', '_blank')}
              className="ml-2"
            >
              Setup Keys
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Chat Settings
          </CardTitle>
          <CardDescription>
            Configure your AI provider, model, and behavior preferences for the chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="ai-provider">AI Provider</Label>
            <Select
              value={settings.ai_provider}
              onValueChange={handleProviderChange}
              disabled={availableProviders.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                  <SelectItem 
                    key={key} 
                    value={key}
                    disabled={!hasApiKey(key as any)}
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      {provider.name}
                      {!hasApiKey(key as any) && (
                        <span className="text-xs text-muted-foreground">(API key required)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="ai-model">AI Model</Label>
            <Select
              value={settings.ai_model}
              onValueChange={(value) => setSettings(prev => ({ ...prev, ai_model: value }))}
              disabled={!settings.ai_provider || !hasApiKey(settings.ai_provider as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS[settings.ai_provider as keyof typeof AI_PROVIDERS]?.models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{model.label}</div>
                      <div className="text-xs text-muted-foreground">{model.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground">{settings.temperature}</span>
            </div>
            <Slider
              value={[settings.temperature]}
              onValueChange={([value]) => setSettings(prev => ({ ...prev, temperature: value }))}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Lower values make responses more focused and deterministic. Higher values make them more creative.
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              type="number"
              value={settings.max_tokens}
              onChange={(e) => setSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 1000 }))}
              min={100}
              max={4000}
              step={100}
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of tokens in the AI response (100-4000)
            </p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              value={settings.system_prompt}
              onChange={(e) => setSettings(prev => ({ ...prev, system_prompt: e.target.value }))}
              placeholder="Define how the AI should behave and respond..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This message sets the AI's behavior and personality for your conversations.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={saveSettings} 
              disabled={isSaving || availableProviders.length === 0}
              className="flex-1"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              disabled={isSaving}
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatSettings;