# Simplified API Key Management Architecture

## Overview
Consolidated API key management with single source of truth pattern, removing redundant services and hooks.

## Simplified Flow Diagram

```mermaid
graph TB
    subgraph "Frontend UI Layer"
        ApiPage["/api-keys - API Keys Page<br/>SINGLE SOURCE OF TRUTH"]
        ApiManager["ApiKeyManager Component"]
        StatusSummary["ApiKeyStatusSummary Component"]
    end

    subgraph "React Hooks Layer"
        useUnifiedApiKeys["useUnifiedApiKeys Hook<br/>CONSOLIDATED: Keys + Status"]
    end

    subgraph "Service Layer"
        UnifiedService["unifiedApiKeyStatusService<br/>SINGLE SERVICE"]
    end

    subgraph "Backend Layer"
        EdgeFunction["enhanced-api-key-manager<br/>Edge Function"]
        ApiKeysTable["api_keys Table<br/>with Vault Storage"]
        AuditLogs["audit_logs Table"]
    end

    subgraph "External APIs"
        AIProviders["AI API Providers<br/>(OpenAI, Anthropic, etc.)"]
    end

    %% Simplified Flow
    ApiPage --> ApiManager
    ApiPage --> StatusSummary
    ApiManager --> useUnifiedApiKeys
    StatusSummary --> useUnifiedApiKeys
    
    useUnifiedApiKeys --> UnifiedService
    UnifiedService --> EdgeFunction
    
    EdgeFunction --> ApiKeysTable
    EdgeFunction --> AuditLogs
    EdgeFunction --> AIProviders
    
    %% Real-time Updates
    ApiKeysTable -.->|Real-time Subscriptions| UnifiedService
    UnifiedService -.->|State Updates| useUnifiedApiKeys

    %% Styling
    classDef ui fill:#e3f2fd
    classDef hooks fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef backend fill:#fff3e0
    classDef external fill:#f1f8e9

    class ApiPage,ApiManager,StatusSummary ui
    class useUnifiedApiKeys hooks
    class UnifiedService service
    class EdgeFunction,ApiKeysTable,AuditLogs backend
    class AIProviders external
```

## Key Simplifications Made

### Removed Redundancy
- ❌ `useUnifiedApiKeyStatus` hook → ✅ Merged into `useUnifiedApiKeys`
- ❌ `apiKeyService` legacy service → ✅ Direct use of `unifiedApiKeyStatusService`
- ❌ `ApiKeyContext` complexity → ✅ Simplified state management

### Consolidated Responsibilities
- **Single Hook**: `useUnifiedApiKeys` handles both keys and status
- **Single Service**: `unifiedApiKeyStatusService` manages all operations
- **Single UI Source**: `/api-keys` page is the authoritative interface

### Data Flow Benefits
1. **Linear Flow**: UI → Hook → Service → Backend
2. **Single Source of Truth**: All state managed in one place
3. **Real-time Updates**: Automatic propagation through unified subscriptions
4. **Type Safety**: Consistent types throughout the stack

## Component Responsibilities

### Frontend (`/api-keys` page)
- Display current API key status
- Manage API key creation/deletion
- Show real-time validation status

### Hook (`useUnifiedApiKeys`)
- Unified state management for keys and status
- Real-time subscriptions
- CRUD operations
- Status validation

### Service (`unifiedApiKeyStatusService`)
- Edge function communication
- Cache management
- Real-time notifications
- Validation coordination

### Backend (`enhanced-api-key-manager`)
- Vault encryption/decryption
- External API validation
- Database operations
- Audit logging

## Benefits of Simplified Architecture

1. **Reduced Complexity**: Single path for all operations
2. **Better Performance**: Fewer network calls, unified caching
3. **Easier Maintenance**: One service to update
4. **Type Consistency**: Unified type definitions
5. **Real-time Updates**: Single subscription system
6. **Security**: Centralized vault management