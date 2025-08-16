# Implementation Plan – Competitor Analysis Details Anti-Loop Hardening

Last updated: 2025-08-10
Owner: Platform Engineering
Scope: Fix excessive refetch loops on Competitor Analysis Details page and add safeguards, tests, and documentation.

## 1) Summary
Users observed repeated "Fetching analysis with ID" and "Normalized analysis loaded" logs and excessive reload behavior on route:
/market-research/competitor-analysis/details/:analysisId

The goal was to eliminate redundant/parallel fetches while preserving realtime updates and auth-driven refreshes.

## 2) Objectives
- Prevent parallel fetches and rapid consecutive refetches
- Avoid StrictMode mount double-fetching
- Throttle realtime-triggered refetches
- Avoid unnecessary React state updates when result is unchanged
- Keep full feature parity and user experience
- Add tests to prevent regressions

## 3) Changes Implemented (Minimal & Safe)
File: src/components/competitor-analysis/report/hooks/useAnalysisReport.tsx
- Added refs to control fetch cadence and duplication:
  - fetchInProgressRef: blocks concurrent fetches
  - lastFetchAtRef: blocks refetches within 500ms
  - initRef: guards StrictMode initial double-invocation
  - lastSerializedRef: dedupes setAnalysis when normalized payload unchanged
  - lastIdRef: resets initialization when route param changes
- Throttled realtime updates to 1.5s and limited event to UPDATE only; gated against in-flight fetches
- Gated auth listener re-fetch to avoid churn; unsubscribes on cleanup
- Converted all toast calls to use toastRef to keep callbacks stable

Notes:
- Business logic and UI remain unchanged; only side-effect orchestration was touched.
- Type definitions were not changed; consistency maintained.

## 4) Test Coverage Added
File: src/components/competitor-analysis/report/hooks/__tests__/useAnalysisReport.test.tsx
- Ensures the first fetch runs once and rapid subsequent fetches are throttled
- Ensures no state update when normalized result is identical (reference remains stable)

To run tests:
- pnpm test or npm test

## 5) Progress Checklist
- [x] Prevent parallel fetches via fetchInProgressRef
- [x] Add 500ms fetch throttle via lastFetchAtRef
- [x] StrictMode double-fetch guard via initRef
- [x] Throttle realtime updates to 1.5s; UPDATE-only channel
- [x] Gate auth re-fetch and cleanup subscription
- [x] Skip redundant setAnalysis using lastSerializedRef
- [x] Reset initialization when route ID changes via lastIdRef
- [x] Add unit tests for throttle and no-op updates
- [ ] Manual verification on the details route with logs open

## 6) Verification Steps
1) Navigate to: /market-research/competitor-analysis/details/:analysisId
2) Open DevTools console and verify:
   - A single initial "Fetching analysis with ID"
   - At most one "Normalized analysis loaded" for initial render
   - Trigger a data change (refresh action) and confirm at most one refetch within ~1.5s window
   - No repeated bursts during idle
3) Logout/Login (or wait for auth event): confirms a single guarded re-fetch without loops

If issues persist:
- Check for multiple component mounts of AnalysisReportContainer on the same route
- Confirm no external code is calling fetchAnalysis in a loop

## 7) Realtime Considerations
- Listening for UPDATE only reduces noise from INSERT/DELETE or unrelated changes
- 1.5s throttle prevents cascaded refetches when multiple row columns update near-simultaneously
- No database-level changes required per current Supabase realtime setup

## 8) Routing & Security
- Routing unchanged; still supports UUIDs, analysis_id, session_id, and name fallbacks
- RLS unaffected; all queries remain user-scoped
- No new sensitive data paths introduced

## 9) Rollback Plan
- Revert to previous version of useAnalysisReport.tsx if any regression is detected
- Tests can be temporarily skipped by naming convention, though not recommended

## 10) Next Actions (Optional)
- [ ] Add a light-weight diff util for deep-equality to avoid JSON.stringify, if performance profiling indicates need
- [ ] Add integration test ensuring realtime UPDATE triggers at most one refetch in a burst
- [ ] Add performance telemetry counters to measure avoided duplicate requests

## 11) Related Links
- Hook: src/components/competitor-analysis/report/hooks/useAnalysisReport.tsx
- Container: src/components/competitor-analysis/report/AnalysisReportContainer.tsx
- Tests: src/components/competitor-analysis/report/hooks/__tests__/useAnalysisReport.test.tsx
- Supabase Edge Functions (dashboard): https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/functions


---

# Implementation Plan – Admin Master Profiles (End-to-End)

Last updated: 2025-08-10
Owner: Platform Engineering
Scope: Deliver full, working admin flows for Master Profiles without stubs or mock data.

## 1) Objectives
- Provide working list and detail views for master_company_profiles
- Integrate existing edge functions for consolidation, validation, and aggregation
- Secure admin-only access for sensitive routes
- Keep existing management page intact (no removal), only add routes that use existing pages

## 2) Changes Implemented
- Routing
  - Added routes:
    - /admin/master-profiles/list → MasterCompanyProfiles (super admin only)
    - /admin/master-profiles/:profileId → MasterCompanyProfileDetail (super admin only)
  - Kept /admin/master-profiles mapping to MasterProfileManagement unchanged
- Security
  - Wrapped new routes with AdminRoute superAdminOnly
- Backend Integration
  - Confirmed edge functions present: bulk-consolidate-companies, enhanced-ai-validation, aggregate-analysis
  - Confirmed master_company_profiles table and columns match service usage

## 3) Verification Steps
1) Navigate to /admin/master-profiles/list to see profiles
2) Click “View Details” to go to /admin/master-profiles/:id
3) Use “Validate” to invoke enhanced-ai-validation and observe status update
4) Use “Compute Combined Analyses” on list page to trigger aggregate-analysis for all analyses
5) Confirm no console errors, and data loads correctly

## 4) Progress Checklist
- [x] Route additions for list and detail
- [x] Admin guard (super_admin) on new routes
- [x] Edge function integrations verified
- [x] Expose a link from Management page to the list
- [x] Implement UI polish: breadcrumbs, CTA, SEO meta for dashboard

## 5) Rollback Plan
- Remove the two route entries and their imports
- Revert UI-only changes in MasterProfileManagement and MasterProfileDashboard
- No schema changes were made for this step

## 6) Links
- Admin Routes: src/routes/AdminRoutes.tsx
- Management Page: src/pages/admin/MasterProfileManagement.tsx
- Dashboard: src/components/admin/MasterProfileDashboard.tsx
- List Page: src/pages/admin/MasterCompanyProfiles.tsx
- Detail Page: src/pages/admin/MasterCompanyProfileDetail.tsx
- Edge Functions: https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/functions

---

# Implementation Plan – Refactor /admin/master-profiles UI/UX

Last updated: 2025-08-10
Owner: Platform Engineering
Scope: Refactor the /admin/master-profiles page to align with new functionality and design/UX best practices without altering business logic.

## Objectives
- Improve navigation clarity with breadcrumbs and explicit CTA to List
- Add SEO best practices (title, meta description, canonical)
- Fix minor UI bug in FlowDiagram combined result styling
- Keep layout responsive and accessible
- Add tests (unit + e2e smoke)

## Changes Implemented
- MasterProfileDashboard: Added Helmet SEO, breadcrumb nav, CTA button to List
- MasterProfileManagement: Added "View Profiles" button in header
- FlowDiagram: Fixed className bug using cn utility
- Tests: Jest unit tests for dashboard; Playwright e2e smoke for route

## Verification
- Unit tests pass locally for dashboard component
- E2E smoke test navigates to /admin/master-profiles and detects expected UI (dashboard or auth guard)

## Checklist
- [x] Add SEO tags to dashboard
- [x] Add breadcrumb and CTA
- [x] Link from management header to list
- [x] Fix FlowDiagram className bug
- [x] Add unit test for dashboard
- [x] Add e2e smoke test

