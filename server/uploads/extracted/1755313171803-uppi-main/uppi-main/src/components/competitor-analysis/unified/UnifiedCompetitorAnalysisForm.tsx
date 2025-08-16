/**
 * UNIFIED Competitor Analysis Form
 * Stage 4: Frontend Consolidation - Single form component
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Play, Loader2, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { unifiedApiKeyService } from '@/services/api-keys/unifiedApiKeyService';
import { ApiKey } from '@/types/api-keys/unified';

interface UnifiedCompetitorAnalysisFormProps {
  onAnalyze: (competitors: string[], providers?: string[]) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export const UnifiedCompetitorAnalysisForm: React.FC<UnifiedCompetitorAnalysisFormProps> = ({
  onAnalyze,
  loading = false,
  disabled = false
}) => {
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Load API keys on mount
  useEffect(() => {
    const loadApiKeys = async () => {
      if (!isAuthenticated) {
        setApiKeysLoading(false);
        return;
      }

      try {
        setApiKeysLoading(true);
        const keys = await unifiedApiKeyService.getAllApiKeys();
        setApiKeys(keys.filter(key => key.is_active && key.status === 'active'));
      } catch (error) {
        console.error('Failed to load API keys:', error);
        setApiKeys([]);
      } finally {
        setApiKeysLoading(false);
      }
    };

    loadApiKeys();
  }, [isAuthenticated]);

  const addCompetitor = () => {
    setCompetitors([...competitors, '']);
  };

  const removeCompetitor = (index: number) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter((_, i) => i !== index));
    }
  };

  const updateCompetitor = (index: number, value: string) => {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validCompetitors = competitors.filter(c => c.trim());
    
    if (validCompetitors.length === 0) {
      return;
    }

    await onAnalyze(validCompetitors, selectedProviders);
  };

  const handleProviderToggle = (provider: string, enabled: boolean) => {
    if (enabled) {
      setSelectedProviders(prev => [...prev, provider]);
    } else {
      setSelectedProviders(prev => prev.filter(p => p !== provider));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Competitor Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Competitors Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Competitors to Analyze</Label>
            {competitors.map((competitor, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={competitor}
                  onChange={(e) => updateCompetitor(index, e.target.value)}
                  placeholder="Enter competitor name (e.g., Apple, Microsoft)"
                  disabled={loading || disabled}
                  className="flex-1"
                />
                {competitors.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeCompetitor(index)}
                    disabled={loading || disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addCompetitor}
              disabled={loading || disabled || competitors.length >= 5}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Competitor {competitors.length >= 5 && '(Max 5)'}
            </Button>
          </div>

          <Separator />

          {/* API Providers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">AI Providers</Label>
              <Badge variant="secondary" className="text-xs">
                {selectedProviders.length} selected
              </Badge>
            </div>
            
            {apiKeysLoading ? (
              <div className="flex items-center justify-center p-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading API keys...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center p-6 border border-dashed rounded-lg bg-muted/30">
                <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3 font-medium">
                  🔑 API Keys Required
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Connect at least one AI provider to enable competitor analysis
                </p>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/settings/api-keys')}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Add API Keys
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {apiKeys.map((apiKey) => (
                  <Button
                    key={apiKey.id}
                    type="button"
                    variant={selectedProviders.includes(apiKey.provider) ? 'default' : 'outline'}
                    onClick={() => handleProviderToggle(apiKey.provider, !selectedProviders.includes(apiKey.provider))}
                    disabled={loading || disabled}
                    className="justify-start gap-2 h-auto p-3"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex flex-col items-start">
                      <span className="capitalize font-medium">{apiKey.provider}</span>
                      <span className="text-xs text-muted-foreground">
                        {apiKey.masked_key} • Validated
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              loading || 
              disabled || 
              competitors.filter(c => c.trim()).length === 0 ||
              selectedProviders.length === 0
            }
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Analysis
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};