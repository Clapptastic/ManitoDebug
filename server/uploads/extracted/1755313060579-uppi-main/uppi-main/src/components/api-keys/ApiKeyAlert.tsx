
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiKeyType } from '@/types/api-keys/unified';

interface ApiKeyAlertProps {
  apiKeyType: string; // Allow string for backward compatibility
  status: 'missing' | 'invalid' | 'valid';
  message?: string;
  onSetupClick?: () => void;
}

const ApiKeyAlert: React.FC<ApiKeyAlertProps> = ({
  apiKeyType,
  status,
  message,
  onSetupClick
}) => {
  const apiName = getApiName(apiKeyType);
  
  // Helper function to get human-readable API name
  function getApiName(keyType: string): string {
    switch (keyType.toLowerCase()) {
      case 'openai':
        return 'OpenAI';
      case 'anthropic':
        return 'Anthropic Claude';
      case 'gemini':
        return 'Google Gemini';
      case 'perplexity':
        return 'Perplexity';
      case 'mistral':
        return 'Mistral AI';
      case 'openai_embeddings':
        return 'OpenAI Embeddings';
      default:
        return keyType.charAt(0).toUpperCase() + keyType.slice(1);
    }
  }
  
  if (status === 'valid') {
    return (
      <Alert className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/50">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
        <AlertTitle className="text-green-800 dark:text-green-500">{apiName} API Key is valid</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          {message || `Your ${apiName} API key is working correctly.`}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'invalid') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Invalid {apiName} API Key</AlertTitle>
        <AlertDescription>
          {message || `Your ${apiName} API key is invalid or has expired. Please update it.`}
          <Button
            variant="link"
            className="px-0 text-destructive underline"
            onClick={onSetupClick}
          >
            Update API Key
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning" className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-800 dark:text-amber-500">{apiName} API Key Missing</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-400">
        {message || `You need to set up an ${apiName} API key to use this feature.`}
        {onSetupClick ? (
          <Button
            variant="link"
            className="px-0 text-amber-800 dark:text-amber-500 underline"
            onClick={onSetupClick}
          >
            Set up API Key
          </Button>
        ) : (
          <Button
            variant="link"
            className="px-0 text-amber-800 dark:text-amber-500 underline"
            asChild
          >
            <Link to="/api-keys">Set up API Key</Link>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ApiKeyAlert;
