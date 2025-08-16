
# API Integration Guide

## Overview

This guide documents how to integrate external API services with the platform. It covers API key management, validation, status checks, and best practices for consuming APIs across the application.

## API Key Management

### Supported API Providers

The platform currently supports the following API providers:

- **OpenAI** (`openai`): GPT models and embeddings
- **Anthropic** (`anthropic`): Claude models
- **Google Gemini** (`gemini`): Gemini models
- **Perplexity** (`perplexity`): Perplexity search and analysis
- **Mistral** (`mistral`): Mistral AI models
- **OpenAI Embeddings** (`openai_embeddings`): Specialized embedding models

### API Key Storage

API keys are stored securely in the database with the following considerations:

- Keys are **per-user** or **per-organization**, never global
- All keys are stored in the `api_keys` table with appropriate access controls
- Keys should never be exposed in client-side code or logs

### Adding API Keys

Users can add API keys through:

1. **Settings page**: `/settings/api-keys`
2. **Inline configuration**: Prompted when needed for a specific feature
3. **API Key Management Component**: `<ApiKeyForm />` component

Example:
```typescript
import ApiKeyForm from "@/components/settings/api-key/ApiKeyForm";
import { ApiKeyType } from "@/types/api-keys/types";

// In a React component
<ApiKeyForm 
  defaultKeyType={ApiKeyType.OPENAI}
  onSubmit={async (apiKey, keyType) => {
    // Process the API key submission
  }}
/>
```

## API Key Validation

The platform provides a validation mechanism to ensure API keys are correct before using them:

```typescript
// Validate an API key
const validationResult = await validateApiKey(
  keyType, // ApiKeyType enum value
  apiKey, // The key to validate
  userId // Optional user ID
);

if (validationResult.isValid) {
  // Key is valid
  console.log('Available credits:', validationResult.usageInfo?.remainingCredits);
} else {
  // Key is invalid
  console.error('Validation error:', validationResult.errorMessage);
}
```

## API Status Monitoring

### Status Types

API keys can have the following statuses:

- `pending`: Initial state, not yet validated
- `active`: Successfully validated and working
- `error`: Failed validation or encountered an error
- `inactive`: Manually disabled by the user
- `configured`: Key is set but not yet validated
- `working`: Key is currently in use and working
- `unconfigured`: No key has been provided

### Status Checking

Use the `useUnifiedApiKeyStatus` hook to monitor API statuses:

```typescript
import { useUnifiedApiKeyStatus } from '@/hooks/useUnifiedApiKeyStatus';

function ApiStatusComponent() {
  const { apiStatuses, refreshApiStatus, isRefreshing } = useApiKeyStatus();
  
  // Check a specific API's status
  const openAiStatus = apiStatuses.openai;
  
  return (
    <div>
      <p>OpenAI Status: {openAiStatus?.status}</p>
      <p>Last Checked: {openAiStatus?.lastChecked}</p>
      {openAiStatus?.errorMessage && (
        <p>Error: {openAiStatus.errorMessage}</p>
      )}
      <button 
        onClick={() => refreshApiStatus('openai')}
        disabled={isRefreshing}
      >
        Refresh Status
      </button>
    </div>
  );
}
```

## Building API-Enabled Features

### Best Practices

1. **Check API availability before usage**:
   ```typescript
   const { apiStatuses } = useApiKeyStatus();
   const isOpenAiAvailable = apiStatuses.openai?.isWorking;
   
   if (isOpenAiAvailable) {
     // Proceed with OpenAI-dependent feature
   } else {
     // Show configuration prompt or fallback
   }
   ```

2. **Provide Fallbacks**:
   - Always have a degraded mode when APIs are unavailable
   - Use local processing when possible
   - Clearly communicate limitations to users

3. **Error Handling**:
   - Implement proper error boundaries around API-dependent components
   - Translate technical errors into user-friendly messages
   - Log detailed errors for debugging

4. **Rate Limiting Awareness**:
   - Implement exponential backoff for retries
   - Queue requests when approaching rate limits
   - Display appropriate feedback during throttling

### API Toggles

For features that can use multiple API providers, implement toggle functionality:

```typescript
import { ApiToggleSection } from '@/components/market-validation/competitor-analysis/api-section/ApiToggleSection';

function FeatureWithToggleableApis() {
  const [enabledApis, setEnabledApis] = useState<ApiKeyType[]>([]);
  
  const handleToggle = (api: ApiKeyType, enabled: boolean) => {
    if (enabled) {
      setEnabledApis(prev => [...prev, api]);
    } else {
      setEnabledApis(prev => prev.filter(a => a !== api));
    }
  };
  
  return (
    <div>
      <ApiToggleSection 
        enabledApis={enabledApis}
        onToggle={handleToggle}
      />
      
      {/* Feature implementation */}
    </div>
  );
}
```

## API Models Configuration

The platform uses a centralized configuration for AI models:

```typescript
// Example entry from aiModels.ts
{
  openai: {
    name: 'OpenAI',
    description: 'GPT models for text generation and analysis',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    capabilities: [
      'Text generation',
      'Summarization',
      'Classification',
      'Content creation'
    ],
    documentationUrl: 'https://platform.openai.com/docs',
    isAvailable: true
  }
}
```

## Edge Functions for API Interactions

For secure API interactions, the platform uses Supabase Edge Functions:

1. **validate-api-key**: Validates API keys without exposing them
2. **competitor-analysis**: Performs competitor analysis using various APIs (CONSOLIDATED)
3. **microservices**: Manages microservice interactions

### Invoking Edge Functions

```typescript
// Invoke an edge function with proper error handling
try {
  const { data, error } = await supabase.functions.invoke<ResponseType>(
    'function-name',
    {
      body: {
        // Request parameters
      }
    }
  );
  
  if (error) throw error;
  
  // Process successful response
  return data;
} catch (error) {
  console.error('Function error:', error);
  throw error;
}
```

## Troubleshooting

Common API integration issues and solutions:

1. **Invalid API Key**:
   - Verify key format matches provider requirements
   - Check if key has appropriate permissions
   - Ensure key hasn't expired or been revoked

2. **Rate Limiting**:
   - Implement request queuing and throttling
   - Use exponential backoff for retries
   - Consider upgrading account tier for higher limits

3. **Response Format Changes**:
   - Implement robust parsing with fallbacks
   - Monitor for API version changes
   - Test with sample responses

4. **Network Issues**:
   - Implement connection timeout handling
   - Add automatic retry logic
   - Provide offline capabilities when possible

## API Security Best Practices

1. **Never expose API keys in client-side code**
2. **Use edge functions for all external API calls**
3. **Implement proper authentication and authorization**
4. **Sanitize all inputs before sending to external APIs**
5. **Validate and sanitize all responses before processing**
6. **Log API interactions for audit and debugging purposes**
7. **Rotate API keys periodically**
8. **Use the minimum necessary permissions for each key**
