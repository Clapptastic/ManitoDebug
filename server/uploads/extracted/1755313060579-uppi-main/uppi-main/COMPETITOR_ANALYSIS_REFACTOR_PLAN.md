# Competitor Analysis System Refactor Plan

**Project Status:** Pre-Launch (No Live Users)  
**Approach:** Aggressive Refactoring for Clean Foundation  
**Started:** August 3, 2025

## Overview
This plan addresses TypeScript interface mismatches, consolidates duplicate types, and ensures the competitor analysis system has a clean, maintainable foundation before launch.

---

## Phase 1: Assessment and Preparation
- [x] **1.1** Audit current TypeScript interfaces across the codebase
- [x] **1.2** Document all competitor analysis related files
- [x] **1.3** Map database schema fields to current interface properties
- [x] **1.4** Identify duplicate/conflicting type definitions
- [x] **1.5** Create backup of current working state

---

## Phase 2: Database Schema Analysis
- [x] **2.1** Export complete competitor_analyses table schema
- [x] **2.2** Document all column names, types, and constraints
- [x] **2.3** Identify unused/legacy columns
- [x] **2.4** Verify relationship to other tables
- [x] **2.5** Create authoritative field mapping document

---

## Phase 3: TypeScript Interface Consolidation
- [x] **3.1** Create single source of truth interface `CompetitorAnalysisEntity`
- [ ] **3.2** Replace `CompetitorData` interface usage
- [ ] **3.3** Replace `CompetitorAnalysis` interface usage  
- [ ] **3.4** Replace `CompetitorAnalysisResult` interface usage
- [ ] **3.5** Update all import statements across codebase
- [ ] **3.6** Remove duplicate interface definitions

---

## Phase 4: Service Layer Refactoring
- [x] **4.1** Update `competitorAnalysisService.ts` interface imports
- [x] **4.2** Rebuild `convertToCSV()` method with complete field set
- [x] **4.3** Update `saveAnalysis()` method type handling
- [x] **4.4** Fix `getAnalyses()` return type consistency
- [x] **4.5** Update `startAnalysis()` request/response types
- [ ] **4.6** Add comprehensive error handling for type mismatches

---

## Phase 5: Component and Hook Updates ✅
- [x] **5.1** Update `useCompetitorAnalysis.ts` hook types
- [x] **5.2** Update `useSavedAnalyses.ts` hook types
- [x] **5.3** Fix `CompetitorAnalysisPage.tsx` type references
- [x] **5.4** Fix `SavedCompetitorAnalysesPage.tsx` type references
- [x] **5.5** Update `ResultsDisplay.tsx` component types
- [x] **5.6** Update `ModernResultsDisplay.tsx` component types

---

## Phase 6: Export System Enhancement
- [ ] **6.1** Design comprehensive CSV column structure
- [ ] **6.2** Implement robust data formatting for complex fields
- [ ] **6.3** Add data validation before export
- [ ] **6.4** Handle null/undefined values gracefully
- [ ] **6.5** Add export progress indicators
- [ ] **6.6** Test export with various data scenarios

---

## Phase 7: Edge Function Updates
- [ ] **7.1** Update competitor-analysis edge function types
- [ ] **7.2** Ensure db-operations.ts handles new structure
- [ ] **7.3** Update shared types in edge function folder
- [ ] **7.4** Test edge function with updated data structure
- [ ] **7.5** Verify API response format consistency

---

## Phase 8: Testing and Validation
- [ ] **8.1** Test complete competitor analysis workflow
- [ ] **8.2** Verify CSV export includes all expected fields
- [ ] **8.3** Test save/load functionality with new types
- [ ] **8.4** Validate edge function integration
- [ ] **8.5** Check console for any remaining TypeScript errors
- [ ] **8.6** Test error handling scenarios

---

## Phase 9: Code Quality and Documentation
- [ ] **9.1** Add JSDoc comments to new interfaces
- [ ] **9.2** Update README documentation
- [ ] **9.3** Create type definition documentation
- [ ] **9.4** Remove deprecated code comments
- [ ] **9.5** Add inline code documentation for complex logic

---

## Phase 10: Final Verification
- [ ] **10.1** Run full TypeScript type checking
- [ ] **10.2** Test all competitor analysis features end-to-end
- [ ] **10.3** Verify no console errors in development
- [ ] **10.4** Confirm build process completes successfully
- [ ] **10.5** Performance test with large datasets

---

## Files to be Modified

### Core Type Definitions
- [ ] `src/types/competitor/unified-types.ts` - Consolidate interfaces
- [ ] `src/types/competitor/api-response.ts` - Update API types
- [ ] `src/services/competitorAnalysisService.ts` - Service refactor

### Components and Hooks
- [ ] `src/hooks/useCompetitorAnalysis.ts`
- [ ] `src/hooks/useSavedAnalyses.ts`
- [ ] `src/pages/CompetitorAnalysisPage.tsx`
- [ ] `src/pages/SavedCompetitorAnalysesPage.tsx`
- [ ] `src/components/competitor-analysis/ResultsDisplay.tsx`
- [ ] `src/components/competitor-analysis/modern/ModernResultsDisplay.tsx`

### Edge Functions
- [ ] `supabase/functions/competitor-analysis/index.ts`
- [ ] `supabase/functions/shared/competitor-analysis/types.ts`
- [ ] `supabase/functions/shared/db-operations.ts`

### Documentation
- [ ] `src/docs/market-research/competitor-analysis.md`
- [ ] Update any additional documentation files

---

## Progress Tracking

**Current Status:** Phase 4 Complete - Service Layer Updated  
**Completed Items:** 14/45  
**Estimated Completion:** Phase 6 by end of day

### Notes and Issues
- Database function issue resolved ✅  
- Core CompetitorAnalysisEntity interface created ✅
- CSV export now includes full dataset ✅
- Service layer updated with comprehensive data export ✅
- Remaining: Fix TypeScript compatibility issues in components/hooks

---

## Rollback Plan
If issues arise:
1. Revert to git commit before refactor begins
2. Apply minimal fixes to original structure
3. Document lessons learned for future refactor attempt

---

**Last Updated:** August 3, 2025  
**Next Review:** After Phase 3 completion