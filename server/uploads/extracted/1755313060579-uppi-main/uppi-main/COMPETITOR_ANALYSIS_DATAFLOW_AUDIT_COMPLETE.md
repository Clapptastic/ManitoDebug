# Complete Competitor Analysis Dataflow Audit

## Executive Summary

The competitor analysis system has a complex but well-structured dataflow spanning frontend React components, hooks, services, edge functions, database operations, and real-time progress tracking. The audit reveals a robust architecture with proper API key management, progress tracking, and result storage.

## 1. Frontend Layer

### 1.1 Entry Points
- **Primary**: `/competitor-analysis` route → `CompetitorAnalysisDashboard`
- **Details**: `/competitor-analysis/details/:analysisId` → `AnalysisDetailPage`
- **Settings**: `/settings` for API key management

### 1.2 Core Hook: `useCompetitorAnalysis`
**Location**: `src/hooks/useCompetitorAnalysis.ts`

**Key Functions**:
- `startAnalysis()` - Initiates analysis with session tracking
- `fetchAnalyses()` - Retrieves saved analyses
- `saveAnalysis()` - Persists results
- Real-time progress subscription via Supabase realtime

**Progress State Management**:
```typescript
interface AnalysisProgress {
  sessionId: string;
  status: 'idle' | 'starting' | 'analyzing' | 'completed' | 'error';
  currentCompetitor: string | null;
  completedCount: number;
  totalCount: number;
  results: CompetitorAnalysisResult[];
}
```

### 1.3 Service Layer: `CompetitorAnalysisService`
**Location**: `src/services/competitorAnalysisService.ts`

**Critical Methods**:
- `startAnalysis()` - Orchestrates the entire analysis flow
- `checkApiKeyRequirements()` - Validates required API keys
- `getAvailableProviders()` - Returns active API providers

## 2. API Key Management Flow

### 2.1 Frontend API Key Operations
1. **Validation**: `validateUserApiKeys()` utility calls `check-api-keys` edge function
2. **Storage**: Keys stored encrypted via `secure-api-key-manager` edge function
3. **Retrieval**: Uses `manage_api_key` RPC for secure key access

### 2.2 Edge Function: `secure-api-key-manager`
**Location**: `supabase/functions/secure-api-key-manager/index.ts`

**Functions**:
- `handleEncrypt()` - AES-GCM encryption of API keys
- `handleDecrypt()` - Secure decryption for edge functions
- `handleSaveApiKey()` - Database persistence with hashing

### 2.3 Validation Edge Function: `check-api-keys`
**Location**: `supabase/functions/check-api-keys/index.ts`

**Process**:
1. Fetches user's API keys via `manage_api_key` RPC
2. Decrypts keys using `secure-api-key-manager`
3. Tests each provider's API endpoint
4. Updates status in `api_keys` table

**FIXED ISSUE**: Corrected decryption call to use `manage_api_key` RPC instead of direct edge function call.

## 3. Analysis Execution Flow

### 3.1 Pre-Flight Checks
```typescript
// Cost validation
const { data: costCheck } = await supabase.rpc('check_user_cost_allowed', {
  projected_cost_param: estimatedCost
});

// Gate validation
const { data: gateData } = await supabase.functions.invoke('competitor-analysis-gate', {
  body: { action: 'check', providersSelected }
});
```

### 3.2 Progress Tracking Initialization
```typescript
const { data: progressId } = await supabase.rpc('insert_competitor_analysis_progress', {
  session_id_param: sessionId,
  user_id_param: user.id,
  total_competitors_param: competitors.length
});
```

### 3.3 Main Analysis Edge Function
**Location**: `supabase/functions/competitor-analysis/index.ts`

**Key Operations**:
1. **Authentication**: Validates user via JWT
2. **API Key Retrieval**: Decrypts keys for selected providers
3. **Provider Orchestration**: Calls multiple AI providers (OpenAI, Anthropic, Perplexity, etc.)
4. **Data Fusion**: Combines provider responses into unified schema
5. **Database Persistence**: Stores results in multiple tables

**Data Flow**:
```
Input → Validation → API Key Decrypt → Provider Calls → Fusion → DB Storage → Progress Update
```

### 3.4 Database Persistence Strategy
**Primary Table**: `competitor_analyses`
```sql
-- Main analysis results with normalized fields
INSERT INTO competitor_analyses (
  user_id, name, website_url, industry, description,
  employee_count, founded_year, headquarters,
  strengths, weaknesses, opportunities, threats,
  analysis_data, session_id, analysis_id
)
```

**Supporting Tables**:
- `competitor_analysis_progress` - Real-time progress tracking
- `analysis_provider_runs` - Per-provider execution logs
- `analysis_provider_results` - Normalized provider responses
- `audit_logs` - Security and operational audit trail

## 4. Real-Time Progress System

### 4.1 Progress Updates
**Edge Function Updates**:
```typescript
await supabaseClient.rpc('update_competitor_analysis_progress', {
  session_id_param: sessionId,
  status_param: 'running',
  progress_percentage_param: progressPercentage,
  current_competitor_param: competitor
});
```

### 4.2 Frontend Subscription
**Hook Implementation**:
```typescript
const channel = supabase
  .channel('competitor-analysis-progress')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'competitor_analysis_progress',
    filter: `session_id=eq.${sessionId}`
  }, handleProgressUpdate)
  .subscribe();
```

## 5. Gate System

### 5.1 Feature Gate Function
**Location**: `supabase/functions/competitor-analysis-gate/index.ts`

**Validation Steps**:
1. **Global Flag**: Checks `feature_flags` table
2. **User Unlock**: Validates `user_feature_gates` table
3. **Provider Keys**: Verifies active API keys
4. **Admin Bypass**: Allows admin users regardless

### 5.2 Unlock Mechanism
```typescript
// Unlock criteria: global enabled + active API keys
if (globalEnabled && anyActive) {
  await client.from('user_feature_gates').upsert({
    user_id: user.id,
    feature_key: 'competitor_analysis',
    unlocked: true
  });
}
```

## 6. Cost Management

### 6.1 Pre-Flight Cost Check
```typescript
const { data: costCheck } = await supabase.rpc('check_user_cost_allowed', {
  projected_cost_param: providersCount * competitors.length * 0.02
});
```

### 6.2 Mid-Run Budget Enforcement
- Checks remaining budget before each competitor
- Gracefully stops analysis if budget exceeded
- Updates progress with budget skip reason

## 7. Error Handling & Resilience

### 7.1 Circuit Breakers
```typescript
const circuit = getCircuitBreaker('edge:competitor-analysis', {
  failureThreshold: 3,
  cooldownMs: 15_000
});
```

### 7.2 Retry Logic
```typescript
await retryWithJitter(() => 
  supabase.functions.invoke('competitor-analysis', { body }),
  { retries: 2, baseMs: 200, maxMs: 1500 }
);
```

### 7.3 Graceful Degradation
- Failed provider calls don't stop entire analysis
- Minimal error responses keep UI functional
- Progress updates even on partial failures

## 8. Security & Audit

### 8.1 Authentication
- JWT validation on all edge functions
- User-scoped data access via RLS policies
- Service role escalation for privileged operations

### 8.2 API Key Security
- AES-GCM encryption for stored keys
- Secure decryption in edge functions only
- No plaintext keys in client code

### 8.3 Audit Trail
```typescript
await adminClient.from('audit_logs').insert({
  user_id: user.id,
  resource_type: 'competitor_analysis',
  action: 'analysis_started',
  session_id: sessionId,
  metadata: { competitors, providers }
});
```

## 9. Critical Issues Found & Fixed

### 9.1 API Key Decryption Issue ✅ FIXED
**Problem**: `check-api-keys` function was incorrectly calling `secure-api-key-manager` with wrong parameters
**Solution**: Updated to use `manage_api_key` RPC with `get_for_decryption` operation

### 9.2 Localhost References ✅ FIXED
**Problem**: Hardcoded localhost URLs in admin components
**Solution**: Replaced with `window.location.origin` for dynamic URL generation

## 10. Data Quality & Validation

### 10.1 Schema Validation
- Unified schema across all providers
- Data quality scoring for each field
- Confidence scoring for reliability assessment

### 10.2 Source Citation
- Evidence sources required for all claims
- Confidence scores per data point
- Provider provenance tracking

## 11. Performance Optimizations

### 11.1 Caching
- Prompt caching with 60-second TTL
- Circuit breaker state persistence
- Rate limiting per endpoint

### 11.2 Parallel Execution
- Multiple providers called simultaneously
- Asynchronous progress updates
- Background data aggregation

## Conclusion

The competitor analysis system demonstrates a mature, production-ready architecture with:

✅ **Secure API key management** with proper encryption
✅ **Robust error handling** with circuit breakers and retries  
✅ **Real-time progress tracking** via Supabase realtime
✅ **Comprehensive audit logging** for security and compliance
✅ **Multi-provider orchestration** with graceful degradation
✅ **Cost management** with budget enforcement
✅ **Feature gating** with unlock mechanisms

The dataflow is well-architected, properly secured, and handles edge cases gracefully. The recent fixes to API key decryption and localhost references have resolved the critical issues identified in the edge function logs.