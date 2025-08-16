
# API Key Management

## Overview

The API Key Management system allows users and administrators to manage API keys for various third-party services used within the application. This documentation covers the implementation details, usage patterns, and best practices for working with the API Key system.

## Key Features

- Storage of encrypted API keys in the database
- Role-based access control for API key management
- Validation and testing of API keys
- Monitoring of API usage and costs
- Support for multiple API providers

## API Key Types

The system supports the following API providers:

1. **OpenAI**: For AI-powered text generation and analysis
2. **Anthropic**: For Claude AI models
3. **Gemini**: For Google's Gemini AI models
4. **Perplexity**: For Perplexity AI search and analysis
5. **Mistral**: For Mistral AI models
6. **Cohere**: For Cohere AI models
7. **SerpAPI**: For search engine results page data

## Database Schema

API keys are stored in the `api_keys` table with the following structure:

- `id`: Unique identifier (UUID)
- `user_id`: Owner of the API key (UUID)
- `organization_id`: Optional organization ownership (UUID)
- `key_type`: Type of API key (string)
- `api_key`: Encrypted API key (string)
- `masked_key`: Masked version for display (string)
- `status`: Current status of the key (enum)
- `is_active`: Whether the key is active (boolean)
- `model_preference`: JSON object for model-specific settings
- `last_validated`: Timestamp of last validation
- `error_message`: Error message if validation failed
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Security Considerations

1. **Encryption**: API keys are encrypted at rest in the database
2. **Masking**: Keys are masked when displayed in the UI
3. **Access Control**: Row-level security policies restrict access to keys
4. **Validation**: Keys are validated before use to ensure they are working
5. **Organization Scoping**: Keys can be scoped to organizations

## API Key Status Management

API keys can have the following statuses:

- `pending`: Key has been added but not yet validated
- `active`: Key is valid and working
- `error`: Key encountered an error during validation
- `invalid`: Key was found to be invalid
- `unknown`: Status could not be determined

## API Key Validation

The application uses a background process and/or on-demand validation to ensure API keys are valid:

1. When a key is first added, it's set to `pending` status
2. The validation process calls the respective API provider with minimal queries
3. Based on the response, the key is marked as `active` or `invalid`
4. Periodic validation occurs to ensure keys remain valid

## User Interface Components

1. **ApiKeyForm**: Component for adding or updating API keys
2. **ApiKeyList**: Component for displaying and managing API keys
3. **ApiKeyStatus**: Component for displaying the status of an API key
4. **ApiKeyDialog**: Modal dialog for API key operations

## Usage in Code

### Retrieving API Keys

```typescript
import { getApiKey } from '@/services/api/client/apiClient';

// Get an API key for a specific provider
const apiKey = await getApiKey('openai');
```

### Using API Keys with Services

```typescript
import { ApiClient } from '@/services/api/client/apiClient';

// Call OpenAI with the stored API key
const response = await ApiClient.callOpenAI([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello, world!' }
]);
```

### Checking API Key Status

```typescript
import { useApiStatus } from '@/hooks/useApiStatus';

// In a React component
const { status, isLoading, refreshApiStatus } = useApiStatus('openai');
```

## Hooks and Services

1. **useApiKeyManagement**: Hook for managing API keys (add, update, delete)
2. **useApiStatus**: Hook for checking API key status
3. **useApiStatuses**: Hook for retrieving all API key statuses
4. **ApiKeyService**: Service for API key operations
5. **validateApiKey**: Function for validating an API key

## Edge Functions

1. **validate-api-key**: Validates an API key with its provider
2. **update-model-availability**: Updates model availability information

## Troubleshooting

### Common Issues

1. **Invalid API Key**: Check that the API key is correct and has proper permissions
2. **Rate Limiting**: Check if you've hit rate limits with the API provider
3. **Network Issues**: Ensure network connectivity to the API provider
4. **Permission Issues**: Verify the user has permission to use the API key

## Best Practices

1. Use environment-specific API keys (development vs. production)
2. Implement automatic rotation of API keys for enhanced security
3. Monitor API usage to avoid unexpected costs
4. Use organization-level keys for shared resources
5. Always validate keys before using them in critical operations

