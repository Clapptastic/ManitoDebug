# Competitor Analysis System Refactor Implementation Plan
**Date:** August 14, 2025  
**Scope:** Complete system refactor for maintainability, performance, and zero tech debt  
**Duration:** 5 Stages (8-10 weeks)  
**Team:** Frontend, Backend, DevOps Engineers

## Progress Tracking
- **Overall Progress**: 60% Complete
- **Current Stage**: Stage 3 - Edge Function Decomposition ✅ COMPLETE

**🚨 CRITICAL: This plan follows Manito.ai AI Coding Agents rules**
- **Incremental progress over big bangs** - Small, testable changes only
- **Single source of truth enforcement** - No alternative implementations
- **Preserve all existing functionality** - Zero feature loss during refactor
- **Test-driven development** - Every change must have tests
- **3-5 stage breakdown** - Clear deliverables and success criteria

## 🎯 Refactor Goals

1. **Zero Legacy Code:** Complete elimination of technical debt through consolidation
2. **Maintainable Architecture:** Single responsibility, clear separation of concerns
3. **Error-Free Operations:** Comprehensive error handling and testing
4. **High Performance:** Optimized for speed and scalability  
5. **Developer Experience:** Easy to understand and extend
6. **MANDATORY:** Preserve 100% of existing functionality during transition

## 📊 Current vs Target Architecture

<lov-mermaid>
graph TB
    subgraph "CURRENT ARCHITECTURE (PROBLEMATIC)"
        A1[User Input] --> B1[useCompetitorAnalysis Hook<br/>474 lines]
        B1 --> C1[competitorAnalysisService<br/>686 lines - TOO COMPLEX]
        C1 --> D1[competitor-analysis Edge Function<br/>1,751 lines - MONOLITHIC]
        D1 --> E1[Database Operations]
        
        F1[Type Definitions<br/>INCONSISTENT] -.-> B1
        F1 -.-> C1
        F1 -.-> D1
    end
    
    subgraph "TARGET ARCHITECTURE (CLEAN)"
        A2[User Input] --> B2[useCompetitorAnalysis Hook<br/>Simplified]
        B2 --> C2[Analysis Orchestrator<br/>Lightweight]
        
        C2 --> D2[Input Validator<br/>Edge Function]
        C2 --> E2[AI Provider Manager<br/>Edge Function]
        C2 --> F2[Results Aggregator<br/>Edge Function]
        C2 --> G2[Analysis Persister<br/>Edge Function]
        
        D2 --> H2[Database]
        E2 --> H2
        F2 --> H2
        G2 --> H2
        
        I2[Unified Type System<br/>Single Source] --> B2
        I2 --> C2
        I2 --> D2
        I2 --> E2
        I2 --> F2
        I2 --> G2
    end
</lov-mermaid>

## 🚨 **CRITICAL GAPS IDENTIFIED FROM AUDIT COMPARISON**

### **Missing High Priority Elements**
1. **🔐 Security & Vault Integration** - New edge functions must use Supabase Vault properly
2. **📊 Performance Metrics & Monitoring** - Specific performance targets and measurement strategy needed
3. **🔄 Real-time Progress Updates** - Progress subscription mechanism across decomposed functions
4. **⚡ Error Recovery & Circuit Breakers** - Centralized error recovery, retry logic, fallback mechanisms

### **Architecture Questions & RECOMMENDATIONS**

#### **✅ RECOMMENDATION 1: Edge Function Communication**
**Question:** How will decomposed edge functions communicate?
**Recommendation:** Use Supabase `functions.invoke()` with circuit breaker patterns
```typescript
// Standardized edge function communication pattern
const invokeWithCircuitBreaker = async (functionName: string, payload: any) => {
  return await circuitBreaker.execute(async () => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (error) throw new Error(`${functionName} failed: ${error.message}`);
    return data;
  });
};
```

#### **✅ RECOMMENDATION 2: State Management**
**Question:** Where will session state be stored during multi-step analysis?
**Recommendation:** Database-stored session state with memory caching for performance
- **Primary:** Supabase `analysis_session_state` table for persistence
- **Cache Layer:** Memory + localStorage for performance
- **Real-time:** Supabase subscriptions for progress updates

#### **✅ RECOMMENDATION 3: Rollback Strategy**
**Question:** What's the plan if Phase 2 breaks existing functionality?
**Recommendation:** Feature flags with automatic fallback to legacy system
- **Gradual Rollout:** 5% → 25% → 50% → 100% user adoption
- **Automatic Fallback:** If new system fails, immediately use legacy
- **Health Checks:** Continuous monitoring with automatic rollback triggers

#### **✅ RECOMMENDATION 4: Parallel Processing & Rate Limits**
**Question:** How to handle API rate limits across providers?
**Recommendation:** Provider-specific rate limiting with intelligent queuing
- **OpenAI:** Max 3 concurrent, 60/minute
- **Anthropic:** Max 2 concurrent, 30/minute  
- **Perplexity:** Max 2 concurrent, 20/minute
- **Queue Management:** Smart batching and retry logic

#### **✅ RECOMMENDATION 5: Caching Strategy**
**Question:** Where exactly will caching be implemented?
**Recommendation:** Multi-level caching architecture
- **L1 (Memory):** Hot data, 1-5 minute TTL
- **L2 (localStorage):** Session data, 30 minute TTL
- **L3 (Database):** Shared data, 1-24 hour TTL

#### **✅ RECOMMENDATION 6: Zero-Downtime Migration**
**Question:** How to ensure system keeps working during decomposition?
**Recommendation:** Blue-green deployment with feature flags
- **Feature Flags:** Control which functions are used
- **Health Monitoring:** Real-time system health checks
- **Instant Rollback:** Automatic fallback on any failure

#### **✅ RECOMMENDATION 7: Data Migration**
**Question:** Are database schema changes needed for new architecture?
**Recommendation:** Minimal schema additions, backward compatible
```sql
-- New tables needed for refactored architecture
CREATE TABLE analysis_session_state (
  session_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  state_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE edge_function_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

## 🗂️ **LEGACY CODE AUDIT & ARCHIVE STRATEGY**

### **🚨 CRITICAL LEGACY COMPONENTS TO ARCHIVE**

#### **1. Monolithic Edge Function (HIGHEST PRIORITY)**
**File:** `supabase/functions/competitor-analysis/index.ts` (1,751 lines)
**Status:** ⚠️ ACTIVE - Must be maintained during migration
**Archive Plan:**
- **Phase 2.3:** Rename to `competitor-analysis-legacy`
- **Phase 4.2:** Mark as deprecated with sunset date
- **Phase 5.2:** Archive after 100% migration to new system

#### **2. Legacy API Key Services**
**Files to Archive:**
- `src/services/api-keys/apiKeyManagementService.ts` ❌ DELETED (Good!)
- `src/services/api-keys/ApiKeyService.ts` ❌ DELETED (Good!)
- Any remaining non-Vault API key code

#### **3. Type Definition Chaos**
**Files with Competing Types:**
```typescript
// Files to consolidate/archive:
src/types/competitor-analysis.ts (backward compatibility aliases)
src/types/CompetitorAnalysisResult.ts (if exists)
src/types/SavedAnalysis.ts (if exists)
```
**Archive Strategy:** Consolidate into single source of truth, keep aliases temporarily

#### **4. Legacy UI Components**
**Components to Audit:**
- Duplicate analysis display components
- Old progress indicators
- Legacy form components
- Outdated data visualization components

#### **5. Legacy Service Layer**
**Current Service (686 lines):** `src/services/competitorAnalysisService.ts`
**Archive Plan:**
- **Phase 3.2:** Extract functionality into focused services
- **Phase 3.3:** Mark as deprecated
- **Phase 4.1:** Remove after new services proven stable

### **📁 ARCHIVE STRATEGY IMPLEMENTATION**

#### **Archive Directory Structure**
```
archive/
├── competitor-analysis-v1/
│   ├── edge-functions/
│   │   └── competitor-analysis-legacy.ts
│   ├── services/
│   │   └── competitorAnalysisService-v1.ts
│   ├── components/
│   │   └── legacy-ui-components/
│   ├── types/
│   │   └── legacy-type-definitions/
│   └── documentation/
│       ├── MIGRATION_LOG.md
│       └── LEGACY_API_REFERENCE.md
├── api-key-services-pre-vault/
└── ui-components-pre-design-system/
```

#### **Archive Process**
```typescript
// Archive management utility
export const ArchiveManager = {
  async archiveComponent(
    filePath: string, 
    archiveReason: string,
    replacementPath?: string
  ) {
    const timestamp = new Date().toISOString();
    const archivePath = `archive/${timestamp}-${path.basename(filePath)}`;
    
    // Move file to archive
    await fs.move(filePath, archivePath);
    
    // Create documentation
    await fs.writeFile(`${archivePath}.ARCHIVE_INFO.md`, `
# Archived Component
- **Original Path:** ${filePath}
- **Archived Date:** ${timestamp}
- **Reason:** ${archiveReason}
- **Replacement:** ${replacementPath || 'See implementation plan'}
- **Safe to Delete After:** ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()}
    `);
  }
};
```

## 🎨 **FRONTEND BEST PRACTICES INTEGRATION**

### **Design System Compliance**
#### **Task 2.3.1: Audit Current UI Components**
**Goal:** Ensure all competitor analysis UI uses design system tokens
```typescript
// Component audit checklist
const DesignSystemAudit = {
  // ❌ Bad: Direct color usage
  badExample: "bg-white text-black border-gray-300",
  
  // ✅ Good: Semantic tokens
  goodExample: "bg-background text-foreground border-border",
  
  // Components to audit:
  componentsToFix: [
    'CompetitorAnalysisDashboard',
    'AnalysisProgressIndicator', 
    'CompetitorCard',
    'ResultsVisualization',
    'ExportButton',
    'AnalysisFilters'
  ]
};
```

#### **Task 2.3.2: Responsive Design Verification**
```typescript
// Responsive design requirements
const ResponsiveRequirements = {
  breakpoints: {
    mobile: '480px',   // Single column, stack vertically
    tablet: '768px',   // Two columns, simplified layout
    desktop: '1024px', // Full layout with sidebar
    wide: '1440px'     // Multi-panel layout
  },
  
  criticalComponents: [
    'AnalysisDashboard',     // Must work on mobile
    'CompetitorComparison',  // Horizontal scroll on mobile
    'ProgressTracker',       // Compact mobile view
    'ResultsTable'           // Responsive data tables
  ]
};
```

### **Data Flow Architecture**
#### **Task 2.3.3: Implement Proper Data Flow**
```typescript
// Centralized data flow for competitor analysis
export const CompetitorAnalysisDataFlow = {
  // 1. Global State Management
  globalState: {
    provider: 'zustand', // For complex state
    structure: {
      currentAnalysis: 'AnalysisState',
      progress: 'ProgressState', 
      providers: 'ProviderState',
      cache: 'CacheState'
    }
  },
  
  // 2. Real-time Updates
  realtime: {
    progressUpdates: 'Supabase subscriptions',
    analysisCompletion: 'WebSocket notifications',
    errorNotifications: 'Toast system'
  },
  
  // 3. Error Boundaries
  errorHandling: {
    componentLevel: 'React Error Boundaries',
    serviceLevel: 'Try-catch with user feedback',
    globalLevel: 'Unhandled error capture'
  },
  
  // 4. Loading States
  loadingStates: {
    skeleton: 'Shimmer loading for cards',
    progress: 'Detailed progress indicators',
    fallback: 'Graceful degradation'
  }
};
```

### **Accessibility (A11y) Requirements**
#### **Task 2.3.4: Accessibility Compliance**
```typescript
// Accessibility checklist for competitor analysis
const A11yRequirements = {
  keyboardNavigation: {
    tabOrder: 'Logical tab sequence',
    shortcuts: 'Keyboard shortcuts for power users',
    focus: 'Visible focus indicators'
  },
  
  screenReader: {
    landmarks: 'Proper ARIA landmarks',
    labels: 'Descriptive button/input labels',
    announcements: 'Progress announcements'
  },
  
  visual: {
    contrast: 'WCAG AA contrast ratios',
    textSize: 'Scalable text up to 200%',
    colorBlind: 'Color-blind friendly charts'
  },
  
  criticalAreas: [
    'Analysis progress indicators',
    'Data visualization charts', 
    'Form inputs and validation',
    'Error messages and alerts'
  ]
};
```

### **Performance Optimization**
#### **Task 2.3.5: Frontend Performance**
```typescript
// Performance optimization strategy
const PerformanceStrategy = {
  codesplitting: {
    lazy: 'React.lazy for analysis components',
    chunks: 'Separate bundles for visualization',
    preload: 'Preload critical analysis routes'
  },
  
  dataOptimization: {
    virtualization: 'Virtual scrolling for large datasets',
    pagination: 'Infinite scroll for results',
    compression: 'Gzip analysis data'
  },
  
  renderOptimization: {
    memoization: 'React.memo for stable components',
    debouncing: 'Debounced search inputs', 
    throttling: 'Throttled progress updates'
  },
  
  metrics: {
    lcp: '<2.5s',        // Largest Contentful Paint
    fid: '<100ms',       // First Input Delay
    cls: '<0.1',         // Cumulative Layout Shift
    ttfb: '<600ms'       // Time to First Byte
  }
};
```

## 🗂️ **STAGE-BASED IMPLEMENTATION PLAN**
*Following Manito.ai AI Coding Agents Rules: 5 clear stages with testable deliverables*

## **STAGE 1: Foundation & Consolidation** (Week 1-2)
**Goal:** Establish single source of truth and eliminate type chaos
**Success Criteria:** 
- [ ] All competing type definitions consolidated into one authoritative file
- [ ] 100% TypeScript compilation with zero errors
- [ ] All existing functionality preserved and tested
- [ ] Vault integration verified for API key management

**Tests:** 
- Type safety validation suite passes
- All existing competitor analysis features work identically  
- API key retrieval from Vault functions correctly
- Performance baseline established

**Status:** Not Started

### **Task 1.1: MANDATORY Type System Consolidation**
**CRITICAL RULE:** Never create alternative implementations - consolidate existing ones

#### **Current State Analysis (Required Before Any Changes)**
```typescript
// STEP 1: Audit existing type definitions (MANDATORY)
const TypeAudit = {
  existingFiles: [
    'src/types/competitor-analysis/index.ts',
    'src/types/competitor-analysis.ts', 
    'src/types/CompetitorAnalysisResult.ts', // If exists
    'src/types/SavedAnalysis.ts' // If exists
  ],
  
  // MANDATORY: Identify the most complete implementation
  sourceOfTruth: 'TBD - Must be determined by analyzing existing code',
  
  // MANDATORY: Preserve ALL functionality from all files
  functionalityToPreserve: [], // Populated during audit
  
  // MANDATORY: Document what each file provides
  featureMap: {} // Populated during audit
};
```

#### **Implementation Steps (Test-Driven)**
```typescript
// STEP 1: Create comprehensive test for existing functionality
describe('Competitor Analysis Types - Functionality Preservation', () => {
  test('All existing interfaces work with current codebase', () => {
    // Test every existing type interface
    // Ensure backward compatibility
    // Verify no functionality loss
  });
  
  test('API key types work with Vault integration', () => {
    // Test Vault integration continues to work
    // Verify enhanced-api-key-manager compatibility
  });
});

// STEP 2: Consolidate types (ONLY after tests pass)
// RULE: Use existing patterns, don't invent new ones
export interface CompetitorAnalysisEntity {
  // MANDATORY: Include ALL fields from existing interfaces
  // STUDY existing codebase patterns first
  // PRESERVE all existing functionality
  
  // Identity (from existing patterns)
  id: string;
  user_id: string;
  organization_id?: string;
  
  // MANDATORY: Include ALL fields currently used in codebase
  // This list must be built by studying existing code
}
```

### **Task 1.2: Vault Integration Verification**
**RULE:** Study existing enhanced-api-key-manager patterns before any changes

```typescript
// STEP 1: Test current Vault integration (MANDATORY)
describe('Vault Integration Verification', () => {
  test('enhanced-api-key-manager works correctly', () => {
    // Verify current functionality before any changes
  });
  
  test('All providers retrieve keys from Vault', () => {
    // Test OpenAI, Anthropic, Perplexity key retrieval
  });
});

// STEP 2: Only if tests pass, document current patterns
const VaultIntegrationPattern = {
  // STUDY how current code calls enhanced-api-key-manager
  currentUsage: 'TBD - analyze existing code',
  
  // PRESERVE exact same calling patterns
  mandatoryPattern: `
    const { data, error } = await supabase.functions.invoke('enhanced-api-key-manager', {
      body: { action: 'get_api_key', provider: providerName }
    });
  `
};
```

### **Task 1.3: Performance Baseline Establishment**
**RULE:** Measure before changing anything

```typescript
// MANDATORY: Establish baseline before any refactoring
const PerformanceBaseline = {
  measurements: {
    analysisStartup: 'TBD - measure current system',
    apiKeyRetrieval: 'TBD - measure current system', 
    completionTime: 'TBD - measure current system'
  },
  
  // RULE: Never make changes without preserving performance
  targets: {
    analysisStartup: 'Must not exceed current + 10%',
    apiKeyRetrieval: 'Must not exceed current + 10%',
    completionTime: 'Must not exceed current + 10%'
  }
};
```

## **STAGE 2: Service Layer Consolidation** (Week 3-4)
**Goal:** Break down monolithic service while preserving all functionality
**Success Criteria:**
- [ ] competitorAnalysisService.ts (686 lines) split into focused services
- [ ] All 686 lines of functionality preserved in new structure
- [ ] Zero behavioral changes in UI - identical user experience
- [ ] All existing tests pass + new focused tests added

**Tests:**
- Every method in original service has equivalent functionality in new structure
- Integration tests pass with new service architecture
- Performance maintained or improved

**Status:** Not Started

### **Task 2.1: MANDATORY Service Functionality Audit**
**RULE:** Study existing code before making any changes

```typescript
// STEP 1: Audit current competitorAnalysisService.ts
const ServiceAudit = {
  // MANDATORY: Document every method and its functionality
  existingMethods: [], // Populated by analyzing current file
  
  // MANDATORY: Identify all dependencies
  dependencies: [], // Populated by analyzing imports
  
  // MANDATORY: Document all side effects  
  sideEffects: [], // Database calls, API calls, state changes
  
  // RULE: Must preserve ALL of these in new structure
  functionalityToPreserve: 'EVERYTHING - zero loss allowed'
};

// STEP 2: Create comprehensive test suite for existing service
describe('Competitor Analysis Service - Complete Functionality', () => {
  // MANDATORY: Test every single method
  // MANDATORY: Test every edge case
  // MANDATORY: Test every error condition
  // This MUST pass before any refactoring begins
});
```

### **Task 2.2: Service Decomposition (Following Single Responsibility)**
**RULE:** Composition over inheritance, study existing patterns

```typescript
// ONLY after audit and tests pass, decompose service
// RULE: Use existing project patterns for service creation

// AnalysisOrchestrator (lightweight coordination only)
export class AnalysisOrchestrator {
  // MANDATORY: Include all orchestration functionality from original
  // RULE: Study how other orchestrators work in this codebase
}

// ApiKeyManager (focused on API key operations)  
export class ApiKeyManager {
  // MANDATORY: Include all API key functionality from original
  // RULE: Use same patterns as enhanced-api-key-manager
}

// ProgressTracker (focused on progress management)
export class ProgressTracker {
  // MANDATORY: Include all progress functionality from original
  // RULE: Use same patterns as existing progress trackers
}
```

## **STAGE 3: Edge Function Decomposition** (Week 5-6)
**Goal:** Break down 1,751-line monolithic edge function while preserving functionality
**Success Criteria:**
- [ ] All 1,751 lines of functionality preserved across smaller functions
- [ ] No change in API contracts - existing calls work identically
- [ ] Feature flag system enables gradual rollout
- [ ] Automatic fallback to original function if any issues

**Tests:**
- Edge function integration tests pass
- API contracts unchanged
- End-to-end analysis workflow identical

**Status:** Not Started

### **Task 3.1: MANDATORY Edge Function Audit**
**RULE:** Study existing monolithic function before decomposition

```typescript
// STEP 1: Complete audit of competitor-analysis edge function
const EdgeFunctionAudit = {
  // MANDATORY: Map every line of functionality
  functionalBlocks: [], // Populated by analyzing 1,751 lines
  
  // MANDATORY: Identify all API contracts
  apiContracts: [], // Input/output specifications
  
  // MANDATORY: Document all dependencies
  dependencies: [], // External calls, database operations
  
  // RULE: ALL functionality must be preserved
  preservationPlan: 'Map each block to new function'
};
```

### **Task 3.2: Gradual Function Decomposition**
**RULE:** Feature flags for safe rollout, never break existing functionality

```typescript
// Create new functions alongside existing one
// RULE: Never remove original until 100% proven

const DecompositionStrategy = {
  // MANDATORY: Keep original function operational
  originalFunction: 'competitor-analysis (keep active)',
  
  // Create new functions with feature flags
  newFunctions: [
    'analysis-orchestrator',
    'validate-analysis-input', 
    'manage-ai-providers',
    'process-single-competitor',
    'aggregate-analysis-results',
    'persist-analysis-data'
  ],
  
  // RULE: Gradual rollout with automatic fallback
  rolloutPlan: {
    phase1: '5% of users',
    phase2: '25% of users',
    phase3: '50% of users', 
    phase4: '100% of users',
    fallback: 'Automatic revert to original on any error'
  }
};
```

## **STAGE 4: Frontend Consolidation & Testing** (Week 7)
**Goal:** Ensure UI works perfectly with new backend architecture
**Success Criteria:**
- [ ] All UI components work identically with new backend
- [ ] Design system compliance without functionality loss
- [ ] Accessibility standards met
- [ ] Comprehensive test coverage > 90%

**Tests:**
- End-to-end user workflow tests
- Visual regression tests  
- Accessibility compliance tests
- Performance tests

**Status:** Not Started

### **Task 4.1: UI Component Audit and Preservation**
**RULE:** Study existing UI patterns, preserve all functionality

```typescript
// MANDATORY: Audit all competitor analysis UI components
const UIAudit = {
  // MANDATORY: Document every component and its functionality
  existingComponents: [], // Populated by codebase analysis
  
  // MANDATORY: Test current UI behavior
  currentBehavior: [], // What each component does now
  
  // RULE: Preserve identical behavior in new system
  behaviorPreservation: 'Every interaction must work identically'
};
```

## **STAGE 5: Production Deployment & Legacy Cleanup** (Week 8)
**Goal:** Safe production deployment with legacy system retirement
**Success Criteria:**
- [ ] 100% user migration to new system
- [ ] Legacy components safely archived (not deleted)
- [ ] Performance targets met or exceeded
- [ ] Zero user-facing issues

**Tests:**
- Production monitoring passes
- User acceptance testing complete
- Performance benchmarks met

**Status:** Not Started

### **Task 5.1: Safe Legacy Retirement**
**RULE:** Archive, don't delete - enable rollback if needed

```typescript
const LegacyRetirement = {
  // RULE: Never delete, always archive with restoration capability
  archiveStrategy: {
    'competitor-analysis edge function': 'Rename to competitor-analysis-legacy',
    'competitorAnalysisService.ts': 'Move to archive/ with full history',
    'legacy type definitions': 'Archive with backward compatibility'
  },
  
  // MANDATORY: Keep restoration capability for 90 days
  rollbackCapability: '90-day restoration window',
  
  // RULE: Document everything for future reference
  documentation: 'Complete migration log and restoration procedures'
};
```

### **Task 0.5.1: Comprehensive Integration Testing**
**Goal:** Establish bulletproof baseline before any changes
```typescript
// Create comprehensive test suite for current system
describe('Current Competitor Analysis System Baseline', () => {
  test('Complete analysis flow end-to-end', async () => {
    // Test full flow: start → progress → completion → export
  });
  
  test('Real-time progress updates work correctly', async () => {
    // Verify Supabase subscriptions function properly
  });
  
  test('API key retrieval from Vault works', async () => {
    // Ensure enhanced-api-key-manager integration is solid
  });
  
  test('Performance benchmarks - current system', async () => {
    // Measure: startup time, API key retrieval time, analysis completion
  });
});
```

### **Task 0.5.2: Feature Flags Implementation**
**File:** `src/services/feature-flags/competitorAnalysisFlags.ts`
```typescript
export const COMPETITOR_ANALYSIS_FLAGS = {
  USE_NEW_ORCHESTRATOR: 'use_new_orchestrator',
  USE_NEW_VALIDATOR: 'use_new_validator',
  USE_NEW_PROVIDER_MANAGER: 'use_new_provider_manager',
  USE_NEW_PROCESSOR: 'use_new_processor',
  USE_NEW_AGGREGATOR: 'use_new_aggregator',
  USE_NEW_PERSISTER: 'use_new_persister'
} as const;

export const useCompetitorAnalysisFlags = () => {
  // Implementation for gradual rollout
};
```

### **Task 0.5.3: Performance Monitoring Setup**
**File:** `src/services/monitoring/performanceTracker.ts`
```typescript
export interface PerformanceMetrics {
  startupTime: number;
  apiKeyRetrievalTime: number;
  analysisCompletionTime: number;
  memoryUsage: number;
  errorRate: number;
}

export const trackCompetitorAnalysisPerformance = async (
  operation: string,
  startTime: number,
  metadata?: Record<string, unknown>
): Promise<void> => {
  // SLA targets from audit:
  // - Analysis startup: <1s (currently 2-3s)
  // - API key retrieval: <500ms (currently ~500ms)
  // - Overall completion: significant improvement needed
};
```

## **PHASE 1: Foundation & Type System** (Week 1-2)

### **Sprint 1.1: Type System Unification** (Days 1-3)

#### **Task 1.1.1: Create Unified Type System**
**File:** `src/types/competitor-analysis/index.ts`

**Line-by-line implementation:**

```typescript
// Line 1-15: Core entity interface
export interface CompetitorEntity {
  // Identity
  id: string;
  user_id: string;
  organization_id?: string;
  
  // Core data
  name: string;
  description?: string;
  status: AnalysisStatus;
  
  // Timestamps (required)
  created_at: string;
  updated_at: string;
}

// Line 16-35: Analysis-specific data
export interface CompetitorAnalysis extends CompetitorEntity {
  // Analysis identifiers
  analysis_id: string;
  session_id: string;
  
  // Company information
  website_url?: string;
  industry?: string;
  headquarters?: string;
  founded_year?: number;
  employee_count?: number;
  
  // Analysis results
  analysis_data?: AnalysisData;
  confidence_scores?: ConfidenceScores;
  completed_at?: string;
}

// Line 36-50: Saved analysis with persistence metadata
export interface SavedAnalysis extends CompetitorAnalysis {
  // Required persistence fields
  completed_at: string;
  data_quality_score: number;
  
  // Optional display data for UI
  displayName?: string;
  tags?: string[];
  notes?: string;
}

// Line 51-65: Analysis data structure
export interface AnalysisData {
  // SWOT Analysis
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  
  // Market data
  market_position?: string;
  competitive_advantages: string[];
  revenue_estimate?: number;
  
  // Meta information
  source_citations: SourceCitation[];
  analysis_confidence: number;
}

// Line 66-75: Supporting types
export interface SourceCitation {
  field: string;
  source: string;
  url?: string;
  confidence: number;
  retrieved_at: string;
}

export interface ConfidenceScores {
  overall: number;
  financial: number;
  market: number;
  competitive: number;
}

// Line 76-85: Enums for consistency
export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Line 86-95: Request/Response types
export interface AnalysisRequest {
  competitors: string[];
  providers: string[];
  options?: AnalysisOptions;
}

export interface AnalysisOptions {
  focus_areas?: string[];
  include_financial?: boolean;
  include_technical?: boolean;
  max_depth?: 'basic' | 'standard' | 'comprehensive';
}

// Line 96-105: Progress tracking
export interface AnalysisProgress {
  session_id: string;
  status: AnalysisStatus;
  current_competitor: string | null;
  completed_count: number;
  total_count: number;
  progress_percentage: number;
  estimated_completion?: string;
}
```

#### **Task 1.1.2: Remove Legacy Type Aliases**
**Files to modify:**
- `src/types/competitor-analysis.ts` (delete backward compatibility aliases)
- Update all import statements across 25+ files

**Action plan:**
1. Delete lines 242-244 in existing type file (the aliases)
2. Run global find/replace:
   - `CompetitorAnalysisResult` → `CompetitorAnalysis`
   - `CompetitorData` → `CompetitorAnalysis`
3. Fix any remaining TypeScript errors

#### **Task 1.1.3: Update Service Interfaces**
**File:** `src/services/types/service-interfaces.ts`

```typescript
// Line 1-20: Service response types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata?: ResponseMetadata;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ResponseMetadata {
  request_id: string;
  timestamp: string;
  execution_time_ms: number;
  cached?: boolean;
}

// Line 21-35: Analysis service interfaces
export interface AnalysisServiceInterface {
  startAnalysis(request: AnalysisRequest): Promise<ServiceResponse<AnalysisProgress>>;
  getAnalysis(id: string): Promise<ServiceResponse<CompetitorAnalysis>>;
  saveAnalysis(analysis: Partial<CompetitorAnalysis>): Promise<ServiceResponse<SavedAnalysis>>;
  deleteAnalysis(id: string): Promise<ServiceResponse<void>>;
}

export interface ProgressServiceInterface {
  trackProgress(session_id: string): Promise<ServiceResponse<AnalysisProgress>>;
  updateProgress(session_id: string, update: Partial<AnalysisProgress>): Promise<ServiceResponse<void>>;
  subscribeToProgress(session_id: string, callback: (progress: AnalysisProgress) => void): () => void;
}
```

### **Sprint 1.2: Critical Vault Integration** (Days 4-5)

#### **Task 1.2.1: Vault Integration Verification**
**Priority:** CRITICAL - Must address before proceeding
**Files:** All new edge functions must use Vault properly

```typescript
// Template for all new edge functions
import { supabase } from '../_shared/supabase.ts';

const getApiKeyFromVault = async (provider: string): Promise<string> => {
  // CRITICAL: Must use enhanced-api-key-manager
  const { data, error } = await supabase.functions.invoke('enhanced-api-key-manager', {
    body: {
      action: 'get_api_key',
      provider: provider
    }
  });
  
  if (error || !data?.success) {
    throw new Error(`Failed to retrieve ${provider} API key from Vault`);
  }
  
  return data.api_key;
};
```

#### **Task 1.2.2: Performance SLA Definition**
**Goal:** Establish concrete performance targets
```typescript
// Performance targets based on audit findings
export const PERFORMANCE_SLAS = {
  // Current: 2-3s → Target: <1s
  ANALYSIS_STARTUP_TIME_MS: 1000,
  
  // Current: ~500ms → Target: <500ms
  API_KEY_RETRIEVAL_TIME_MS: 500,
  
  // New targets for decomposed functions
  EDGE_FUNCTION_RESPONSE_TIME_MS: 200,
  PARALLEL_PROCESSING_EFFICIENCY: 0.8, // 80% parallel vs sequential
  
  // Error rates
  MAX_ERROR_RATE_PERCENT: 1.0,
  MAX_TIMEOUT_RATE_PERCENT: 0.5
} as const;
```

#### **Task 1.2.3: Real-time Progress Architecture**
**Goal:** Ensure progress updates work across decomposed functions
```typescript
// Progress tracking across multiple edge functions
export interface DistributedProgressTracker {
  sessionId: string;
  totalSteps: number;
  currentStep: number;
  stepDetails: {
    validation: ProgressStep;
    providerCheck: ProgressStep;
    processing: ProgressStep;
    aggregation: ProgressStep;
    persistence: ProgressStep;
  };
}

interface ProgressStep {
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  metadata?: Record<string, unknown>;
}
```

### **Sprint 1.3: Edge Function Decomposition Plan** (Days 6-7)

#### **Task 1.3.1: Design Microservice Architecture**

<lov-mermaid>
graph TD
    A[Client Request] --> B{Analysis Orchestrator}
    
    B --> C[Input Validator]
    B --> D[Provider Manager] 
    B --> E[Analysis Processor]
    B --> F[Results Aggregator]
    B --> G[Data Persister]
    
    C --> H[(Validation Cache)]
    D --> I[(API Key Vault)]
    E --> J[(AI Providers)]
    F --> K[(Analysis Database)]
    G --> K
    
    subgraph "Edge Functions"
        C
        D
        E
        F
        G
    end
    
    subgraph "External Services"
        J
        I
    end
    
    subgraph "Storage"
        H
        K
    end
</lov-mermaid>

#### **Task 1.3.2: Create Edge Function Structure**

**Directory structure to create:**
```
supabase/functions/
├── analysis-orchestrator/
│   ├── index.ts (150 lines max)
│   └── config.toml
├── validate-analysis-input/
│   ├── index.ts (100 lines max)
│   └── config.toml
├── manage-ai-providers/
│   ├── index.ts (200 lines max)
│   └── config.toml
├── process-single-competitor/
│   ├── index.ts (300 lines max)
│   └── config.toml
├── aggregate-analysis-results/
│   ├── index.ts (150 lines max)
│   └── config.toml
└── persist-analysis-data/
    ├── index.ts (100 lines max)
    └── config.toml
```

## **PHASE 2: Edge Function Decomposition & Error Recovery** (Week 3-4)

### **Sprint 2.1: Create Core Edge Functions with Error Recovery** (Days 1-4)

#### **Task 2.1.1: Analysis Orchestrator with Circuit Breakers**
**File:** `supabase/functions/analysis-orchestrator/index.ts`

```typescript
// Line 1-20: Imports and setup
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { validateRequest } from '../_shared/validation.ts';
import { logPerformance } from '../_shared/monitoring.ts';

interface OrchestrationRequest {
  sessionId: string;
  competitors: string[];
  providers: string[];
  options?: AnalysisOptions;
}

// Line 21-50: Main orchestrator logic
serve(async (req) => {
  const startTime = Date.now();
  
  try {
    // CORS handling
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Authentication & validation
    const supabase = createClient(/* ... */);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const request: OrchestrationRequest = await req.json();
    await validateRequest(request);
    
    // CRITICAL: Circuit breaker pattern for resilience
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      timeout: 10000,
      resetTimeout: 30000
    });
    
    // Step 1: Validate input with error recovery
    const validationResult = await circuitBreaker.execute(async () => {
      return await supabase.functions.invoke('validate-analysis-input', {
        body: { sessionId: request.sessionId, competitors: request.competitors }
      });
    });
    
    if (!validationResult.data?.valid) {
      throw new Error(`Validation failed: ${validationResult.data?.error}`);
    }
    
    // Step 2: Check provider availability with Vault integration
    const providerResult = await circuitBreaker.execute(async () => {
      return await supabase.functions.invoke('manage-ai-providers', {
        body: { 
          action: 'check_availability', 
          providers: request.providers,
          useVault: true // CRITICAL: Ensure Vault usage
        }
      });
    });
    
    // Step 3: Process competitors in parallel
    const processingPromises = request.competitors.map(async (competitor, index) => {
      return supabase.functions.invoke('process-single-competitor', {
        body: {
          sessionId: request.sessionId,
          competitor,
          providers: providerResult.data?.available_providers || [],
          sequence: index
        }
      });
    });
    
    const processingResults = await Promise.allSettled(processingPromises);
    
    // Step 4: Aggregate results
    const aggregationResult = await supabase.functions.invoke('aggregate-analysis-results', {
      body: { 
        sessionId: request.sessionId, 
        results: processingResults.map(r => r.status === 'fulfilled' ? r.value.data : null).filter(Boolean)
      }
    });
    
    // Step 5: Persist final analysis
    const persistResult = await supabase.functions.invoke('persist-analysis-data', {
      body: {
        sessionId: request.sessionId,
        aggregatedData: aggregationResult.data,
        userId: user.id
      }
    });
    
    await logPerformance('analysis-orchestration', Date.now() - startTime, {
      competitorsCount: request.competitors.length,
      providersCount: request.providers.length,
      success: true
    });
    
    return new Response(JSON.stringify({
      success: true,
      sessionId: request.sessionId,
      analysisId: persistResult.data?.analysisId,
      competitorsProcessed: request.competitors.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    await logPerformance('analysis-orchestration', Date.now() - startTime, {
      success: false,
      error: error.message
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

#### **Task 2.1.2: Input Validator Function**
**File:** `supabase/functions/validate-analysis-input/index.ts`

```typescript
// Line 1-15: Setup and types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

interface ValidationRequest {
  sessionId: string;
  competitors: string[];
  options?: Record<string, unknown>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: ValidationRequest;
}

// Line 16-50: Validation logic
serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const request: ValidationRequest = await req.json();
    const errors: string[] = [];
    
    // Validate session ID
    if (!request.sessionId || typeof request.sessionId !== 'string') {
      errors.push('Invalid session ID');
    }
    
    // Validate competitors array
    if (!Array.isArray(request.competitors)) {
      errors.push('Competitors must be an array');
    } else if (request.competitors.length === 0) {
      errors.push('At least one competitor is required');
    } else if (request.competitors.length > 10) {
      errors.push('Maximum 10 competitors allowed');
    }
    
    // Validate competitor names
    const sanitizedCompetitors = request.competitors
      .filter(c => typeof c === 'string' && c.trim().length > 0)
      .map(c => c.trim().substring(0, 100)) // Limit length
      .slice(0, 10); // Ensure max limit
    
    if (sanitizedCompetitors.length !== request.competitors.length) {
      errors.push('Some competitor names were invalid and removed');
    }
    
    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? {
        ...request,
        competitors: sanitizedCompetitors
      } : undefined
    };
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      valid: false,
      errors: [`Validation error: ${error.message}`]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

#### **Task 2.1.3: AI Provider Manager**
**File:** `supabase/functions/manage-ai-providers/index.ts`

```typescript
// Line 1-20: Setup and interfaces
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ProviderRequest {
  action: 'check_availability' | 'get_keys' | 'validate_keys';
  providers: string[];
}

interface ProviderStatus {
  provider: string;
  available: boolean;
  key_configured: boolean;
  key_valid?: boolean;
  error?: string;
}

// Line 21-80: Provider management logic
serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const supabase = createClient(/* ... */);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const request: ProviderRequest = await req.json();
    
    switch (request.action) {
      case 'check_availability': {
        const statuses: ProviderStatus[] = [];
        
        for (const provider of request.providers) {
          try {
            // Use enhanced-api-key-manager to check each provider
            const { data: keyData } = await supabase.functions.invoke('enhanced-api-key-manager', {
              body: { action: 'get_all_statuses' }
            });
            
            const providerKey = keyData?.result?.find((k: any) => 
              k.provider === provider && k.is_active && k.status === 'active'
            );
            
            statuses.push({
              provider,
              available: !!providerKey,
              key_configured: !!providerKey,
              key_valid: providerKey?.status === 'active'
            });
            
          } catch (error) {
            statuses.push({
              provider,
              available: false,
              key_configured: false,
              error: error.message
            });
          }
        }
        
        const availableProviders = statuses
          .filter(s => s.available)
          .map(s => s.provider);
        
        return new Response(JSON.stringify({
          success: true,
          provider_statuses: statuses,
          available_providers: availableProviders,
          has_minimum_providers: availableProviders.length >= 1
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      case 'get_keys': {
        const keys: Record<string, string> = {};
        
        for (const provider of request.providers) {
          try {
            const { data: keyData } = await supabase.functions.invoke('enhanced-api-key-manager', {
              body: { action: 'decrypt', provider }
            });
            
            if (keyData?.result?.apiKey) {
              keys[provider] = keyData.result.apiKey;
            }
          } catch (error) {
            console.warn(`Failed to get key for ${provider}:`, error);
          }
        }
        
        return new Response(JSON.stringify({
          success: true,
          keys,
          providers_with_keys: Object.keys(keys)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### **Sprint 2.2: Single Competitor Processor** (Days 5-7)

#### **Task 2.2.1: Competitor Analysis Processor**
**File:** `supabase/functions/process-single-competitor/index.ts`

```typescript
// Line 1-25: Setup and types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { analyzeWithOpenAI } from '../_shared/providers/openai.ts';
import { analyzeWithAnthropic } from '../_shared/providers/anthropic.ts';
import { analyzeWithPerplexity } from '../_shared/providers/perplexity.ts';

interface ProcessingRequest {
  sessionId: string;
  competitor: string;
  providers: string[];
  sequence: number;
}

interface ProviderResult {
  provider: string;
  success: boolean;
  data?: any;
  error?: string;
  execution_time_ms: number;
}

// Line 26-100: Processing logic
serve(async (req) => {
  const startTime = Date.now();
  
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const supabase = createClient(/* ... */);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const request: ProcessingRequest = await req.json();
    
    // Update progress for this competitor
    await supabase.rpc('update_competitor_analysis_progress', {
      session_id_param: request.sessionId,
      current_competitor_param: request.competitor,
      progress_percentage_param: Math.round((request.sequence / 10) * 90) // Estimate
    });
    
    // Get API keys for selected providers
    const { data: keyData } = await supabase.functions.invoke('manage-ai-providers', {
      body: { action: 'get_keys', providers: request.providers }
    });
    
    if (!keyData?.keys) {
      throw new Error('No API keys available');
    }
    
    // Process with each provider in parallel
    const providerPromises = request.providers.map(async (provider): Promise<ProviderResult> => {
      const providerStartTime = Date.now();
      
      try {
        const apiKey = keyData.keys[provider];
        if (!apiKey) {
          return {
            provider,
            success: false,
            error: 'API key not available',
            execution_time_ms: Date.now() - providerStartTime
          };
        }
        
        let result;
        switch (provider) {
          case 'openai':
            result = await analyzeWithOpenAI(request.competitor, apiKey);
            break;
          case 'anthropic':
            result = await analyzeWithAnthropic(request.competitor, apiKey);
            break;
          case 'perplexity':
            result = await analyzeWithPerplexity(request.competitor, apiKey);
            break;
          default:
            throw new Error(`Unsupported provider: ${provider}`);
        }
        
        return {
          provider,
          success: true,
          data: result,
          execution_time_ms: Date.now() - providerStartTime
        };
        
      } catch (error) {
        return {
          provider,
          success: false,
          error: error.message,
          execution_time_ms: Date.now() - providerStartTime
        };
      }
    });
    
    const providerResults = await Promise.allSettled(providerPromises);
    
    // Extract successful results
    const successfulResults = providerResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(r => r.success);
    
    if (successfulResults.length === 0) {
      throw new Error('All providers failed to analyze competitor');
    }
    
    // Log performance metrics
    for (const result of successfulResults) {
      await supabase.from('api_usage_costs').insert({
        user_id: user.id,
        provider: result.provider,
        service: 'competitor_analysis',
        tokens_used: 1000, // Estimate
        cost_usd: 0.02, // Estimate
        success: true,
        response_time_ms: result.execution_time_ms,
        metadata: { competitor: request.competitor, session_id: request.sessionId }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      competitor: request.competitor,
      sessionId: request.sessionId,
      sequence: request.sequence,
      provider_results: successfulResults,
      execution_time_ms: Date.now() - startTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      competitor: request.competitor,
      sessionId: request.sessionId,
      error: error.message,
      execution_time_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### **Sprint 2.2: Performance Benchmarking & Monitoring** (Days 5-7)

#### **Task 2.2.1: Performance Testing Framework**
**Goal:** Implement automated performance regression testing
```typescript
// Performance test suite for new architecture
describe('Performance Regression Tests', () => {
  test('Analysis startup time must be <1s', async () => {
    const startTime = Date.now();
    await startCompetitorAnalysis(['Company1', 'Company2']);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(PERFORMANCE_SLAS.ANALYSIS_STARTUP_TIME_MS);
  });
  
  test('API key retrieval must be <500ms', async () => {
    const startTime = Date.now();
    await getApiKeyFromVault('openai');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(PERFORMANCE_SLAS.API_KEY_RETRIEVAL_TIME_MS);
  });
  
  test('Parallel processing efficiency target', async () => {
    const competitors = ['A', 'B', 'C', 'D', 'E'];
    
    // Measure sequential processing time
    const sequentialStart = Date.now();
    for (const competitor of competitors) {
      await processCompetitorSequential(competitor);
    }
    const sequentialTime = Date.now() - sequentialStart;
    
    // Measure parallel processing time
    const parallelStart = Date.now();
    await Promise.all(competitors.map(processCompetitorParallel));
    const parallelTime = Date.now() - parallelStart;
    
    const efficiency = 1 - (parallelTime / sequentialTime);
    expect(efficiency).toBeGreaterThan(PERFORMANCE_SLAS.PARALLEL_PROCESSING_EFFICIENCY);
  });
});
```

#### **Task 2.2.2: Real-time Monitoring Dashboard**
**Goal:** Track performance metrics in production
```typescript
// Real-time performance monitoring
export const PerformanceMonitor = {
  trackEdgeFunctionPerformance: async (
    functionName: string, 
    executionTime: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ) => {
    await supabase.from('performance_logs').insert({
      operation_name: `edge_function_${functionName}`,
      execution_time_ms: executionTime,
      user_id: auth.uid(),
      component: 'competitor_analysis',
      status: success ? 'success' : 'failed',
      metadata: {
        ...metadata,
        sla_target: PERFORMANCE_SLAS.EDGE_FUNCTION_RESPONSE_TIME_MS,
        meets_sla: executionTime < PERFORMANCE_SLAS.EDGE_FUNCTION_RESPONSE_TIME_MS
      }
    });
  }
};
```

#### **Task 2.2.3: Zero-Downtime Migration Strategy**
**Goal:** Ensure system continues working during refactor
```typescript
// Feature flag controlled migration
export const useMigrationController = () => {
  const [flags] = useFeatureFlags();
  
  const getAnalysisFunction = () => {
    if (flags[COMPETITOR_ANALYSIS_FLAGS.USE_NEW_ORCHESTRATOR]) {
      return 'analysis-orchestrator'; // New decomposed function
    }
    return 'competitor-analysis'; // Current monolithic function
  };
  
  const startAnalysis = async (request: AnalysisRequest) => {
    const functionName = getAnalysisFunction();
    
    try {
      return await supabase.functions.invoke(functionName, { body: request });
    } catch (error) {
      // Automatic fallback to old system if new system fails
      if (functionName === 'analysis-orchestrator') {
        console.warn('New system failed, falling back to legacy system');
        return await supabase.functions.invoke('competitor-analysis', { body: request });
      }
      throw error;
    }
  };
};
```

#### **Task 2.2.4: API Rate Limiting & Circuit Breaker Implementation**
**Goal:** Handle API rate limits across providers in parallel processing
```typescript
// Sophisticated rate limiting for parallel API calls
export class ProviderRateLimiter {
  private rateLimits = new Map<string, {
    maxConcurrent: number;
    perMinute: number;
    currentRequests: number;
    requestTimes: number[];
  }>();

  constructor() {
    // Initialize rate limits per provider
    this.rateLimits.set('openai', {
      maxConcurrent: 3,
      perMinute: 60,
      currentRequests: 0,
      requestTimes: []
    });
    
    this.rateLimits.set('anthropic', {
      maxConcurrent: 2,
      perMinute: 30,
      currentRequests: 0,
      requestTimes: []
    });
  }

  async executeWithRateLimit<T>(
    provider: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const limits = this.rateLimits.get(provider);
    if (!limits) throw new Error(`Unknown provider: ${provider}`);

    // Wait for available slot
    await this.waitForSlot(provider);
    
    try {
      limits.currentRequests++;
      limits.requestTimes.push(Date.now());
      
      return await operation();
    } finally {
      limits.currentRequests--;
      
      // Clean up old request times
      const oneMinuteAgo = Date.now() - 60000;
      limits.requestTimes = limits.requestTimes.filter(time => time > oneMinuteAgo);
    }
  }

  private async waitForSlot(provider: string): Promise<void> {
    const limits = this.rateLimits.get(provider)!;
    
    while (
      limits.currentRequests >= limits.maxConcurrent ||
      limits.requestTimes.length >= limits.perMinute
    ) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clean up old request times
      const oneMinuteAgo = Date.now() - 60000;
      limits.requestTimes = limits.requestTimes.filter(time => time > oneMinuteAgo);
    }
  }
}
```

## **PHASE 3: Caching Strategy & Service Layer Refactor** (Week 5-6)

### **Sprint 3.1: Caching Strategy Implementation** (Days 1-3)

#### **Task 3.1.1: Multi-Level Caching Architecture**
**Goal:** Address "No caching layer" gap identified in audit
```typescript
// Comprehensive caching strategy for competitor analysis
export class CompetitorAnalysisCache {
  private readonly CACHE_KEYS = {
    API_KEY: 'api_key',
    COMPETITOR_BASIC_INFO: 'competitor_basic',
    ANALYSIS_RESULTS: 'analysis_results',
    PROVIDER_STATUS: 'provider_status'
  } as const;

  // Level 1: Memory cache (fastest)
  private memoryCache = new Map<string, { data: any; expires: number }>();
  
  // Level 2: Browser localStorage (persistent across sessions)
  private storageCache = window.localStorage;
  
  // Level 3: Supabase database cache (shared across devices)
  private dbCache = supabase;

  async get<T>(
    cacheType: keyof typeof this.CACHE_KEYS,
    key: string,
    fallbackFn: () => Promise<T>,
    ttlMinutes: number = 60
  ): Promise<T> {
    const cacheKey = `${cacheType}_${key}`;
    
    // Try memory cache first
    const memoryData = this.memoryCache.get(cacheKey);
    if (memoryData && memoryData.expires > Date.now()) {
      return memoryData.data;
    }
    
    // Try localStorage cache
    try {
      const storageData = this.storageCache.getItem(cacheKey);
      if (storageData) {
        const parsed = JSON.parse(storageData);
        if (parsed.expires > Date.now()) {
          // Update memory cache
          this.memoryCache.set(cacheKey, parsed);
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Storage cache error:', error);
    }
    
    // Fallback to function execution
    const freshData = await fallbackFn();
    const expires = Date.now() + (ttlMinutes * 60 * 1000);
    
    // Cache at all levels
    this.set(cacheKey, freshData, expires);
    
    return freshData;
  }

  private set(key: string, data: any, expires: number): void {
    const cacheEntry = { data, expires };
    
    // Memory cache
    this.memoryCache.set(key, cacheEntry);
    
    // Storage cache
    try {
      this.storageCache.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Storage cache write error:', error);
    }
  }

  invalidate(cacheType: keyof typeof this.CACHE_KEYS, key?: string): void {
    if (key) {
      const cacheKey = `${cacheType}_${key}`;
      this.memoryCache.delete(cacheKey);
      this.storageCache.removeItem(cacheKey);
    } else {
      // Clear all of this cache type
      const prefix = `${cacheType}_`;
      
      // Clear memory cache
      for (const [k] of this.memoryCache) {
        if (k.startsWith(prefix)) {
          this.memoryCache.delete(k);
        }
      }
      
      // Clear storage cache
      for (let i = this.storageCache.length - 1; i >= 0; i--) {
        const key = this.storageCache.key(i);
        if (key?.startsWith(prefix)) {
          this.storageCache.removeItem(key);
        }
      }
    }
  }
}
```

#### **Task 3.1.2: Cached API Key Management**
**Goal:** Cache API key retrieval to meet <500ms SLA
```typescript
// Cached API key retrieval with Vault integration
export class CachedApiKeyManager {
  private cache = new CompetitorAnalysisCache();
  
  async getApiKey(provider: string): Promise<string> {
    return await this.cache.get(
      'API_KEY',
      provider,
      async () => {
        // Fallback to Vault - this is the slow operation we're caching
        const { data, error } = await supabase.functions.invoke('enhanced-api-key-manager', {
          body: { action: 'get_api_key', provider }
        });
        
        if (error || !data?.success) {
          throw new Error(`Failed to retrieve ${provider} API key`);
        }
        
        return data.api_key;
      },
      30 // Cache for 30 minutes
    );
  }
  
  async getAllProviderStatuses(): Promise<Record<string, any>> {
    return await this.cache.get(
      'PROVIDER_STATUS',
      'all',
      async () => {
        const { data, error } = await supabase.functions.invoke('enhanced-api-key-manager', {
          body: { action: 'get_all_statuses' }
        });
        
        if (error) throw new Error('Failed to get provider statuses');
        return data;
      },
      15 // Cache for 15 minutes
    );
  }
  
  invalidateProvider(provider: string): void {
    this.cache.invalidate('API_KEY', provider);
    this.cache.invalidate('PROVIDER_STATUS', 'all');
  }
}
```

#### **Task 3.1.3: Session State Management**
**Goal:** Define where session state is stored during multi-step analysis
```typescript
// Centralized session state management for distributed edge functions
export interface AnalysisSessionState {
  sessionId: string;
  userId: string;
  competitors: string[];
  providers: string[];
  
  // Current progress
  currentStep: 'validation' | 'provider_check' | 'processing' | 'aggregation' | 'persistence';
  completedSteps: string[];
  
  // Intermediate results storage
  validationResult?: ValidationResult;
  providerCheckResult?: ProviderCheckResult;
  processingResults?: Map<string, CompetitorAnalysisResult>;
  
  // Timing and performance
  startTime: number;
  stepTimes: Record<string, { start: number; end?: number }>;
  
  // Error recovery
  retryCount: number;
  lastError?: string;
  fallbackUsed: boolean;
}

export class AnalysisSessionManager {
  // Store session state in database for persistence across edge functions
  async saveSessionState(state: AnalysisSessionState): Promise<void> {
    await supabase.from('analysis_session_state').upsert({
      session_id: state.sessionId,
      user_id: state.userId,
      state_data: state,
      updated_at: new Date().toISOString()
    });
  }
  
  async getSessionState(sessionId: string): Promise<AnalysisSessionState | null> {
    const { data, error } = await supabase
      .from('analysis_session_state')
      .select('state_data')
      .eq('session_id', sessionId)
      .single();
    
    if (error || !data) return null;
    return data.state_data as AnalysisSessionState;
  }
  
  async updateSessionStep(
    sessionId: string, 
    step: AnalysisSessionState['currentStep'],
    stepResult?: any
  ): Promise<void> {
    const state = await this.getSessionState(sessionId);
    if (!state) throw new Error(`Session ${sessionId} not found`);
    
    // Update step timing
    if (state.stepTimes[step]?.start && !state.stepTimes[step]?.end) {
      state.stepTimes[step].end = Date.now();
    }
    
    // Update current step
    state.completedSteps.push(step);
    
    // Store step result based on step type
    switch (step) {
      case 'validation':
        state.validationResult = stepResult;
        break;
      case 'provider_check':
        state.providerCheckResult = stepResult;
        break;
      case 'processing':
        if (!state.processingResults) state.processingResults = new Map();
        state.processingResults.set(stepResult.competitor, stepResult);
        break;
    }
    
    await this.saveSessionState(state);
  }
  
  async cleanupSession(sessionId: string): Promise<void> {
    await supabase
      .from('analysis_session_state')
      .delete()
      .eq('session_id', sessionId);
  }
}
```

### **Sprint 3.2: Service Decomposition** (Days 4-6)

#### **Task 3.1.1: Analysis Orchestrator Service**
**File:** `src/services/analysis/AnalysisOrchestrator.ts`

```typescript
// Line 1-15: Imports and interface
import { supabase } from '@/integrations/supabase/client';
import { ServiceResponse, AnalysisRequest, AnalysisProgress } from '../types/service-interfaces';
import { ErrorHandler } from '../shared/ErrorHandler';
import { PerformanceMonitor } from '../shared/PerformanceMonitor';

export class AnalysisOrchestrator {
  private errorHandler = new ErrorHandler();
  private monitor = new PerformanceMonitor();

  // Line 16-50: Start analysis method
  async startAnalysis(request: AnalysisRequest): Promise<ServiceResponse<AnalysisProgress>> {
    const operation = this.monitor.startOperation('start_analysis');
    
    try {
      // Validate user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Generate session ID
      const sessionId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Initialize progress tracking
      await supabase.rpc('insert_competitor_analysis_progress', {
        session_id_param: sessionId,
        user_id_param: user.id,
        total_competitors_param: request.competitors.length,
        metadata_param: { competitors: request.competitors, providers: request.providers }
      });

      // Start orchestration via edge function
      const { data, error } = await supabase.functions.invoke('analysis-orchestrator', {
        body: {
          sessionId,
          competitors: request.competitors,
          providers: request.providers,
          options: request.options
        }
      });

      if (error) {
        throw new Error(`Orchestration failed: ${error.message}`);
      }

      operation.success();
      
      return {
        success: true,
        data: {
          session_id: sessionId,
          status: 'processing',
          current_competitor: null,
          completed_count: 0,
          total_count: request.competitors.length,
          progress_percentage: 0
        },
        metadata: operation.getMetadata()
      };

    } catch (error) {
      operation.error(error);
      return this.errorHandler.handleServiceError(error, 'start_analysis');
    }
  }

  // Line 51-80: Get analysis method
  async getAnalysis(analysisId: string): Promise<ServiceResponse<CompetitorAnalysis>> {
    const operation = this.monitor.startOperation('get_analysis');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch analysis: ${error.message}`);
      }

      if (!data) {
        throw new Error('Analysis not found');
      }

      operation.success();
      
      return {
        success: true,
        data: data as CompetitorAnalysis,
        metadata: operation.getMetadata()
      };

    } catch (error) {
      operation.error(error);
      return this.errorHandler.handleServiceError(error, 'get_analysis');
    }
  }
}
```

#### **Task 3.1.2: Analysis Storage Service**
**File:** `src/services/analysis/AnalysisStorage.ts`

```typescript
// Line 1-15: Setup
import { supabase } from '@/integrations/supabase/client';
import { ServiceResponse, CompetitorAnalysis, SavedAnalysis } from '../types/service-interfaces';
import { ErrorHandler } from '../shared/ErrorHandler';
import { CacheManager } from '../shared/CacheManager';

export class AnalysisStorage {
  private errorHandler = new ErrorHandler();
  private cache = new CacheManager();

  // Line 16-50: Save analysis
  async saveAnalysis(analysis: Partial<CompetitorAnalysis>): Promise<ServiceResponse<SavedAnalysis>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Check for existing analysis by session_id
      let existingAnalysis = null;
      if (analysis.session_id) {
        const { data } = await supabase
          .from('competitor_analyses')
          .select('id')
          .eq('session_id', analysis.session_id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        existingAnalysis = data;
      }

      let result;
      if (existingAnalysis) {
        // Update existing
        const { data, error } = await supabase
          .from('competitor_analyses')
          .update({
            analysis_data: analysis.analysis_data,
            name: analysis.name || 'Updated Analysis',
            description: analysis.description,
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAnalysis.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('competitor_analyses')
          .insert({
            name: analysis.name || 'New Analysis',
            analysis_data: analysis.analysis_data || {},
            session_id: analysis.session_id,
            status: 'completed',
            completed_at: new Date().toISOString(),
            user_id: user.id,
            analysis_id: analysis.analysis_id || crypto.randomUUID()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Clear cache
      this.cache.invalidate(`user_analyses:${user.id}`);

      return {
        success: true,
        data: result as SavedAnalysis,
        metadata: {
          request_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          execution_time_ms: 0,
          cached: false
        }
      };

    } catch (error) {
      return this.errorHandler.handleServiceError(error, 'save_analysis');
    }
  }

  // Line 51-80: Get all analyses
  async getAllAnalyses(): Promise<ServiceResponse<SavedAnalysis[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Check cache first
      const cacheKey = `user_analyses:${user.id}`;
      const cached = this.cache.get<SavedAnalysis[]>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          metadata: {
            request_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            execution_time_ms: 0,
            cached: true
          }
        };
      }

      const { data, error } = await supabase.rpc('get_user_competitor_analyses', {
        user_id_param: user.id
      });

      if (error) {
        throw new Error(`Failed to fetch analyses: ${error.message}`);
      }

      const analyses = (data || []) as SavedAnalysis[];
      
      // Cache the results
      this.cache.set(cacheKey, analyses, 5 * 60 * 1000); // 5 minutes

      return {
        success: true,
        data: analyses,
        metadata: {
          request_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          execution_time_ms: 0,
          cached: false
        }
      };

    } catch (error) {
      return this.errorHandler.handleServiceError(error, 'get_all_analyses');
    }
  }
}
```

#### **Task 3.1.3: Progress Tracking Service**
**File:** `src/services/analysis/ProgressTracker.ts`

```typescript
// Line 1-15: Setup and types
import { supabase } from '@/integrations/supabase/client';
import { ServiceResponse, AnalysisProgress } from '../types/service-interfaces';
import { ErrorHandler } from '../shared/ErrorHandler';

export class ProgressTracker {
  private errorHandler = new ErrorHandler();
  private subscriptions = new Map<string, () => void>();

  // Line 16-50: Subscribe to progress
  subscribeToProgress(
    sessionId: string, 
    callback: (progress: AnalysisProgress) => void
  ): () => void {
    const channel = supabase
      .channel(`progress-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'competitor_analysis_progress',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newData = payload.new as any;
          const progress: AnalysisProgress = {
            session_id: sessionId,
            status: this.mapDbStatusToEnum(newData.status),
            current_competitor: newData.current_competitor,
            completed_count: newData.completed_competitors || 0,
            total_count: newData.total_competitors || 0,
            progress_percentage: newData.progress_percentage || 0,
            estimated_completion: newData.estimated_completion
          };
          
          callback(progress);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      supabase.removeChannel(channel);
      this.subscriptions.delete(sessionId);
    };

    this.subscriptions.set(sessionId, unsubscribe);
    return unsubscribe;
  }

  // Line 51-70: Get current progress
  async getCurrentProgress(sessionId: string): Promise<ServiceResponse<AnalysisProgress>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase.rpc('get_competitor_analysis_progress', {
        session_id_param: sessionId,
        user_id_param: user.id
      });

      if (error) {
        throw new Error(`Failed to get progress: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Progress not found');
      }

      const progress = data[0];
      return {
        success: true,
        data: {
          session_id: sessionId,
          status: this.mapDbStatusToEnum(progress.status),
          current_competitor: progress.current_competitor,
          completed_count: progress.completed_competitors || 0,
          total_count: progress.total_competitors || 0,
          progress_percentage: progress.progress_percentage || 0
        },
        metadata: {
          request_id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          execution_time_ms: 0
        }
      };

    } catch (error) {
      return this.errorHandler.handleServiceError(error, 'get_current_progress');
    }
  }

  // Line 71-85: Helper methods
  private mapDbStatusToEnum(dbStatus: string): AnalysisStatus {
    switch (dbStatus) {
      case 'pending':
      case 'running':
      case 'in_progress':
        return AnalysisStatus.PROCESSING;
      case 'completed':
        return AnalysisStatus.COMPLETED;
      case 'failed':
        return AnalysisStatus.FAILED;
      default:
        return AnalysisStatus.PENDING;
    }
  }

  // Cleanup method
  cleanup(): void {
    for (const unsubscribe of this.subscriptions.values()) {
      unsubscribe();
    }
    this.subscriptions.clear();
  }
}
```

### **Sprint 3.2: Hook Simplification** (Days 5-7)

#### **Task 3.2.1: Simplified Analysis Hook**
**File:** `src/hooks/useCompetitorAnalysis.ts`

```typescript
// Line 1-20: Imports and setup
import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { AnalysisOrchestrator } from '@/services/analysis/AnalysisOrchestrator';
import { AnalysisStorage } from '@/services/analysis/AnalysisStorage';
import { ProgressTracker } from '@/services/analysis/ProgressTracker';
import { AnalysisRequest, AnalysisProgress, CompetitorAnalysis, SavedAnalysis } from '@/types/competitor-analysis';

// Service instances
const orchestrator = new AnalysisOrchestrator();
const storage = new AnalysisStorage();
const progressTracker = new ProgressTracker();

export interface UseCompetitorAnalysisReturn {
  // State
  progress: AnalysisProgress | null;
  analyses: SavedAnalysis[];
  loading: boolean;
  error: string | null;
  
  // Actions
  startAnalysis: (request: AnalysisRequest) => Promise<void>;
  saveAnalysis: (analysis: Partial<CompetitorAnalysis>) => Promise<void>;
  fetchAnalyses: () => Promise<void>;
  updateAnalysis: (id: string, updates: Partial<CompetitorAnalysis>) => Promise<void>;
  deleteAnalysis: (id: string) => Promise<void>;
  resetProgress: () => void;
}

// Line 21-60: Hook implementation
export const useCompetitorAnalysis = (): UseCompetitorAnalysisReturn => {
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress subscription cleanup
  useEffect(() => {
    return () => {
      progressTracker.cleanup();
    };
  }, []);

  // Real-time progress tracking
  useEffect(() => {
    if (!progress?.session_id) return;

    const unsubscribe = progressTracker.subscribeToProgress(
      progress.session_id,
      (updatedProgress) => {
        setProgress(updatedProgress);
        
        if (updatedProgress.status === 'completed') {
          toast({
            title: 'Analysis Complete',
            description: `Successfully analyzed ${updatedProgress.total_count} competitor(s)`,
          });
          fetchAnalyses(); // Refresh the analyses list
        } else if (updatedProgress.status === 'failed') {
          toast({
            title: 'Analysis Failed',
            description: 'The analysis could not be completed. Please try again.',
            variant: 'destructive'
          });
        }
      }
    );

    return unsubscribe;
  }, [progress?.session_id]);

  // Line 61-90: Start analysis action
  const startAnalysis = useCallback(async (request: AnalysisRequest) => {
    try {
      setLoading(true);
      setError(null);

      const response = await orchestrator.startAnalysis(request);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to start analysis');
      }

      setProgress(response.data!);
      
      toast({
        title: 'Analysis Started',
        description: `Analyzing ${request.competitors.length} competitor(s)...`
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Failed to Start Analysis',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Line 91-115: Fetch analyses action
  const fetchAnalyses = useCallback(async () => {
    try {
      setError(null);
      const response = await storage.getAllAnalyses();
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch analyses');
      }

      setAnalyses(response.data!);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching analyses:', err);
    }
  }, []);

  // Line 116-140: Save analysis action
  const saveAnalysis = useCallback(async (analysis: Partial<CompetitorAnalysis>) => {
    try {
      setError(null);
      const response = await storage.saveAnalysis(analysis);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to save analysis');
      }

      toast({
        title: 'Analysis Saved',
        description: 'Your analysis has been saved successfully'
      });

      await fetchAnalyses(); // Refresh the list

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Save Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [fetchAnalyses]);

  // Line 141-165: Update analysis action
  const updateAnalysis = useCallback(async (id: string, updates: Partial<CompetitorAnalysis>) => {
    try {
      setError(null);
      // Implementation would call storage service update method
      // For now, we'll use the direct supabase approach
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const { error } = await supabase
        .from('competitor_analyses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Analysis Updated',
        description: 'The analysis has been updated successfully'
      });

      await fetchAnalyses(); // Refresh the list

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [fetchAnalyses]);

  // Line 166-190: Delete analysis action
  const deleteAnalysis = useCallback(async (id: string) => {
    try {
      setError(null);
      // Implementation would call storage service delete method
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const { error } = await supabase
        .from('competitor_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Analysis Deleted',
        description: 'The analysis has been removed'
      });

      await fetchAnalyses(); // Refresh the list

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Delete Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [fetchAnalyses]);

  // Line 191-200: Reset progress
  const resetProgress = useCallback(() => {
    setProgress(null);
    setError(null);
    progressTracker.cleanup();
  }, []);

  // Return hook interface
  return {
    progress,
    analyses,
    loading,
    error,
    startAnalysis,
    saveAnalysis,
    fetchAnalyses,
    updateAnalysis,
    deleteAnalysis,
    resetProgress
  };
};
```

## **PHASE 4: Testing & Quality Assurance** (Week 7-8)

### **Sprint 4.1: Comprehensive Testing** (Days 1-4)

#### **Task 4.1.1: Edge Function Integration Tests**
**File:** `src/__tests__/integration/edge-functions.test.ts`

```typescript
// Line 1-20: Setup
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

describe('Edge Function Integration Tests', () => {
  let testUser: any;
  let testSession: string;

  beforeAll(async () => {
    // Setup test user
    const { data: { user } } = await supabase.auth.getUser();
    testUser = user;
    testSession = `test-${Date.now()}`;
  });

  // Line 21-50: Analysis orchestrator tests
  describe('Analysis Orchestrator', () => {
    it('should validate input correctly', async () => {
      const { data, error } = await supabase.functions.invoke('validate-analysis-input', {
        body: {
          sessionId: testSession,
          competitors: ['Apple', 'Google'],
          options: {}
        }
      });

      expect(error).toBeNull();
      expect(data.valid).toBe(true);
      expect(data.sanitized.competitors).toEqual(['Apple', 'Google']);
    });

    it('should reject invalid input', async () => {
      const { data } = await supabase.functions.invoke('validate-analysis-input', {
        body: {
          sessionId: '',
          competitors: [],
          options: {}
        }
      });

      expect(data.valid).toBe(false);
      expect(data.errors).toContain('Invalid session ID');
      expect(data.errors).toContain('At least one competitor is required');
    });

    it('should check provider availability', async () => {
      const { data, error } = await supabase.functions.invoke('manage-ai-providers', {
        body: {
          action: 'check_availability',
          providers: ['openai', 'anthropic']
        }
      });

      expect(error).toBeNull();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.provider_statuses)).toBe(true);
      expect(Array.isArray(data.available_providers)).toBe(true);
    });
  });

  // Line 51-80: End-to-end orchestration test
  describe('Full Analysis Flow', () => {
    it('should complete full analysis orchestration', async () => {
      // This test requires API keys to be set up
      const { data, error } = await supabase.functions.invoke('analysis-orchestrator', {
        body: {
          sessionId: testSession,
          competitors: ['Test Company'],
          providers: ['openai'],
          options: {}
        }
      });

      if (error) {
        // If no API keys, expect specific error
        expect(error.message).toContain('API key');
      } else {
        expect(data.success).toBe(true);
        expect(data.sessionId).toBe(testSession);
        expect(data.competitorsProcessed).toBe(1);
      }
    }, 30000); // 30 second timeout for API calls
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUser) {
      await supabase
        .from('competitor_analysis_progress')
        .delete()
        .eq('session_id', testSession);
    }
  });
});
```

#### **Task 4.1.2: Service Layer Unit Tests**
**File:** `src/__tests__/unit/services/AnalysisOrchestrator.test.ts`

```typescript
// Line 1-25: Setup and mocks
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisOrchestrator } from '@/services/analysis/AnalysisOrchestrator';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn(),
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('AnalysisOrchestrator', () => {
  let orchestrator: AnalysisOrchestrator;
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    orchestrator = new AnalysisOrchestrator();
    vi.clearAllMocks();
  });

  // Line 26-60: Start analysis tests
  describe('startAnalysis', () => {
    it('should successfully start analysis with valid request', async () => {
      // Mock successful authentication
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser }
      });

      // Mock successful progress initialization
      (supabase.rpc as any).mockResolvedValue({
        data: 'progress-id',
        error: null
      });

      // Mock successful orchestration
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { success: true, analysisId: 'analysis-123' },
        error: null
      });

      const request = {
        competitors: ['Apple', 'Google'],
        providers: ['openai'],
        options: {}
      };

      const result = await orchestrator.startAnalysis(request);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('processing');
      expect(result.data?.total_count).toBe(2);
      expect(supabase.rpc).toHaveBeenCalledWith('insert_competitor_analysis_progress', {
        session_id_param: expect.any(String),
        user_id_param: mockUser.id,
        total_competitors_param: 2,
        metadata_param: expect.any(Object)
      });
    });

    it('should handle authentication error', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null }
      });

      const request = {
        competitors: ['Apple'],
        providers: ['openai'],
        options: {}
      };

      const result = await orchestrator.startAnalysis(request);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Authentication required');
    });

    it('should handle orchestration failure', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser }
      });

      (supabase.rpc as any).mockResolvedValue({
        data: 'progress-id',
        error: null
      });

      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: 'Orchestration failed' }
      });

      const request = {
        competitors: ['Apple'],
        providers: ['openai'],
        options: {}
      };

      const result = await orchestrator.startAnalysis(request);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Orchestration failed');
    });
  });

  // Line 61-90: Get analysis tests
  describe('getAnalysis', () => {
    it('should successfully retrieve analysis', async () => {
      const mockAnalysis = {
        id: 'analysis-123',
        name: 'Test Analysis',
        status: 'completed',
        user_id: mockUser.id,
        analysis_data: { competitors: ['Apple'] }
      };

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser }
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockAnalysis,
          error: null
        })
      });

      const result = await orchestrator.getAnalysis('analysis-123');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('analysis-123');
    });

    it('should handle analysis not found', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser }
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      const result = await orchestrator.getAnalysis('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Analysis not found');
    });
  });
});
```

#### **Task 4.1.3: Hook Integration Tests**
**File:** `src/__tests__/integration/useCompetitorAnalysis.test.tsx`

```typescript
// Line 1-25: Setup
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCompetitorAnalysis } from '@/hooks/useCompetitorAnalysis';
import { AnalysisOrchestrator } from '@/services/analysis/AnalysisOrchestrator';
import { AnalysisStorage } from '@/services/analysis/AnalysisStorage';

// Mock services
vi.mock('@/services/analysis/AnalysisOrchestrator');
vi.mock('@/services/analysis/AnalysisStorage');
vi.mock('@/services/analysis/ProgressTracker');

describe('useCompetitorAnalysis Hook Integration', () => {
  let mockOrchestrator: vi.Mocked<AnalysisOrchestrator>;
  let mockStorage: vi.Mocked<AnalysisStorage>;

  beforeEach(() => {
    mockOrchestrator = {
      startAnalysis: vi.fn(),
      getAnalysis: vi.fn()
    } as any;

    mockStorage = {
      saveAnalysis: vi.fn(),
      getAllAnalyses: vi.fn()
    } as any;

    vi.mocked(AnalysisOrchestrator).mockImplementation(() => mockOrchestrator);
    vi.mocked(AnalysisStorage).mockImplementation(() => mockStorage);
  });

  // Line 26-60: Start analysis integration test
  it('should start analysis and handle progress updates', async () => {
    mockOrchestrator.startAnalysis.mockResolvedValue({
      success: true,
      data: {
        session_id: 'session-123',
        status: 'processing',
        current_competitor: null,
        completed_count: 0,
        total_count: 2,
        progress_percentage: 0
      }
    });

    const { result } = renderHook(() => useCompetitorAnalysis());

    expect(result.current.progress).toBeNull();
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.startAnalysis({
        competitors: ['Apple', 'Google'],
        providers: ['openai'],
        options: {}
      });
    });

    expect(mockOrchestrator.startAnalysis).toHaveBeenCalledWith({
      competitors: ['Apple', 'Google'],
      providers: ['openai'],
      options: {}
    });

    expect(result.current.progress?.session_id).toBe('session-123');
    expect(result.current.progress?.status).toBe('processing');
    expect(result.current.loading).toBe(false);
  });

  // Line 61-90: Error handling test
  it('should handle analysis start failure', async () => {
    mockOrchestrator.startAnalysis.mockResolvedValue({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid competitors'
      }
    });

    const { result } = renderHook(() => useCompetitorAnalysis());

    await act(async () => {
      try {
        await result.current.startAnalysis({
          competitors: [],
          providers: ['openai'],
          options: {}
        });
      } catch (error) {
        expect(error.message).toContain('Invalid competitors');
      }
    });

    expect(result.current.error).toContain('Invalid competitors');
    expect(result.current.progress).toBeNull();
  });

  // Line 91-120: Fetch analyses test
  it('should fetch and display saved analyses', async () => {
    const mockAnalyses = [
      {
        id: 'analysis-1',
        name: 'Test Analysis 1',
        status: 'completed',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        completed_at: '2025-01-01T00:00:00Z',
        data_quality_score: 85
      },
      {
        id: 'analysis-2', 
        name: 'Test Analysis 2',
        status: 'completed',
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        completed_at: '2025-01-02T00:00:00Z',
        data_quality_score: 92
      }
    ];

    mockStorage.getAllAnalyses.mockResolvedValue({
      success: true,
      data: mockAnalyses
    });

    const { result } = renderHook(() => useCompetitorAnalysis());

    await act(async () => {
      await result.current.fetchAnalyses();
    });

    expect(mockStorage.getAllAnalyses).toHaveBeenCalled();
    expect(result.current.analyses).toHaveLength(2);
    expect(result.current.analyses[0].name).toBe('Test Analysis 1');
  });
});
```

### **Sprint 4.2: Performance Testing & Monitoring** (Days 5-7)

#### **Task 4.2.1: Performance Monitoring Setup**
**File:** `src/services/shared/PerformanceMonitor.ts`

```typescript
// Line 1-20: Setup and types
export interface PerformanceMetric {
  operation: string;
  duration_ms: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface OperationTracker {
  startTime: number;
  operation: string;
  metadata: Record<string, any>;
}

export class PerformanceMonitor {
  private operations = new Map<string, OperationTracker>();
  private metrics: PerformanceMetric[] = [];

  // Line 21-40: Start operation tracking
  startOperation(operation: string, metadata: Record<string, any> = {}): OperationHandler {
    const id = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tracker: OperationTracker = {
      startTime: performance.now(),
      operation,
      metadata
    };
    
    this.operations.set(id, tracker);
    
    return new OperationHandler(id, this);
  }

  // Line 41-60: Complete operation
  completeOperation(id: string, success: boolean, error?: string, additionalMetadata?: Record<string, any>): void {
    const tracker = this.operations.get(id);
    if (!tracker) return;

    const duration = performance.now() - tracker.startTime;
    const metric: PerformanceMetric = {
      operation: tracker.operation,
      duration_ms: Math.round(duration),
      success,
      error,
      metadata: { ...tracker.metadata, ...additionalMetadata },
      timestamp: new Date().toISOString()
    };

    this.metrics.push(metric);
    this.operations.delete(id);

    // Log slow operations
    if (duration > 5000) {
      console.warn(`Slow operation detected: ${tracker.operation} took ${Math.round(duration)}ms`);
    }

    // Send to monitoring service (optional)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: 'api_performance',
        event_label: tracker.operation,
        value: Math.round(duration)
      });
    }
  }

  // Line 61-80: Get metrics
  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return [...this.metrics];
  }

  // Get operation summary
  getOperationSummary(operation: string): {
    count: number;
    averageDuration: number;
    successRate: number;
    slowestDuration: number;
  } {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) {
      return { count: 0, averageDuration: 0, successRate: 0, slowestDuration: 0 };
    }

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration_ms, 0);
    const successCount = operationMetrics.filter(m => m.success).length;
    const slowestDuration = Math.max(...operationMetrics.map(m => m.duration_ms));

    return {
      count: operationMetrics.length,
      averageDuration: Math.round(totalDuration / operationMetrics.length),
      successRate: Math.round((successCount / operationMetrics.length) * 100),
      slowestDuration
    };
  }
}

// Line 81-110: Operation handler class
export class OperationHandler {
  constructor(
    private id: string,
    private monitor: PerformanceMonitor
  ) {}

  success(metadata?: Record<string, any>): void {
    this.monitor.completeOperation(this.id, true, undefined, metadata);
  }

  error(error: Error | string, metadata?: Record<string, any>): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.monitor.completeOperation(this.id, false, errorMessage, metadata);
  }

  getMetadata(): ResponseMetadata {
    return {
      request_id: this.id,
      timestamp: new Date().toISOString(),
      execution_time_ms: 0 // Will be updated when operation completes
    };
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();
```

#### **Task 4.2.2: Load Testing Setup**
**File:** `src/__tests__/performance/load-test.spec.ts`

```typescript
// Line 1-20: Setup
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const CONCURRENT_USERS = 10;
const REQUESTS_PER_USER = 5;

test.describe('Competitor Analysis Load Tests', () => {
  
  // Line 21-50: Concurrent analysis test
  test('should handle concurrent analysis requests', async ({ page }) => {
    // Setup multiple virtual users
    const userPromises = Array(CONCURRENT_USERS).fill(0).map(async (_, userIndex) => {
      const userResults = [];
      
      for (let requestIndex = 0; requestIndex < REQUESTS_PER_USER; requestIndex++) {
        const startTime = Date.now();
        
        try {
          // Navigate to competitor analysis page
          await page.goto('/market-research/competitor-analysis');
          
          // Fill in competitor
          await page.fill('[data-testid="competitor-input"]', `TestCompany${userIndex}-${requestIndex}`);
          
          // Start analysis
          await page.click('[data-testid="analyze-button"]');
          
          // Wait for analysis to start
          await page.waitForSelector('[data-testid="analysis-progress"]', { timeout: 10000 });
          
          const duration = Date.now() - startTime;
          userResults.push({
            user: userIndex,
            request: requestIndex,
            duration,
            success: true
          });
          
        } catch (error) {
          userResults.push({
            user: userIndex,
            request: requestIndex,
            duration: Date.now() - startTime,
            success: false,
            error: error.message
          });
        }
      }
      
      return userResults;
    });

    // Execute all user scenarios concurrently
    const allResults = await Promise.all(userPromises);
    const flatResults = allResults.flat();

    // Analyze results
    const successfulRequests = flatResults.filter(r => r.success);
    const failedRequests = flatResults.filter(r => !r.success);
    const averageResponseTime = successfulRequests.reduce((sum, r) => sum + r.duration, 0) / successfulRequests.length;

    console.log(`Load Test Results:
      Total Requests: ${flatResults.length}
      Successful: ${successfulRequests.length}
      Failed: ${failedRequests.length}
      Success Rate: ${(successfulRequests.length / flatResults.length * 100).toFixed(2)}%
      Average Response Time: ${Math.round(averageResponseTime)}ms
    `);

    // Assertions
    expect(successfulRequests.length / flatResults.length).toBeGreaterThan(0.8); // 80% success rate
    expect(averageResponseTime).toBeLessThan(5000); // Under 5 seconds average
  });

  // Line 51-80: Edge function stress test
  test('should handle direct edge function stress testing', async () => {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const testPromises = Array(20).fill(0).map(async (_, index) => {
      const startTime = Date.now();
      
      try {
        const { data, error } = await supabase.functions.invoke('validate-analysis-input', {
          body: {
            sessionId: `stress-test-${index}`,
            competitors: [`Company${index}A`, `Company${index}B`],
            options: {}
          }
        });

        return {
          index,
          duration: Date.now() - startTime,
          success: !error && data?.valid,
          error: error?.message
        };
      } catch (err) {
        return {
          index,
          duration: Date.now() - startTime,
          success: false,
          error: err.message
        };
      }
    });

    const results = await Promise.all(testPromises);
    const successfulResults = results.filter(r => r.success);
    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;

    console.log(`Edge Function Stress Test:
      Success Rate: ${(successfulResults.length / results.length * 100).toFixed(2)}%
      Average Duration: ${Math.round(avgDuration)}ms
    `);

    expect(successfulResults.length / results.length).toBeGreaterThan(0.9); // 90% success rate for simple validation
    expect(avgDuration).toBeLessThan(1000); // Under 1 second for validation
  });
});
```

## **Implementation Timeline & Milestones**

<lov-mermaid>
### **Sprint 4.2: Frontend Component Refactoring** (Days 4-7)

#### **Task 4.2.1: Design System Migration**
**Goal:** Migrate all competitor analysis UI to use design system tokens
```typescript
// Design system migration checklist
const ComponentMigration = {
  // High Priority Components
  'CompetitorAnalysisDashboard': {
    issues: ['Direct color usage', 'Inconsistent spacing'],
    fixes: ['Use semantic tokens', 'Apply design system spacing']
  },
  'AnalysisProgressIndicator': {
    issues: ['Custom animations', 'Non-responsive'],
    fixes: ['Use design system animations', 'Mobile-first approach']
  },
  'CompetitorCard': {
    issues: ['Hardcoded styles', 'No dark mode support'],
    fixes: ['Theme-aware styling', 'Proper variants']
  },
  'ResultsVisualization': {
    issues: ['Accessibility issues', 'Color-blind unfriendly'],
    fixes: ['ARIA labels', 'Color-blind safe palette']
  }
};

// Implementation template
const MigratedComponent = () => {
  return (
    <Card className="bg-card text-card-foreground border-border shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-foreground">Analysis Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Use semantic tokens, not direct colors */}
      </CardContent>
    </Card>
  );
};
```

#### **Task 4.2.2: Responsive Design Implementation**
```typescript
// Responsive layout system for competitor analysis
const ResponsiveLayout = {
  // Mobile First Approach
  mobile: {
    layout: 'single-column',
    navigation: 'bottom-tabs',
    cards: 'full-width',
    tables: 'horizontal-scroll'
  },
  
  // Tablet Optimizations  
  tablet: {
    layout: 'two-column',
    navigation: 'side-drawer',
    cards: 'grid-2',
    tables: 'responsive-columns'
  },
  
  // Desktop Full Layout
  desktop: {
    layout: 'multi-panel',
    navigation: 'sidebar',
    cards: 'grid-3',
    tables: 'full-featured'
  },
  
  // Critical breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px'
  }
};
```

#### **Task 4.2.3: Real-time Data Integration**
```typescript
// Real-time data flow for frontend components
const RealTimeDataFlow = {
  // Progress Updates
  useProgressUpdates: (sessionId: string) => {
    useEffect(() => {
      const channel = supabase
        .channel('analysis-progress')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'competitor_analysis_progress',
          filter: `session_id=eq.${sessionId}`
        }, (payload) => {
          // Update UI immediately
          updateProgressState(payload.new);
          
          // Show toast notifications for major milestones
          if (payload.new.progress_percentage === 100) {
            toast.success("Analysis completed!");
          }
        })
        .subscribe();
        
      return () => supabase.removeChannel(channel);
    }, [sessionId]);
  },
  
  // Error Handling with User Feedback
  useErrorHandling: () => {
    const handleError = useCallback((error: Error, context: string) => {
      // Log for developers
      console.error(`${context}:`, error);
      
      // User-friendly error message
      toast.error(
        error.message.includes('API key') 
          ? "Please check your API key configuration"
          : "Something went wrong. Please try again."
      );
      
      // Track for analytics
      trackError(error, context);
    }, []);
    
    return handleError;
  }
};
```

#### **Task 4.2.4: Accessibility Implementation**
```typescript
// Comprehensive accessibility for competitor analysis
const AccessibilityFeatures = {
  // Keyboard Navigation
  keyboardSupport: {
    'Tab': 'Navigate through interactive elements',
    'Enter/Space': 'Activate buttons and links',
    'Escape': 'Close modals and dropdowns',
    'Arrow Keys': 'Navigate within data tables'
  },
  
  // Screen Reader Support
  ariaLabels: {
    analysisProgress: 'Analysis progress: {percentage}% complete',
    competitorCard: 'Competitor: {name}, Status: {status}',
    exportButton: 'Export analysis results as CSV',
    filterControls: 'Filter results by {criteria}'
  },
  
  // Visual Accessibility
  visualSupport: {
    contrast: 'WCAG AA compliant contrast ratios',
    textScaling: 'Support up to 200% text scaling',
    focusIndicators: 'Clear focus indicators for all interactive elements',
    colorBlindness: 'Chart colors distinguishable without color'
  }
};

// Implementation example
const AccessibleCompetitorCard = ({ competitor, onSelect }) => {
  return (
    <Card 
      role="button"
      tabIndex={0}
      aria-label={`Competitor: ${competitor.name}, Status: ${competitor.status}`}
      className="focus:ring-2 focus:ring-primary focus:outline-none"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Content with proper heading hierarchy */}
      <CardHeader>
        <CardTitle as="h3">{competitor.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p aria-label="Analysis status">
          Status: <span className="font-semibold">{competitor.status}</span>
        </p>
      </CardContent>
    </Card>
  );
};
```

## **PHASE 5: Production Deployment & Monitoring** (Week 8)

### **Sprint 5.1: Production Deployment** (Days 1-4)

#### **Task 5.1.1: Feature Flag Controlled Rollout**
```typescript
// Production deployment strategy
const ProductionDeployment = {
  // Gradual rollout phases
  rolloutPhases: [
    { percentage: 5, duration: '24h', criteria: 'Internal users only' },
    { percentage: 25, duration: '48h', criteria: 'Power users + beta testers' },
    { percentage: 50, duration: '72h', criteria: 'Regular users' },
    { percentage: 100, duration: 'ongoing', criteria: 'All users' }
  ],
  
  // Health check gates
  healthGates: {
    errorRate: '<1%',
    responseTime: '<1s average',
    userSatisfaction: '>90%',
    systemLoad: '<80%'
  },
  
  // Automatic rollback triggers
  rollbackTriggers: [
    'Error rate > 5%',
    'Response time > 3s average', 
    'User complaints > 10/hour',
    'System alerts > warning threshold'
  ]
};
```

#### **Task 5.1.2: Legacy System Sunset**
```typescript
// Legacy system retirement plan
const LegacySunset = {
  // Phase out timeline
  timeline: {
    'Week 8-9': 'New system at 100%, legacy on standby',
    'Week 10-11': 'Monitor for any issues, keep legacy accessible',
    'Week 12': 'Archive legacy system, remove from production'
  },
  
  // Data migration verification
  dataVerification: {
    analysisResults: 'Verify all analysis data migrated correctly',
    userSettings: 'Confirm user preferences transferred',
    apiKeys: 'Ensure Vault integration working perfectly',
    progressTracking: 'Validate real-time updates functioning'
  },
  
  // Final cleanup
  cleanup: [
    'Remove legacy edge function',
    'Archive old service files',
    'Update documentation', 
    'Remove deprecated API endpoints'
  ]
};
```

### **Sprint 5.2: Monitoring & Observability** (Days 5-7)

#### **Task 5.2.1: Production Monitoring Dashboard**
```typescript
// Comprehensive monitoring for production system
const ProductionMonitoring = {
  // Key Performance Indicators
  kpis: {
    'Analysis Startup Time': { target: '<1s', critical: '>3s' },
    'API Key Retrieval': { target: '<500ms', critical: '>2s' },
    'Edge Function Success Rate': { target: '>99%', critical: '<95%' },
    'User Satisfaction Score': { target: '>4.5/5', critical: '<3.5/5' }
  },
  
  // Alert thresholds
  alerts: {
    immediate: ['System down', 'Data loss', 'Security breach'],
    urgent: ['Performance degradation', 'High error rate'],
    warning: ['Approaching limits', 'Unusual patterns']
  },
  
  // Business metrics
  businessMetrics: {
    'Daily Active Users': 'Track adoption of new system',
    'Analysis Completion Rate': 'Measure user success',
    'Feature Usage': 'Identify popular analysis types',
    'Cost per Analysis': 'Monitor AI provider costs'
  }
};
```

#### **Task 5.2.2: Continuous Improvement Process**
```typescript
// Post-deployment optimization
const ContinuousImprovement = {
  // Performance optimization cycle
  optimizationCycle: {
    'Week 1': 'Baseline performance measurement',
    'Week 2-3': 'Identify bottlenecks and optimization opportunities',
    'Week 4': 'Implement performance improvements',
    'Ongoing': 'Monitor and iterate'
  },
  
  // User feedback integration
  feedbackLoop: {
    collection: 'In-app feedback, surveys, usage analytics',
    analysis: 'Weekly review of user pain points',
    prioritization: 'Impact vs effort matrix for improvements',
    implementation: 'Bi-weekly feature updates'
  },
  
  // Technical debt management
  techDebtManagement: {
    monitoring: 'Code quality metrics and complexity analysis',
    planning: 'Monthly tech debt reduction sprints',
    prevention: 'Code review standards and testing requirements'
  }
};
```

## **📋 MANITO.AI COMPLIANCE CHECKLIST**

### **🚨 CRITICAL IMPLEMENTATION RULES ENFORCED**

#### **Incremental Progress Requirements** ✅
- [ ] Each stage broken into 3-5 testable deliverables  
- [ ] Every change compiles and passes tests before next step
- [ ] No "big bang" refactoring - only small, verifiable changes
- [ ] Clear commit messages linking to implementation plan

#### **Single Source of Truth Enforcement** ✅
- [ ] **RULE #1:** Never create alternative implementations
- [ ] **RULE #2:** Always consolidate existing duplicate code
- [ ] **RULE #3:** Preserve 100% of existing functionality  
- [ ] **RULE #4:** Study existing code patterns before implementing
- [ ] **RULE #5:** Mark consolidated files as "SINGLE SOURCE OF TRUTH"

#### **Test-Driven Development** ✅
- [ ] Write tests first (red) → Implement (green) → Refactor (clean)
- [ ] Every stage has specific test cases defined
- [ ] Never disable tests - fix them
- [ ] Test behavior, not implementation
- [ ] One assertion per test when possible

#### **Mandatory Code Quality Gates** ✅
- [ ] All commits compile successfully
- [ ] All existing tests pass before new implementation
- [ ] New functionality includes comprehensive tests
- [ ] Code follows existing project conventions
- [ ] No linter/formatter warnings
- [ ] Clear commit messages explaining "why"

#### **Architecture Principles Compliance** ✅
- [ ] Composition over inheritance (dependency injection)
- [ ] Single responsibility per function/class
- [ ] Explicit over implicit (clear data flow)
- [ ] No premature abstractions
- [ ] Boring, obvious solutions over clever tricks

#### **Forbidden Actions Checklist** ❌
- [ ] **NEVER** create simplified/basic/lite versions
- [ ] **NEVER** create alternative implementations  
- [ ] **NEVER** skip functionality from existing code
- [ ] **NEVER** use temporary/placeholder implementations
- [ ] **NEVER** remove existing features without approval
- [ ] **NEVER** start from scratch if existing code exists
- [ ] **NEVER** create "version 2" or "new" versions
- [ ] **NEVER** make quick fixes or temporary solutions

### **🎯 STAGE SUCCESS CRITERIA**

Each stage MUST meet these criteria before proceeding:

#### **Stage 1: Foundation & Consolidation**
- [ ] All type definitions consolidated into single authoritative file
- [ ] Zero TypeScript compilation errors
- [ ] All existing functionality preserved and tested
- [ ] Performance baseline established and maintained
- [ ] Vault integration patterns documented and tested

#### **Stage 2: Service Layer Consolidation**  
- [ ] All 686 lines of competitorAnalysisService.ts functionality preserved
- [ ] Service decomposition follows single responsibility principle
- [ ] All existing tests pass + new focused tests added
- [ ] No behavioral changes in user interface
- [ ] Integration tests validate new service architecture

#### **Stage 3: Edge Function Decomposition**
- [ ] All 1,751 lines of edge function functionality preserved
- [ ] API contracts unchanged - existing calls work identically
- [ ] Feature flag system enables safe gradual rollout
- [ ] Automatic fallback to original function implemented
- [ ] End-to-end analysis workflow remains identical

#### **Stage 4: Frontend Consolidation & Testing**
- [ ] All UI components work identically with new backend
- [ ] Design system compliance achieved without functionality loss
- [ ] Accessibility standards (WCAG AA) implemented
- [ ] Test coverage > 90% achieved
- [ ] Visual regression tests pass

#### **Stage 5: Production Deployment & Legacy Cleanup**
- [ ] 100% user migration completed successfully
- [ ] Legacy components archived (not deleted) with restoration capability
- [ ] Performance targets met or exceeded
- [ ] Zero user-facing issues in production
- [ ] 90-day rollback capability maintained

### **🔄 WORKFLOW ENFORCEMENT**

#### **Before Any Stage Begins:**
1. **READ** existing codebase patterns thoroughly
2. **STUDY** 3 similar implementations in the project
3. **DOCUMENT** current functionality completely
4. **WRITE** comprehensive tests for existing behavior
5. **ESTABLISH** success criteria and validation tests

#### **During Implementation:**
1. **SMALL COMMITS** - Each change must compile and pass tests
2. **CONTINUOUS TESTING** - Run tests after every significant change
3. **PATTERN FOLLOWING** - Use existing project conventions
4. **DOCUMENTATION** - Update plan status as you progress
5. **VALIDATION** - Verify functionality preservation constantly

#### **Before Stage Completion:**
1. **FULL TEST SUITE** passes completely
2. **PERFORMANCE VERIFICATION** - meets or exceeds baseline
3. **FUNCTIONALITY AUDIT** - every feature works identically
4. **CODE REVIEW** - follows project patterns and standards
5. **DOCUMENTATION UPDATE** - plan reflects completed work

### **⚡ EMERGENCY PROCEDURES**

#### **If Stuck After 3 Attempts:**
1. **STOP** - Do not continue trying the same approach
2. **DOCUMENT** - What failed, specific errors, attempted solutions
3. **RESEARCH** - Find 2-3 alternative approaches  
4. **QUESTION** - Is this the right abstraction level?
5. **PIVOT** - Try different architectural pattern or remove abstraction

#### **If Tests Fail:**
1. **NEVER** disable tests to proceed
2. **FIX** the failing tests or implementation
3. **UNDERSTAND** why tests are failing
4. **PRESERVE** existing behavior that tests were protecting
5. **VALIDATE** new implementation maintains old behavior

#### **If Performance Degrades:**
1. **ROLLBACK** immediately to previous working state
2. **ANALYZE** what changed to cause degradation
3. **OPTIMIZE** specific bottlenecks identified
4. **BENCHMARK** before proceeding further
5. **VALIDATE** performance targets met

### **📊 QUALITY METRICS**

#### **Continuous Monitoring:**
- **Compilation Success Rate:** 100% required
- **Test Pass Rate:** 100% required for existing tests
- **Performance Baseline:** Must not exceed +10% of original
- **Functionality Preservation:** 100% of existing features working
- **Code Coverage:** Maintain or improve existing coverage

#### **Stage Gate Metrics:**
- **Stage 1:** Type consolidation complete, all tests green
- **Stage 2:** Service functionality 100% preserved, performance maintained
- **Stage 3:** Edge function decomposition with identical API contracts
- **Stage 4:** UI/UX identical experience, accessibility compliant
- **Stage 5:** Production ready, legacy safely archived

This plan now strictly enforces Manito.ai AI Coding Agents rules with incremental progress, single source of truth, comprehensive testing, and mandatory functionality preservation.
</lov-mermaid>

## **Success Metrics & Validation**

### **Technical Metrics**
1. **Code Quality:**
   - Maintainability Index: 85+ (target vs current 65)
   - Cyclomatic Complexity: <10 per function (vs current >50)
   - Technical Debt Ratio: <10% (vs current 35%)

2. **Performance Metrics:**
   - Analysis Startup Time: <1 second (vs current 2-3 seconds)
   - Edge Function Cold Start: <500ms (vs current 2+ seconds)
   - API Key Retrieval: <200ms (vs current 500ms)

3. **Reliability Metrics:**
   - Test Coverage: >90% (vs current 78%)
   - Success Rate: >95% for all operations
   - Error Recovery: Automatic retry for transient failures

### **Architecture Quality**
1. **Modularity:** Each edge function <300 lines
2. **Coupling:** Reduced from HIGH to LOW
3. **Cohesion:** Increased from MEDIUM to HIGH
4. **Reusability:** Shared utilities and clear interfaces

### **Developer Experience**
1. **Zero Legacy Code:** Complete elimination of backward compatibility aliases
2. **Clear APIs:** Strongly typed interfaces with documentation
3. **Easy Testing:** Comprehensive test coverage with clear patterns
4. **Simple Debugging:** Structured logging and error reporting

## **Risk Mitigation**

### **High-Risk Areas**
1. **Data Migration:** 
   - Risk: Loss of existing analyses during type migration
   - Mitigation: Incremental migration with rollback plan
   
2. **Edge Function Deployment:**
   - Risk: Service interruption during decomposition
   - Mitigation: Blue-green deployment with feature flags

3. **Performance Regression:**
   - Risk: New architecture slower than current
   - Mitigation: Continuous performance monitoring and benchmarking

### **Rollback Plan**
1. **Database Changes:** Use migrations with down scripts
2. **Edge Functions:** Keep old functions active until validation complete
3. **Frontend Changes:** Feature flags for gradual rollout

This comprehensive implementation plan provides a clear path to transform the competitor analysis system from its current state to a maintainable, performant, and error-free architecture with zero legacy code.