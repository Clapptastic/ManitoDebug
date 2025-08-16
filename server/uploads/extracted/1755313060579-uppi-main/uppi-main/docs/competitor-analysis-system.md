# Competitor Analysis System Documentation

## Overview

The Competitor Analysis System is an AI-powered feature that automatically researches and analyzes competitors using multiple AI providers (OpenAI and Perplexity) to gather comprehensive business intelligence.

## System Architecture

```
Frontend (React) → API Key Management → Edge Function → AI Providers → Database Storage
     ↓                    ↓                  ↓              ↓              ↓
Competitor Input → Validation & Auth → analyze-competitor → OpenAI/Perplexity → competitor_analyses table
```

## Core Components

### 1. API Key Management System

**Location**: `/admin/api-management`

**Purpose**: Securely stores and manages user-specific API keys for AI providers.

**Supported Providers**:
- **OpenAI**: For comprehensive business analysis and structured data extraction
- **Perplexity**: For real-time web search and current market intelligence

**Database Table**: `api_keys`
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- provider: text (openai, perplexity)
- api_key: text (encrypted)
- masked_key: text (display purposes)
- status: enum (pending, active, error)
- last_validated: timestamp
- error_message: text
```

**Security Features**:
- User-specific API keys (no global keys)
- Row Level Security (RLS) policies
- Automatic validation on creation
- Masked display for security

### 2. Edge Function: analyze-competitor

**Location**: `supabase/functions/analyze-competitor/index.ts`

**Purpose**: Orchestrates the competitor analysis process using multiple AI providers.

#### Process Flow:

1. **Authentication & Validation**
   - Validates user authentication
   - Fetches user's active API keys
   - Checks for required providers (OpenAI, Perplexity)

2. **AI Provider Selection**
   - Primary: Perplexity (for real-time web data)
   - Fallback: OpenAI (for comprehensive analysis)
   - Uses all available API keys marked as active

3. **Analysis Execution**
   ```typescript
   // Perplexity Analysis (Real-time web search)
   const perplexityPrompt = `Analyze the competitor "${competitor}" and provide:
   - Current market position and recent news
   - Latest product launches and updates
   - Recent financial performance
   - Current competitive landscape`;
   
   // OpenAI Analysis (Structured business intelligence)
   const openaiPrompt = `Provide comprehensive business analysis for "${competitor}":
   - Company overview and business model
   - SWOT analysis
   - Market share and positioning
   - Key strengths and weaknesses`;
   ```

4. **Data Processing & Storage**
   - Combines results from multiple AI providers
   - Structures data into standardized format
   - Calculates data quality and completeness scores
   - Stores in `competitor_analyses` table

#### Error Handling:

- **Model Deprecation**: Automatic fallback when Perplexity models are outdated
- **API Failures**: Graceful degradation between providers
- **Rate Limiting**: Proper error messages and retry logic
- **Authentication Issues**: Clear error reporting

### 3. Database Schema: competitor_analyses

**Primary Fields**:
```sql
- id: uuid (primary key)
- user_id: uuid (owner)
- name: text (competitor name)
- status: enum (pending, completed, error)
- created_at: timestamp
- updated_at: timestamp
```

**Business Intelligence Fields**:
```sql
- description: text
- website_url: text
- founded_year: integer
- headquarters: text
- industry: text
- business_model: text
- market_position: text
```

**SWOT Analysis**:
```sql
- strengths: text[] (array)
- weaknesses: text[] (array)
- opportunities: text[] (array)
- threats: text[] (array)
```

**Market Data**:
```sql
- target_market: text[] (array)
- customer_segments: text[] (array)
- geographic_presence: text[] (array)
- market_share_estimate: numeric
```

**Financial & Strategic Data**:
```sql
- revenue_estimate: numeric
- employee_count: integer
- funding_info: jsonb
- product_portfolio: jsonb
- pricing_strategy: jsonb
- technology_analysis: jsonb
```

**Quality Metrics**:
```sql
- data_completeness_score: numeric (0-100)
- data_quality_score: numeric (0-100)
- confidence_scores: jsonb
- source_citations: jsonb
```

### 4. Frontend Components

#### Competitor Analysis Page (`/competitor-analysis`)
- Input form for competitor name
- Real-time analysis status
- Results display with comprehensive data visualization
- Export capabilities

#### API Management Interface (`/admin/api-management`)
- Add/remove API keys
- Validate key functionality
- Monitor usage and status
- View error logs

## How It Works: Step-by-Step

### 1. User Initiates Analysis

1. User navigates to `/competitor-analysis`
2. Enters competitor name (e.g., "Microsoft", "Apple")
3. Clicks "Analyze Competitor"

### 2. System Validation

1. **Authentication Check**: Verifies user is logged in
2. **API Key Check**: Confirms user has active API keys
3. **Input Validation**: Sanitizes competitor name input

### 3. Analysis Process

1. **Edge Function Invocation**:
   ```typescript
   const response = await supabase.functions.invoke('analyze-competitor', {
     body: {
       competitor: "microsoft",
       enabledApis: ["perplexity", "openai"]
     }
   });
   ```

2. **Multi-Provider Analysis**:
   - **Perplexity**: Real-time web search for current data
   - **OpenAI**: Comprehensive business analysis and structuring

3. **Data Synthesis**:
   - Combines insights from multiple sources
   - Resolves conflicting information
   - Calculates confidence scores

### 4. Result Storage & Display

1. **Database Storage**: Structured data saved to `competitor_analyses` table
2. **Real-time Updates**: Frontend receives analysis results
3. **Data Visualization**: Charts, graphs, and structured displays
4. **Export Options**: PDF, CSV, or JSON formats

## AI Provider Integration

### OpenAI Integration
- **Model**: GPT-4.1-2025-04-14 (primary)
- **Use Case**: Structured business analysis, SWOT analysis, strategic insights
- **Advantages**: Consistent formatting, comprehensive analysis
- **Rate Limits**: Managed per user API key

### Perplexity Integration
- **Model**: llama-3.1-sonar-small-128k-online (with fallbacks)
- **Use Case**: Real-time web search, current news, market updates
- **Advantages**: Latest information, web-connected insights
- **Challenges**: Model deprecation, requires fallback handling

## Security & Privacy

### Data Protection
- **User Isolation**: Each user's data is completely isolated
- **API Key Security**: Encrypted storage, masked display
- **RLS Policies**: Database-level access control
- **No Global Keys**: All API keys are user-specific

### Rate Limiting & Usage
- **Per-User Limits**: Based on individual API key quotas
- **Cost Management**: Users control their own API spending
- **Usage Tracking**: Monitor API calls and costs per user

## Error Handling & Monitoring

### Common Issues & Solutions

1. **"Invalid model" Error (Perplexity)**:
   - **Cause**: Perplexity deprecated old models
   - **Solution**: Automatic fallback to OpenAI
   - **Prevention**: Regular model validation

2. **"Permission denied for table documentation"**:
   - **Cause**: Insufficient RLS policies
   - **Solution**: Admin access required
   - **Fix**: Updated policy configurations

3. **API Key Validation Failures**:
   - **Cause**: Invalid or expired keys
   - **Solution**: Key re-validation and error messages
   - **Prevention**: Regular health checks

### Monitoring & Logging

- **Edge Function Logs**: Available in Supabase dashboard
- **API Status Monitoring**: Real-time health checks
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Analysis completion times and success rates

## Future Enhancements

### Planned Features
1. **Additional AI Providers**: Anthropic Claude, Google Gemini
2. **Scheduled Analysis**: Automated competitor monitoring
3. **Comparison Tools**: Side-by-side competitor comparisons
4. **Alert System**: Notifications for significant competitor changes
5. **Industry Benchmarking**: Automated industry analysis

### Scalability Considerations
- **Caching Layer**: Redis for frequently analyzed competitors
- **Background Processing**: Queue system for large analyses
- **Data Archival**: Historical analysis tracking
- **API Optimization**: Batch processing for multiple competitors

## Troubleshooting Guide

### For Users
1. **No API Keys**: Visit `/admin/api-management` to add keys
2. **Analysis Fails**: Check API key validity and balance
3. **Incomplete Results**: Verify multiple API providers are configured
4. **Slow Performance**: Large companies may take longer to analyze

### For Administrators
1. **Monitor Edge Function Logs**: Check Supabase function logs
2. **Database Health**: Monitor RLS policies and permissions
3. **API Provider Status**: Track provider availability and model updates
4. **User Support**: Guide users through API key setup

## API Reference

### Frontend Usage
```typescript
// Start competitor analysis
const { data, error } = await supabase.functions.invoke('analyze-competitor', {
  body: {
    competitor: 'company-name',
    enabledApis: ['openai', 'perplexity']
  }
});

// Fetch analysis results
const { data: analyses } = await supabase
  .from('competitor_analyses')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Edge Function Response
```typescript
interface AnalysisResponse {
  success: boolean;
  data?: {
    name: string;
    status: 'completed' | 'pending' | 'error';
    description: string;
    strengths: string[];
    weaknesses: string[];
    // ... additional fields
  };
  error?: string;
}
```

This comprehensive system provides users with powerful, AI-driven competitor intelligence while maintaining security, scalability, and user control over API costs and data access.