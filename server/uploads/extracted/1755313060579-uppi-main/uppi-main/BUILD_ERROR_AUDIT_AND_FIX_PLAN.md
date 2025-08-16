# Build Error Audit & Systematic Fix Plan

## Current Build Error Audit

### 1. TypeScript Interface Mismatches
- [ ] `src/__tests__/unit/competitorAnalysisService.test.ts(214,80)`: Object literal has no properties in common with `Partial<CompetitorAnalysisResult>`
- [ ] `src/hooks/useCompetitorAnalysis.ts(115,87)`: Property 'analysis_data' does not exist in type `Partial<CompetitorAnalysisResult>`
- [ ] `src/pages/ComparisonPage.tsx(106,11)`: `SavedAnalysis[]` not assignable to `CompetitorAnalysisEntity[]` - missing `user_id` property

### 2. Method Parameter Mismatches
- [ ] `src/components/admin/competitor/CompetitorBatchOperations.tsx(83,64)`: Expected 2 arguments, but got 1
- [ ] `src/components/admin/competitor/CompetitorBatchOperations.tsx(88,30)`: Type `CompetitorAnalysisResult` must have `[Symbol.iterator]()` method
- [ ] `src/hooks/useMonitoringManager.ts(114,74)`: Expected 2 arguments, but got 3
- [ ] `src/pages/CompetitorAnalysisPage.tsx(62,23)`: `ApiKeyRequirement[]` not assignable to `SetStateAction<{ hasKeys: boolean; missingProviders: string[]; }>`

### 3. Missing Properties in Types
- [ ] `src/hooks/useMonitoringManager.ts(51,5)`: Property 'totalExecutions' does not exist in type `EdgeFunctionStats`
- [ ] `src/hooks/useMonitoringManager.ts(80,30)`: Property 'systemHealth' does not exist in type `SystemHealthData`
- [ ] `src/hooks/useSecureOpenAI.ts(44,64)`: Property 'length' does not exist in type `ContextSummary`

### 4. DataManager Service Errors (Multiple instances)
- [ ] `src/services/core/DataManager.ts(145,57)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(180,57)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(204,57)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(229,57)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(250,57)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(273,57)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(293,57)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(314,57)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(380,59)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(446,57)`: Expected 1-2 arguments, but got 3
- [ ] `src/services/core/DataManager.ts(465,57)`: Expected 1-2 arguments, but got 3

### 5. Document Service Database Schema Mismatches
- [ ] `src/services/documents/enhancedDocumentService.ts(67,10)`: Property 'title' does not exist in database schema
- [ ] `src/services/documents/enhancedDocumentService.ts(140,17)`: Type instantiation is excessively deep
- [ ] `src/services/documents/enhancedDocumentService.ts(263,62)`: Property 'file_size' does not exist

### 6. Feature Flag Service Type Conversions
- [ ] `src/services/featureFlagService.ts(43,34)`: Missing 'target_audience' property in FeatureFlag type
- [ ] `src/services/featureFlagService.ts(46,14)`: Missing 'target_audience' property in FeatureFlag type
- [ ] `src/services/featureFlagService.ts(72,40)`: Missing 'target_audience' property in FeatureFlag type
- [ ] `src/services/featureFlagService.ts(76,14)`: Missing 'target_audience' property in FeatureFlag array

### 7. Master Company Profile Service Issues
- [ ] `src/services/masterCompanyProfileService.ts(134,7)`: Missing properties: official_company_data, financial_data, market_position_data, personnel_data
- [ ] `src/services/masterCompanyProfileService.ts(158,7)`: Missing properties: official_company_data, financial_data, market_position_data, personnel_data  
- [ ] `src/services/masterCompanyProfileService.ts(261,37)`: Type instantiation is excessively deep
- [ ] `src/services/masterCompanyProfileService.ts(262,15)`: Table 'data_validation_logs' does not exist in database schema

## Systematic Implementation Plan

### Phase 1: Core Type Definitions & Interfaces
- [ ] **1.1** Review and standardize all `CompetitorAnalysis` related interfaces
  - [ ] Unify `CompetitorAnalysisResult`, `CompetitorAnalysisEntity`, and `SavedAnalysis` types
  - [ ] Ensure all interfaces include required properties (`user_id`, `data`, etc.)
  - [ ] Update type exports in `src/types/competitor-analysis.ts`

- [ ] **1.2** Fix `FeatureFlag` interface definition
  - [ ] Add missing `target_audience` property to FeatureFlag type
  - [ ] Update all FeatureFlag-related service methods to handle new property

- [ ] **1.3** Fix `EdgeFunctionStats` and `SystemHealthData` interfaces
  - [ ] Add missing `totalExecutions` property to EdgeFunctionStats
  - [ ] Add missing `systemHealth` property to SystemHealthData
  - [ ] Update MonitoringManager service accordingly

- [ ] **1.4** Fix `ContextSummary` interface
  - [ ] Add missing `length` property or fix how it's accessed
  - [ ] Update useSecureOpenAI hook to handle ContextSummary properly

### Phase 2: Database Schema Alignment
- [ ] **2.1** Fix documents table schema mismatches
  - [ ] Remove or replace 'title' field usage with 'name' field
  - [ ] Fix file_size property access
  - [ ] Resolve type instantiation depth issues

- [ ] **2.2** Fix master_company_profiles table schema
  - [ ] Add missing properties to MasterCompanyProfile interface
  - [ ] Update service methods to handle missing fields
  - [ ] Remove references to non-existent 'data_validation_logs' table

- [ ] **2.3** Verify all database table references
  - [ ] Audit all service files for non-existent table references
  - [ ] Update or remove invalid table queries

### Phase 3: Service Method Signatures
- [ ] **3.1** Fix DataManager service method signatures
  - [ ] Review all method signatures expecting 1-2 arguments but receiving 3
  - [ ] Update ErrorManager integration calls to match expected parameters
  - [ ] Ensure consistent error handling across all DataManager methods

- [ ] **3.2** Fix CompetitorAnalysisService methods
  - [ ] Update `startAnalysis` method signature consistency
  - [ ] Fix `saveAnalysis` method parameter types
  - [ ] Ensure all methods return expected types

- [ ] **3.3** Fix batch operations and iteration issues
  - [ ] Fix CompetitorBatchOperations parameter mismatches
  - [ ] Ensure CompetitorAnalysisResult is properly iterable where needed
  - [ ] Update hook methods to match service signatures

### Phase 4: Component Integration Fixes
- [ ] **4.1** Fix page-level type mismatches
  - [ ] Update ComparisonPage to handle SavedAnalysis vs CompetitorAnalysisEntity
  - [ ] Fix CompetitorAnalysisPage ApiKeyRequirement state management
  - [ ] Ensure proper type casting where necessary

- [ ] **4.2** Fix hook implementations
  - [ ] Update useCompetitorAnalysis to match service method signatures
  - [ ] Fix useMonitoringManager property access
  - [ ] Update useErrorManager to handle async operations properly

- [ ] **4.3** Fix admin component integrations
  - [ ] Update CompetitorBatchOperations to use correct method signatures
  - [ ] Ensure all admin components work with corrected service methods

### Phase 5: Test File Updates
- [ ] **5.1** Update unit test expectations
  - [ ] Fix competitorAnalysisService.test.ts parameter expectations
  - [ ] Update mock objects to match corrected interfaces
  - [ ] Ensure all tests pass with updated method signatures

- [ ] **5.2** Add missing test coverage
  - [ ] Add tests for newly corrected methods
  - [ ] Ensure error handling paths are tested

### Phase 6: Integration & Validation
- [ ] **6.1** Cross-service dependency validation
  - [ ] Ensure all services work together with corrected interfaces
  - [ ] Test data flow between components and services
  - [ ] Validate error handling across the application

- [ ] **6.2** Build validation
  - [ ] Run full TypeScript compilation
  - [ ] Fix any remaining type errors
  - [ ] Ensure no new errors are introduced

- [ ] **6.3** Runtime testing
  - [ ] Test core functionality (/company-profile, /api-keys, /admin routes)
  - [ ] Verify database operations work correctly
  - [ ] Test error scenarios and edge cases

## Error Categories Summary
- **Interface/Type Mismatches**: 15 errors
- **Method Parameter Issues**: 14 errors  
- **Database Schema Issues**: 8 errors
- **Missing Properties**: 7 errors
- **Service Integration Issues**: 6 errors

## Dependencies & Risk Assessment
- **High Risk**: Core type definition changes (could break many files)
- **Medium Risk**: Database schema alignment (affects data persistence)
- **Low Risk**: Method signature fixes (mostly isolated changes)

## Estimated Completion Time
- Phase 1-2: ~2-3 hours (Core types and database alignment)
- Phase 3-4: ~2-3 hours (Service methods and components)  
- Phase 5-6: ~1-2 hours (Tests and validation)

**Total Estimated Time**: 5-8 hours of systematic implementation

---

*This plan ensures all build errors are addressed systematically without introducing new issues. Each checkbox represents a discrete, testable unit of work.*