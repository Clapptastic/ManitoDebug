import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X, Play, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ApiToggleItem from '@/components/api-keys/ApiToggleItem';
import { unifiedApiKeyService, type ApiKeyStatus } from '@/services/api-keys/unifiedApiKeyService';
import { supabase } from '@/integrations/supabase/client';

interface CompetitorInputProps {
  onAnalyze?: (competitors: string[]) => void;
  onStartAnalysis?: (competitors: string[], focusAreas: string[], providersSelected?: string[]) => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  isAnalyzing?: boolean;
}

export const CompetitorInput: React.FC<CompetitorInputProps> = ({
  onAnalyze,
  onStartAnalysis,
  disabled = false,
  isLoading = false,
  isAnalyzing = false
}) => {
  const [newCompetitor, setNewCompetitor] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState('');
  const [providerSelections, setProviderSelections] = useState<Record<string, boolean>>({
    openai: true,
    anthropic: false,
    perplexity: false,
    gemini: false,
    groq: false,
    cohere: false,
    mistral: false,
    serpapi: false,
    newsapi: false,
    alphavantage: false,
  });
  const [providerStatuses, setProviderStatuses] = useState<Record<string, ApiKeyStatus>>({});

  const [userId, setUserId] = useState<string | null>(null);

  // Load saved provider selections for this user (default to previous state)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id ?? null;
        if (!mounted) return;
        setUserId(uid);
        const key = uid ? `providerSelections:${uid}` : 'providerSelections:anon';
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              setProviderSelections(prev => ({ ...prev, ...parsed }));
            }
          } catch {}
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Persist selections whenever they change (scoped per user)
  useEffect(() => {
    try {
      const key = userId ? `providerSelections:${userId}` : 'providerSelections:anon';
      localStorage.setItem(key, JSON.stringify(providerSelections));
    } catch {}
  }, [providerSelections, userId]);

  // Load provider statuses (non-blocking)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const statuses = await unifiedApiKeyService.getAllProviderStatuses();
        // Fetch additional providers not included by default
        const extra: Record<string, ApiKeyStatus> = {} as any;
        try { extra['groq'] = await unifiedApiKeyService.getProviderStatus('groq' as any); } catch {}
        try { extra['cohere'] = await unifiedApiKeyService.getProviderStatus('cohere' as any); } catch {}
        if (mounted) setProviderStatuses({ ...statuses, ...extra });
      } catch (e) {
        // Non-blocking
      }
    })();
    return () => { mounted = false; };
  }, []);

  const addCompetitor = () => {
    const trimmed = newCompetitor.trim();
    if (!trimmed) return;

    if (competitors.includes(trimmed)) {
      toast({
        title: 'Duplicate Competitor',
        description: 'This competitor is already in your list',
        variant: 'destructive'
      });
      return;
    }

    if (competitors.length >= 5) {
      toast({
        title: 'Maximum Reached',
        description: 'You can analyze up to 5 competitors at once',
        variant: 'destructive'
      });
      return;
    }

    setCompetitors(prev => [...prev, trimmed]);
    setNewCompetitor('');
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = async () => {
    if (competitors.length === 0) {
      toast({
        title: 'No Competitors',
        description: 'Please add at least one competitor to analyze',
        variant: 'destructive'
      });
      return;
    }

    const areas = focusAreas
      .split(',')
      .map(area => area.trim())
      .filter(area => area.length > 0);

    // Support both onAnalyze and onStartAnalysis for compatibility
    const providersSelected = Object.entries(providerSelections)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    if (onAnalyze) {
      onAnalyze(competitors);
    } else if (onStartAnalysis) {
      await onStartAnalysis(competitors, areas, providersSelected);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCompetitor();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Start New Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Competitor Input */}
        <div className="space-y-3">
          <Label htmlFor="competitor-input">Add Competitors</Label>
          <div className="flex gap-2">
            <Input
              id="competitor-input"
              placeholder="Enter competitor name (e.g., Apple, Google, Microsoft)"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled || isAnalyzing || isLoading}
              className="flex-1"
            />
            <Button
              onClick={addCompetitor}
              disabled={!newCompetitor.trim() || competitors.length >= 5 || disabled || isAnalyzing || isLoading}
              size="default"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Competitor List */}
          {competitors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {competitors.map((competitor, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-3"
                >
                  {competitor}
                  <button
                    onClick={() => removeCompetitor(index)}
                    disabled={disabled || isAnalyzing || isLoading}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            {competitors.length}/5 competitors added
          </p>
        </div>

        {/* Focus Areas */}
        <div className="space-y-3">
          <Label htmlFor="focus-areas">Focus Areas (Optional)</Label>
          <Textarea
            id="focus-areas"
            placeholder="Enter specific areas to focus on, separated by commas (e.g., pricing strategy, market share, technology stack)"
            value={focusAreas}
            onChange={(e) => setFocusAreas(e.target.value)}
            disabled={disabled || isAnalyzing || isLoading}
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            Specify particular aspects you want the analysis to emphasize
          </p>
        </div>

        {/* Provider Selection */}
        <div className="space-y-3">
          <Label>AI Providers</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['openai','anthropic','perplexity','gemini','groq','cohere'].map((provider) => {
              const status = providerStatuses[provider];
              const hasKey = Boolean(status?.exists && (status?.isActive ?? true));
              return (
                <ApiToggleItem
                  key={provider}
                  provider={provider}
                  checked={!!providerSelections[provider]}
                  onChange={(checked) => setProviderSelections(prev => ({ ...prev, [provider]: checked }))}
                  hasKey={hasKey}
                  status={status as any}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Only toggled providers with configured keys will be used. OpenAI is enabled by default.</p>
        </div>

        {/* Start Analysis Button */}
        <Button
          onClick={handleStartAnalysis}
          disabled={competitors.length === 0 || disabled || isAnalyzing || isLoading}
          className="w-full"
          size="lg"
        >
          <Play className="h-4 w-4 mr-2" />
          {(isAnalyzing || isLoading) ? 'Analyzing...' : `Analyze ${competitors.length} Competitor${competitors.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
};