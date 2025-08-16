# AI-Powered SaaS Platform - System Architecture & User Flows

This document outlines the complete system architecture, user flows, and data flows for the AI-powered entrepreneurship platform.

## Table of Contents
1. [System Overview](#system-overview)
2. [User Authentication Flow](#user-authentication-flow)
3. [API Key Management Flow](#api-key-management-flow)
4. [AI Chat System Flow](#ai-chat-system-flow)
5. [Competitor Analysis Flow](#competitor-analysis-flow)
6. [Geographic Analysis Flow](#geographic-analysis-flow)
7. [Admin Management Flow](#admin-management-flow)
8. [Data Architecture](#data-architecture)
9. [Edge Function Architecture](#edge-function-architecture)
10. [Security & Monitoring Flow](#security--monitoring-flow)

## System Overview

```mermaid
graph TB
    User[👤 User] --> Frontend[🌐 React Frontend]
    Admin[👑 Admin] --> AdminPanel[🔧 Admin Panel]
    
    Frontend --> Auth[🔐 Supabase Auth]
    Frontend --> API[📡 Supabase Client]
    
    API --> EdgeFunctions[⚡ Edge Functions]
    API --> Database[(🗄️ PostgreSQL)]
    API --> Storage[📁 Supabase Storage]
    
    EdgeFunctions --> OpenAI[🤖 OpenAI API]
    EdgeFunctions --> Anthropic[🧠 Anthropic API]
    EdgeFunctions --> Gemini[💎 Google Gemini]
    EdgeFunctions --> Perplexity[🔍 Perplexity API]
    
    Database --> Vault[🔒 Supabase Vault]
    
    EdgeFunctions --> Database
    EdgeFunctions --> Logging[📊 Analytics & Logs]
    
    style Frontend fill:#e1f5fe
    style EdgeFunctions fill:#fff3e0
    style Database fill:#f3e5f5
    style Vault fill:#ffebee
```

## User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant SA as Supabase Auth
    participant DB as Database
    participant P as Profiles Table

    U->>F: Visit Application
    F->>SA: Check Auth Status
    
    alt User Not Authenticated
        F->>U: Show Login/Register
        U->>F: Submit Credentials
        F->>SA: Authenticate User
        SA->>DB: Verify/Create User
        SA->>F: Return Auth Token
        
        F->>P: Create/Update Profile
        P->>F: Profile Data
        F->>U: Redirect to Dashboard
    else User Authenticated
        SA->>F: Return User Session
        F->>P: Fetch Profile Data
        P->>F: User Profile & Role
        F->>U: Show Dashboard
    end
    
    Note over F,P: RLS policies ensure users only access their own data
```

## API Key Management Flow

```mermaid
flowchart TD
    A[User visits API Keys page] --> B[Check existing keys]
    B --> C{Has API Keys?}
    
    C -->|No| D[Show "Add API Key" button]
    C -->|Yes| E[Display key list with status]
    
    D --> F[User clicks "Add API Key"]
    F --> G[Select Provider]
    G --> H[Enter API Key]
    H --> I[Click Save]
    
    I --> J[Frontend validation]
    J --> K{Valid format?}
    K -->|No| L[Show format error]
    K -->|Yes| M[Call enhanced-api-key-manager]
    
    M --> N[Edge Function Processing]
    N --> O[Validate key format]
    O --> P[Test API connection with timeout]
    P --> Q{API responds?}
    
    Q -->|No| R[Return validation error]
    Q -->|Yes| S[Store in Supabase Vault]
    S --> T[Create masked version]
    T --> U[Save to api_keys table]
    U --> V[Return success]
    
    V --> W[Update UI with new key]
    R --> X[Show error message]
    L --> H
    X --> H
    
    E --> Y[Key actions available]
    Y --> Z[Validate/Delete/View]
    
    style N fill:#fff3e0
    style S fill:#ffebee
    style U fill:#f3e5f5
```

## AI Chat System Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant H as useSecureOpenAI Hook
    participant CB as ChatbotConfig Service
    participant EF as secure-openai-chat Edge Function
    participant V as Supabase Vault
    participant AI as OpenAI API
    participant DB as Database

    U->>F: Send chat message
    F->>H: callChatAPI()
    
    H->>CB: Get chatbot configuration
    CB->>DB: Fetch user chatbot config
    DB->>CB: Return config (provider, model)
    CB->>H: Return active config
    
    alt Prompt Key Provided
        H->>EF: Call prompt-get function
        EF->>DB: Fetch system prompt
        DB->>EF: Return prompt content
        EF->>H: Return system prompt
    end
    
    H->>EF: Invoke secure-openai-chat
    Note over H,EF: Include messages, model, temperature, max_tokens
    
    EF->>V: Retrieve user's API key
    V->>EF: Return decrypted API key
    
    EF->>AI: Call OpenAI API
    Note over EF,AI: Use gpt-5-2025-08-07 or specified model
    AI->>EF: Return AI response
    
    EF->>DB: Log API usage & costs
    EF->>H: Return response
    H->>F: Update UI with response
    F->>U: Display AI message
    
    alt Error Handling
        AI-->>EF: API Error
        EF-->>H: Return error
        H-->>F: Show error toast
    end
```

## Competitor Analysis Flow

```mermaid
flowchart TD
    A[User starts competitor analysis] --> B[Select competitors]
    B --> C[Choose AI providers]
    C --> D[Click "Start Analysis"]
    
    D --> E[competitorAnalysisService.startAnalysis]
    E --> F[Create analysis session]
    F --> G[Call competitor-analysis Edge Function]
    
    G --> H[Initialize progress tracking]
    H --> I[For each competitor]
    
    I --> J[Get user API keys for selected providers]
    J --> K{API keys available?}
    K -->|No| L[Return missing keys error]
    K -->|Yes| M[Parallel provider analysis]
    
    M --> N[OpenAI Analysis]
    M --> O[Anthropic Analysis]
    M --> P[Perplexity Analysis]
    
    N --> Q[Structured competitor data]
    O --> Q
    P --> Q
    
    Q --> R[Combine & normalize results]
    R --> S[Calculate confidence scores]
    S --> T[Store in competitor_analyses table]
    T --> U[Update progress status]
    
    U --> V{More competitors?}
    V -->|Yes| I
    V -->|No| W[Analysis complete]
    
    W --> X[Send completion notification]
    X --> Y[User views results]
    
    L --> Z[Show error message]
    
    style G fill:#fff3e0
    style Q fill:#e8f5e8
    style T fill:#f3e5f5
    
    subgraph "Real-time Updates"
        H --> AA[competitor_analysis_progress table]
        U --> AA
        AA --> BB[Frontend polling/subscription]
        BB --> CC[Update progress bar]
    end
```

## Geographic Analysis Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant GS as Geographic Service
    participant EF as secure-openai-chat Edge Function
    participant AI as AI Provider
    participant DB as Database

    U->>F: Request geographic analysis
    F->>GS: analyzeGeographicMarket(region)
    
    GS->>EF: Call with geographic prompt
    Note over GS,EF: Include region-specific market analysis prompt
    
    EF->>DB: Get user's API key
    EF->>AI: Send market analysis request
    Note over EF,AI: Model: gpt-4.1-2025-04-14 for consistency
    
    AI->>EF: Return market insights
    EF->>DB: Log usage metrics
    EF->>GS: Return structured data
    GS->>F: Market analysis results
    F->>U: Display geographic insights
    
    Note over U,DB: Covers market size, regulations, competition, opportunities
```

## Admin Management Flow

```mermaid
flowchart TD
    A[Admin User Login] --> B{Is Super Admin?}
    B -->|Yes| C[Full Admin Dashboard Access]
    B -->|No| D[Limited Admin Access]
    
    C --> E[User Management]
    C --> F[API Key Overview]
    C --> G[System Analytics]
    C --> H[Affiliate Management]
    C --> I[Billing Management]
    
    E --> E1[View All Users]
    E --> E2[Manage Roles]
    E --> E3[Account Deletion Requests]
    
    F --> F1[API Key Status Monitoring]
    F --> F2[Usage Analytics]
    F --> F3[Cost Tracking]
    
    G --> G1[Performance Metrics]
    G --> G2[Error Monitoring]
    G --> G3[Audit Logs]
    
    H --> H1[Affiliate Programs]
    H --> H2[Link Tracking]
    H --> H3[Commission Management]
    
    I --> I1[Subscription Management]
    I --> I2[Invoice Generation]
    I --> I3[Payment Tracking]
    
    style C fill:#ffebee
    style E fill:#f3e5f5
    style F fill:#e8f5e8
    style G fill:#fff3e0
```

## Data Architecture

```mermaid
erDiagram
    profiles ||--o{ api_keys : "has"
    profiles ||--o{ competitor_analyses : "creates"
    profiles ||--o{ analysis_runs : "initiates"
    profiles ||--o{ api_usage_costs : "incurs"
    
    api_keys {
        uuid id PK
        uuid user_id FK
        text provider
        text masked_key
        uuid vault_secret_id
        boolean is_active
        timestamp created_at
    }
    
    competitor_analyses {
        uuid id PK
        uuid user_id FK
        text name
        text status
        jsonb analysis_data
        jsonb confidence_scores
        timestamp created_at
    }
    
    analysis_runs {
        uuid id PK
        uuid user_id FK
        text run_type
        text status
        jsonb input_data
        jsonb output_data
        timestamp created_at
    }
    
    api_usage_costs {
        uuid id PK
        uuid user_id FK
        text provider
        numeric cost_usd
        integer tokens_used
        date date
    }
    
    profiles {
        uuid id PK
        uuid user_id FK
        text role
        text email
        boolean is_active
        timestamp created_at
    }
    
    audit_logs {
        uuid id PK
        uuid user_id FK
        text action
        text resource_type
        jsonb metadata
        timestamp created_at
    }
    
    profiles ||--o{ audit_logs : "generates"
```

## Edge Function Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        React[React Components]
        Hooks[Custom Hooks]
        Services[Service Classes]
    end
    
    subgraph "Edge Functions"
        SecureChat[secure-openai-chat]
        CompAnalysis[competitor-analysis]
        ApiKeyMgr[enhanced-api-key-manager]
        ApiValidation[api-key-validation-secure]
        PromptGet[prompt-get]
        CostTracker[api-cost-tracker]
    end
    
    subgraph "External APIs"
        OpenAI[OpenAI API]
        Anthropic[Anthropic API]
        Gemini[Google Gemini]
        Perplexity[Perplexity API]
    end
    
    subgraph "Data Layer"
        Database[(PostgreSQL)]
        Vault[Supabase Vault]
        Storage[File Storage]
    end
    
    React --> Hooks
    Hooks --> Services
    Services --> SecureChat
    Services --> CompAnalysis
    Services --> ApiKeyMgr
    
    SecureChat --> OpenAI
    CompAnalysis --> OpenAI
    CompAnalysis --> Anthropic
    CompAnalysis --> Perplexity
    
    ApiKeyMgr --> OpenAI
    ApiKeyMgr --> Anthropic
    ApiKeyMgr --> Gemini
    
    SecureChat --> Database
    CompAnalysis --> Database
    ApiKeyMgr --> Vault
    ApiValidation --> Vault
    
    CostTracker --> Database
    PromptGet --> Database
    
    style SecureChat fill:#e3f2fd
    style CompAnalysis fill:#f3e5f5
    style ApiKeyMgr fill:#fff3e0
    style Vault fill:#ffebee
```

## Security & Monitoring Flow

```mermaid
flowchart TD
    A[User Action] --> B[Authentication Check]
    B --> C{Authenticated?}
    C -->|No| D[Redirect to Login]
    C -->|Yes| E[Check RLS Policies]
    
    E --> F{Access Allowed?}
    F -->|No| G[Access Denied]
    F -->|Yes| H[Execute Action]
    
    H --> I[Log to Audit Trail]
    I --> J[Track API Usage]
    J --> K[Monitor Costs]
    K --> L{Cost Limits?}
    
    L -->|Exceeded| M[Block Further Usage]
    L -->|Within Limits| N[Continue Operation]
    
    N --> O[Performance Monitoring]
    O --> P[Error Tracking]
    P --> Q[Security Scanning]
    
    Q --> R{Anomalies Detected?}
    R -->|Yes| S[Alert Admins]
    R -->|No| T[Normal Operation]
    
    style B fill:#ffebee
    style E fill:#ffebee
    style I fill:#f3e5f5
    style Q fill:#fff3e0
    
    subgraph "Security Layers"
        B
        E
        I
        Q
    end
    
    subgraph "Monitoring"
        J
        K
        O
        P
    end
```

## Cost Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant EF as Edge Function
    participant CM as Cost Monitor
    participant DB as Database
    participant Alert as Alert System

    U->>F: Trigger AI Operation
    F->>EF: Call AI service
    
    EF->>CM: Check user cost limits
    CM->>DB: Get monthly spend
    DB->>CM: Return current costs
    CM->>EF: Cost check result
    
    alt Within Limits
        EF->>AI: Make AI API call
        AI->>EF: Return response + usage
        EF->>CM: Log usage & cost
        CM->>DB: Store cost data
        EF->>F: Return AI response
    else Limit Exceeded
        EF->>F: Return cost limit error
        F->>U: Show upgrade prompt
    end
    
    CM->>Alert: Check alert thresholds
    alt 80% of limit reached
        Alert->>U: Send warning email
    end
```

## Real-time Data Flow

```mermaid
graph LR
    subgraph "User Interface"
        Dashboard[Dashboard]
        Progress[Progress Bars]
        Notifications[Notifications]
    end
    
    subgraph "Real-time Engine"
        Supabase[Supabase Realtime]
        Subscriptions[Table Subscriptions]
        Events[Event Broadcasting]
    end
    
    subgraph "Database Changes"
        ProgressTable[competitor_analysis_progress]
        AnalysisTable[competitor_analyses]
        CostTable[api_usage_costs]
    end
    
    Dashboard --> Subscriptions
    Subscriptions --> ProgressTable
    Subscriptions --> AnalysisTable
    Subscriptions --> CostTable
    
    ProgressTable --> Events
    AnalysisTable --> Events
    CostTable --> Events
    
    Events --> Progress
    Events --> Notifications
    Events --> Dashboard
    
    style Supabase fill:#e3f2fd
    style Events fill:#f3e5f5
```

## Integration Architecture

```mermaid
graph TB
    subgraph "Client Applications"
        WebApp[Web Application]
        MobileApp[Mobile App]
        API[API Clients]
    end
    
    subgraph "API Gateway"
        Supabase[Supabase API Gateway]
        Auth[Authentication Layer]
        RLS[Row Level Security]
    end
    
    subgraph "Business Logic"
        EdgeFunctions[Edge Functions]
        Workflows[Business Workflows]
        Validators[Data Validators]
    end
    
    subgraph "Data Storage"
        PostgreSQL[(PostgreSQL Database)]
        Vault[Encrypted Vault]
        FileStorage[File Storage]
    end
    
    subgraph "External Services"
        AIProviders[AI Providers]
        Analytics[Analytics Services]
        Monitoring[Monitoring Tools]
    end
    
    WebApp --> Supabase
    MobileApp --> Supabase
    API --> Supabase
    
    Supabase --> Auth
    Auth --> RLS
    RLS --> EdgeFunctions
    
    EdgeFunctions --> Workflows
    Workflows --> Validators
    Validators --> PostgreSQL
    
    EdgeFunctions --> Vault
    EdgeFunctions --> FileStorage
    EdgeFunctions --> AIProviders
    
    PostgreSQL --> Analytics
    EdgeFunctions --> Monitoring
```

---

## Key Features Summary

### 🔐 Security Features
- Row Level Security (RLS) policies on all tables
- API key encryption in Supabase Vault
- Comprehensive audit logging
- Rate limiting and cost controls

### 🤖 AI Integration
- Multi-provider AI support (OpenAI, Anthropic, Gemini, Perplexity)
- Secure API key management
- Usage tracking and cost monitoring
- Model-specific parameter handling

### 📊 Analytics & Monitoring
- Real-time progress tracking
- Performance metrics collection
- Error monitoring and alerting
- User behavior analytics

### 🏗️ Architecture Benefits
- Serverless edge functions for scalability
- Secure data handling with encryption
- Real-time updates via Supabase subscriptions
- Modular design for easy feature addition

---

*This document represents the complete system architecture as of the current implementation. All flows include proper error handling, security measures, and monitoring capabilities.*