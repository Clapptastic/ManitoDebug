import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { ApiKeyType, API_PROVIDERS } from '@/types/api-keys/unified';

interface ApiKeySelectProps {
  value?: ApiKeyType;
  onValueChange: (value: ApiKeyType) => void;
  placeholder?: string;
  disabled?: boolean;
  showStatus?: boolean;
  filterActive?: boolean;
}

/**
 * Unified API Key Select Component
 * Allows selection of API keys with real-time status display
 */
export const ApiKeySelect: React.FC<ApiKeySelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select API provider",
  disabled = false,
  showStatus = true,
  filterActive = true
}) => {
  const { apiKeys, hasApiKey, isApiKeyActive } = useUnifiedApiKeys();

  const availableProviders = Object.keys(API_PROVIDERS).filter(provider => {
    if (filterActive) {
      return hasApiKey(provider as ApiKeyType) && isApiKeyActive(provider as ApiKeyType);
    }
    return hasApiKey(provider as ApiKeyType);
  });

  const getProviderStatus = (provider: ApiKeyType) => {
    if (!hasApiKey(provider)) return null;
    const isActive = isApiKeyActive(provider);
    return (
      <div className="flex items-center gap-2">
        {isActive ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        ) : (
          <XCircle className="h-3 w-3 text-destructive" />
        )}
        <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    );
  };

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || availableProviders.length === 0}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={
          availableProviders.length === 0 
            ? "🔑 No API keys configured" 
            : placeholder
        } />
      </SelectTrigger>
      <SelectContent>
        {availableProviders.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>No API keys available</p>
            <p className="text-xs mt-1">Configure API keys in Settings</p>
          </div>
        ) : (
          availableProviders.map((provider) => (
            <SelectItem key={provider} value={provider} className="flex items-center justify-between">
              <div className="flex items-center justify-between w-full">
                <span className="capitalize">{provider}</span>
                {showStatus && getProviderStatus(provider as ApiKeyType)}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};