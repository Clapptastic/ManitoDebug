import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Info, CheckCircle2, AlertTriangle, XCircle, Plus, Settings, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ApiKeyRequirementsProps {
  workingApis: string[];
  allStatuses: Record<string, any>;
  className?: string;
}

const PROVIDER_CONFIG = {
  // Primary AI Analysis Providers
  openai: { 
    name: 'OpenAI GPT', 
    purpose: 'Advanced AI analysis and strategic insights',
    category: 'ai',
    priority: 'essential'
  },
  anthropic: { 
    name: 'Anthropic Claude', 
    purpose: 'Deep competitive strategy and reasoning',
    category: 'ai', 
    priority: 'essential'
  },
  gemini: { 
    name: 'Google Gemini', 
    purpose: 'Multimodal analysis and data processing',
    category: 'ai',
    priority: 'recommended'
  },
  cohere: { 
    name: 'Cohere', 
    purpose: 'Text analysis and sentiment processing',
    category: 'ai',
    priority: 'optional'
  },
  mistral: { 
    name: 'Mistral AI', 
    purpose: 'European focus and multilingual analysis',
    category: 'ai',
    priority: 'optional'
  },
  groq: { 
    name: 'Groq', 
    purpose: 'High-speed AI inference processing',
    category: 'ai',
    priority: 'optional'
  },
  huggingface: { 
    name: 'Hugging Face', 
    purpose: 'Specialized models and custom analysis',
    category: 'ai',
    priority: 'optional'
  },
  
  // Research & Data Providers
  perplexity: { 
    name: 'Perplexity', 
    purpose: 'Real-time research and fact verification',
    category: 'research',
    priority: 'recommended'
  },
  newsapi: { 
    name: 'NewsAPI', 
    purpose: 'Press coverage and media monitoring',
    category: 'research',
    priority: 'recommended'
  },
  serpapi: { 
    name: 'SerpAPI', 
    purpose: 'Search rankings and web presence',
    category: 'research',
    priority: 'recommended'
  },
  alphavantage: { 
    name: 'Alpha Vantage', 
    purpose: 'Financial metrics and market data',
    category: 'data',
    priority: 'optional'
  },
  google: { 
    name: 'Google APIs', 
    purpose: 'Additional search and analysis',
    category: 'research',
    priority: 'optional'
  }
} as const;

type ProviderKey = keyof typeof PROVIDER_CONFIG;
type ProviderStatus = 'working' | 'error' | 'missing';
type ProviderPriority = 'essential' | 'recommended' | 'optional';

export const ApiKeyRequirements: React.FC<ApiKeyRequirementsProps> = ({
  workingApis,
  allStatuses,
  className = ""
}) => {
  const navigate = useNavigate();
  
  const providerAnalysis = useMemo(() => {
    const providers = Object.keys(PROVIDER_CONFIG) as ProviderKey[];
    const workingProviders = providers.filter(provider => workingApis.includes(provider));
    const essentialProviders = providers.filter(p => PROVIDER_CONFIG[p].priority === 'essential');
    const workingEssential = essentialProviders.filter(p => workingProviders.includes(p));
    
    const categories = {
      ai: providers.filter(p => PROVIDER_CONFIG[p].category === 'ai'),
      research: providers.filter(p => PROVIDER_CONFIG[p].category === 'research'),
      data: providers.filter(p => PROVIDER_CONFIG[p].category === 'data')
    };
    
    const progress = Math.round((workingProviders.length / providers.length) * 100);
    const essentialProgress = Math.round((workingEssential.length / essentialProviders.length) * 100);
    
    return {
      total: providers.length,
      working: workingProviders.length,
      essential: essentialProviders.length,
      workingEssential: workingEssential.length,
      progress,
      essentialProgress,
      categories,
      hasMinimumSetup: workingEssential.length > 0,
      isFullyConfigured: workingProviders.length === providers.length
    };
  }, [workingApis]);

  const getProviderStatus = (provider: ProviderKey): ProviderStatus => {
    if (workingApis.includes(provider)) return 'working';
    
    const status = allStatuses[provider];
    if (status?.exists || status?.configured) return 'error';
    
    return 'missing';
  };

  const getStatusColor = (status: ProviderStatus) => {
    switch (status) {
      case 'working': return 'text-emerald-600';
      case 'error': return 'text-destructive';
      case 'missing': return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: ProviderStatus) => {
    switch (status) {
      case 'working': return CheckCircle2;
      case 'error': return XCircle;
      case 'missing': return Plus;
    }
  };

  const getPriorityColor = (priority: ProviderPriority) => {
    switch (priority) {
      case 'essential': return 'border-l-emerald-500';
      case 'recommended': return 'border-l-blue-500';
      case 'optional': return 'border-l-muted-foreground/30';
    }
  };

  const StatusOverview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-semibold">Setup Progress</h4>
          <p className="text-sm text-muted-foreground">
            {providerAnalysis.working}/{providerAnalysis.total} providers configured
          </p>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2">
            {providerAnalysis.hasMinimumSetup ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
            <span className="text-sm font-medium">
              {providerAnalysis.hasMinimumSetup ? '✅ Ready for Analysis' : '⚠️ Setup Required'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {providerAnalysis.workingEssential}/{providerAnalysis.essential} essential
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress value={providerAnalysis.progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall: {providerAnalysis.progress}%</span>
          <span>Essential: {providerAnalysis.essentialProgress}%</span>
        </div>
      </div>
    </div>
  );

  const ProviderCategory = ({ title, providers, icon: Icon }: { 
    title: string; 
    providers: ProviderKey[]; 
    icon: React.ComponentType<{ className?: string }> 
  }) => {
    const workingInCategory = providers.filter(p => workingApis.includes(p)).length;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h5 className="font-medium text-sm">{title}</h5>
          </div>
          <Badge variant="outline" className="text-xs">
            {workingInCategory}/{providers.length}
          </Badge>
        </div>
        
        <div className="grid gap-2">
          {providers.map(provider => {
            const config = PROVIDER_CONFIG[provider];
            const status = getProviderStatus(provider);
            const StatusIcon = getStatusIcon(status);
            
            return (
              <div 
                key={provider} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border-l-2 bg-card/50",
                  getPriorityColor(config.priority)
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{config.name}</span>
                    <StatusIcon className={cn("h-3.5 w-3.5", getStatusColor(status))} />
                    <Badge 
                      variant={config.priority === 'essential' ? 'default' : 'outline'} 
                      className="text-xs"
                    >
                      {config.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {config.purpose}
                  </p>
                </div>
                
                {status !== 'working' && (
                  <Button
                    size="sm"
                    variant={status === 'error' ? 'destructive' : 'outline'}
                    onClick={() => navigate('/api-keys')}
                    className="h-7 text-xs ml-2 flex-shrink-0"
                  >
                    {status === 'error' ? 'Fix' : 'Add'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          API Configuration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <StatusOverview />
        
        <Separator />
        
        <ProviderCategory 
          title="AI Analysis" 
          providers={providerAnalysis.categories.ai}
          icon={Zap}
        />
        
        <ProviderCategory 
          title="Research & Intelligence" 
          providers={providerAnalysis.categories.research}
          icon={Info}
        />
        
        <ProviderCategory 
          title="Market Data" 
          providers={providerAnalysis.categories.data}
          icon={Settings}
        />
        
        {!providerAnalysis.hasMinimumSetup && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Add at least one essential AI provider (OpenAI or Anthropic) to unlock competitor analysis features
                </p>
              </div>
              <Button
                onClick={() => navigate('/api-keys')}
                className="w-full"
                size="lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Set Up API Keys
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};