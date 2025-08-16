import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2, Clock, Zap, DollarSign } from 'lucide-react';
import type { ProviderTest } from '../ModernFlowMonitor';

interface ProviderTestPanelProps {
  providers: ProviderTest[];
  onUpdateProvider: (providerName: string, status: ProviderTest['status'], data?: Partial<ProviderTest>) => void;
}

const getProviderIcon = (name: string) => {
  if (name.includes('OpenAI')) return '🤖';
  if (name.includes('Anthropic')) return '🧠';
  if (name.includes('Perplexity')) return '🔍';
  return '⚡';
};

const getStatusColor = (status: ProviderTest['status']) => {
  switch (status) {
    case 'success': return 'text-success';
    case 'error': return 'text-destructive';
    case 'running': return 'text-primary';
    default: return 'text-muted-foreground';
  }
};

export const ProviderTestPanel: React.FC<ProviderTestPanelProps> = ({ 
  providers, 
  onUpdateProvider 
}) => {
  const successCount = providers.filter(p => p.status === 'success').length;
  const totalCost = providers.reduce((sum, p) => sum + (p.cost || 0), 0);
  const totalTokens = providers.reduce((sum, p) => sum + (p.tokens || 0), 0);

  return (
    <div className="space-y-6">
      {/* Provider Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round((successCount / providers.length) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Cost</p>
                <p className="text-2xl font-bold text-success">
                  ${totalCost.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <CheckCircle className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Tokens</p>
                <p className="text-2xl font-bold text-secondary-foreground">
                  {totalTokens.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Details */}
      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.name} className={`transition-all duration-200 ${
            provider.status === 'running' ? 'ring-2 ring-primary/20 bg-primary/5' :
            provider.status === 'success' ? 'border-success/30' :
            provider.status === 'error' ? 'border-destructive/30' :
            ''
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getProviderIcon(provider.name)}</span>
                  <span>{provider.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {provider.status === 'running' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {provider.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                  {provider.status === 'error' && (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  {provider.status === 'idle' && (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Badge 
                    variant={
                      provider.status === 'success' ? 'success' :
                      provider.status === 'error' ? 'destructive' :
                      provider.status === 'running' ? 'default' :
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
              {/* Progress Bar for Running Tests */}
              {provider.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing request...</span>
                    <span className="text-primary">⏱️</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              )}

              {/* Success Metrics */}
              {provider.status === 'success' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Tokens Used</p>
                    <p className="font-medium text-foreground">
                      {provider.tokens?.toLocaleString() || '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Cost</p>
                    <p className="font-medium text-success">
                      ${provider.cost?.toFixed(4) || '—'}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {provider.status === 'error' && provider.error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-1">Error Details:</p>
                  <p className="text-sm text-destructive/80">{provider.error}</p>
                </div>
              )}

              {/* Response Preview */}
              {provider.response && (
                <div className="p-3 rounded-md bg-muted/50 border">
                  <p className="text-sm font-medium text-foreground mb-2">Response Preview:</p>
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {typeof provider.response === 'object' 
                      ? JSON.stringify(provider.response, null, 2).slice(0, 200) + '...'
                      : String(provider.response).slice(0, 200) + '...'
                    }
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};