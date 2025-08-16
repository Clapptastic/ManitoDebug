import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Zap } from 'lucide-react';
import type { GateProviderStatus } from '@/hooks/useCompetitorGate';

interface ProviderHealthBadgeProps {
  providers: GateProviderStatus | null | undefined;
  className?: string;
}

export const ProviderHealthBadge: React.FC<ProviderHealthBadgeProps> = ({ providers, className }) => {
  if (!providers) return null;
  // Prefer common providers, then include any others returned by the gate (dynamic)
  const defaultOrder = ['openai', 'anthropic', 'perplexity', 'gemini', 'serpapi', 'mistral', 'cohere'];
  const order = [
    ...defaultOrder.filter((k) => Object.prototype.hasOwnProperty.call(providers, k)),
    ...Object.keys(providers).filter((k) => !defaultOrder.includes(k))
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      {order.map((key) => {
        const p = providers[key];
        const active = !!p?.active;
        return (
          <Badge key={key} variant={active ? 'secondary' : 'outline'} className="flex items-center gap-1">
            {active ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className="capitalize">{key}</span>
          </Badge>
        );
      })}
      <Badge variant="outline" className="flex items-center gap-1">
        <Zap className="h-3.5 w-3.5" />
        {Object.values(providers).filter((p) => p?.active).length}/{Object.keys(providers).length} active
      </Badge>
    </div>
  );
};
