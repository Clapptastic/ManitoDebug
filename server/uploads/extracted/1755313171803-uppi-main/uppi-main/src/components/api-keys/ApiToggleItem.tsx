
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ApiProviderStatusInfo } from '@/types/api-keys/unified';

interface ApiToggleItemProps {
  provider: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hasKey: boolean;
  status?: ApiProviderStatusInfo;
  disabled?: boolean;
}

const ApiToggleItem: React.FC<ApiToggleItemProps> = ({ 
  provider, 
  checked, 
  onChange, 
  hasKey,
  status,
  disabled = false
}) => {
  // Get formatted provider name
  const getProviderDisplay = (provider: string) => {
    switch(provider.toLowerCase()) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic';
      case 'gemini':
        return 'Gemini';
      case 'perplexity':
        return 'Perplexity';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  return (
    <div className="flex flex-col items-center p-3 bg-card border rounded-lg">
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-sm font-medium">{getProviderDisplay(provider)}</span>
        {hasKey ? (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Available</Badge>
        ) : (
          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">Missing</Badge>
        )}
      </div>
      <Switch 
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={`Enable ${provider} API`}
      />
    </div>
  );
};

export default ApiToggleItem;
