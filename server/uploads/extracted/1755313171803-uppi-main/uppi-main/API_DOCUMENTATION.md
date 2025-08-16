
# API Documentation

This document provides comprehensive documentation for the platform's API integrations, services, and architecture.

## Overview

The platform operates with a dual API key system:
- **User API Keys**: Personal keys stored by individual users for their specific analyses
- **Admin API Keys**: Platform-wide keys managed by super admins for system operations

## Admin API Keys System

### Purpose
Admin API keys are used for:
1. **Platform Operations**: System-wide competitor analysis, market research, and validation
2. **User Plan Limits**: For users with subscription plans that have token limits set by administrators
3. **Fallback Operations**: When user-specific API keys are unavailable or rate-limited

### Database Tables

#### `admin_api_keys`
Platform-wide API keys with usage tracking and limits:
```sql
- id: uuid (primary key)
- provider: text (openai, anthropic, perplexity, gemini, mistral)
- name: text (descriptive name)
- api_key: text (encrypted API key)
- masked_key: text (display purposes)
- is_active: boolean
- usage_limit_per_month: integer (optional token limit)
- current_month_usage: integer (tracked automatically)
- created_by: uuid (admin who created it)
- created_at, updated_at: timestamps
```

#### `admin_api_usage_tracking`
Comprehensive usage tracking for platform operations:
```sql
- admin_api_key_id: uuid (references admin_api_keys)
- user_id: uuid (optional - which user triggered the usage)
- endpoint: text (which operation used the key)
- tokens_used: integer
- cost_usd: numeric
- success: boolean
- metadata: jsonb (additional context)
- created_at: timestamp
```

### Edge Functions

#### `admin-api-keys`
**Purpose**: Secure management and retrieval of admin API keys
**Access**: Service role only

**Endpoints**:
- `POST` - Get available admin API key for platform use
- `POST` (with `forPlatformUse: false`) - Get admin keys for management
- `PUT` - Update usage tracking

**Usage Example**:
```typescript
// Get admin API key for platform use
const { data } = await supabase.functions.invoke('admin-api-keys', {
  body: { provider: 'openai', forPlatformUse: true }
});

// Track usage
await supabase.functions.invoke('admin-api-keys', {
  method: 'PUT',
  body: {
    keyId: data.keyId,
    tokensUsed: 1500,
    costUsd: 0.02,
    endpoint: 'competitor-analysis',
    userId: user.id
  }
});
```

## User API Keys System

### Purpose
User API keys are personal keys stored by individual users for their own analyses and operations.

### Database Table

#### `api_keys`
User-specific API keys:
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- provider: text
- api_key: text (encrypted)
- masked_key: text
- is_active: boolean
- created_at, updated_at: timestamps
```

## AI Provider Integrations

### Supported Providers
1. **OpenAI** - GPT-4, GPT-3.5-turbo for text generation and analysis
2. **Anthropic** - Claude for advanced reasoning and analysis
3. **Perplexity** - Real-time web search and information retrieval
4. **Google Gemini** - Multimodal AI capabilities
5. **Mistral AI** - European-based AI model alternative

### Usage Patterns

#### Platform Operations
For system-wide operations, the platform automatically:
1. Retrieves available admin API key for the required provider
2. Checks usage limits and availability
3. Executes the operation
4. Tracks usage and costs
5. Updates monthly usage counters

#### User Operations
For user-specific operations:
1. Check if user has their own API key for the provider
2. If available, use user's key
3. If unavailable or user is on managed plan, use admin key
4. Track usage appropriately

## Security & Access Control

### Row Level Security (RLS)
- **Admin API Keys**: Only super admins and service role can access
- **User API Keys**: Users can only access their own keys
- **Usage Tracking**: Admins can view all usage, users can view their triggered usage

### API Key Encryption
- All API keys are stored encrypted in the database
- Masked versions are provided for UI display
- Full keys are only accessible via secure edge functions

### Audit Trail
- All admin API key usage is tracked with user attribution
- Cost tracking for budget monitoring
- Success/failure tracking for reliability monitoring

## Monitoring & Diagnostics

### Admin Diagnostics
The admin panel includes comprehensive diagnostics for:
- Database connectivity and permissions
- Edge function availability and response times
- Admin API key status and usage
- System health metrics
- Real-time cost tracking

### User Diagnostics
User-facing diagnostics include:
- Personal API key validation
- Authentication status
- Basic connectivity tests

## Cost Management

### Usage Limits
- Monthly token limits can be set per admin API key
- Automatic usage tracking prevents overruns
- Real-time cost calculation and monitoring

### Budget Alerts
- Track costs across all providers
- Monitor usage trends
- Alert on approaching limits

## Edge Function Architecture

### Core Functions
1. **admin-api-keys** - Admin API key management
2. **user-api-keys** - User API key operations
3. **check-api-keys** - Key validation and health checks
4. **save-api-key** - Secure key storage
5. **validate-api-key** - Key validation

### Internal APIs
1. **competitor-analysis** - Comprehensive competitor research
2. **ai-market-analyst** - Market analysis and trends
3. **ai-validation-engine** - Content validation
4. **document-processing** - File analysis
5. **comprehensive-competitor-analysis** - Full analysis pipeline

### System Functions
1. **system-health** - Platform health monitoring
2. **microservice-health** - Service status checks
3. **log-api-metric** - Usage tracking
4. **admin-api** - Admin operations

## Integration Patterns

### API Key Selection Logic
```typescript
// Pseudocode for API key selection
async function getApiKey(provider: string, userId?: string) {
  // Check if user has personal key
  if (userId) {
    const userKey = await getUserApiKey(userId, provider);
    if (userKey && userKey.is_active) {
      return userKey;
    }
  }
  
  // Fall back to admin key
  const adminKey = await getAdminApiKey(provider);
  if (adminKey && hasUsageCapacity(adminKey)) {
    return adminKey;
  }
  
  throw new Error('No available API key for provider');
}
```

### Cost Tracking
All API operations automatically track:
- Token usage
- USD cost (estimated)
- Operation success/failure
- User attribution
- Timestamp and metadata

## Development Guidelines

### Adding New Providers
1. Update provider enum in types
2. Add validation logic in edge functions
3. Update admin UI for key management
4. Add cost calculation logic
5. Update documentation

### Error Handling
- Graceful degradation when keys are unavailable
- Clear error messages for debugging
- Automatic retry logic for transient failures
- Comprehensive logging for troubleshooting

### Testing
- Mock API responses for development
- Test both user and admin key flows
- Validate cost tracking accuracy
- Ensure proper access control

1. **OpenAI** - For GPT-based AI services
2. **Anthropic** - For Claude models
3. **Google AI (Gemini)** - For Google's AI models  
4. **Mistral AI** - For Mistral's models
5. **Perplexity** - For Perplexity's services
6. **SerpAPI** - For search engine results
7. **Google Search** - For Google Search API

### API Key Storage

All API keys are securely stored in the Supabase database with the following security measures:

- API keys are encrypted at rest
- Row-level security ensures users can only access their own keys
- Keys are never exposed to clients in plain text

### API Status Monitoring

The platform includes real-time monitoring of API keys:

- Validation of API keys on submission
- Periodic health checks
- Status indicators in the UI
- Error reporting for invalid or expired keys

## Supabase Integration

### Authentication

The platform uses Supabase Auth for user authentication with the following flows:

- Email/password authentication
- Magic link authentication
- Social provider authentication (configurable)
- JWT token management with auto-refresh

### Database Schema

Key database tables:

1. **api_keys** - Stores user API keys
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `key_type`: String (e.g., 'openai', 'anthropic')
   - `api_key`: String (encrypted)
   - `status`: String (e.g., 'active', 'error')
   - `last_validated`: Timestamp
   - `error_message`: String (nullable)

2. **api_status_checks** - Stores API status check results
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `api_type`: String
   - `status`: String
   - `last_checked`: Timestamp
   - `error_message`: String (nullable)

3. **analytics_websites** - Stores website analytics configuration
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `name`: String
   - `domain`: String
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

4. **competitor_analyses** - Stores competitor analysis data
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `competitor_name`: String
   - `status`: String
   - `data`: JSONB
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

### Database Functions

Key database functions:

1. `get_website_metrics(p_website_id, p_start_date, p_end_date)` - Retrieves website metrics
2. `get_analytics_summary(p_start_date, p_end_date)` - Gets analytics summary for all user websites
3. `update_modified_column()` - Trigger function to update timestamps
4. `match_code_embeddings(query_embedding, similarity_threshold, match_count, p_user_id)` - Searches code embeddings
5. `get_competitor_analysis_details_by_id_or_name(identifier)` - Gets competitor analysis by ID or name

## Edge Functions

The platform uses Supabase Edge Functions for serverless processing:

1. `validate-api-key` - Validates an API key with its provider
2. `save-api-key` - Securely saves an API key to the database
3. `generate-competitor-analysis` - Generates competitor analysis using AI

## Web Analytics API

The platform includes a web analytics system with:

- JavaScript snippet for website integration
- Event tracking endpoints
- Metrics calculation and aggregation
- Dashboard visualization

### Analytics Endpoints

- `POST /analytics/pageview` - Records a page view
- `POST /analytics/event` - Records a custom event
- `GET /analytics/metrics/:websiteId` - Gets metrics for a website
