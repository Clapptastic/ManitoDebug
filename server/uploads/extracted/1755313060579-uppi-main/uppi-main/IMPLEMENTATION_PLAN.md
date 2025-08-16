# Implementation Plan – Competitor Analysis Reliability

Last Updated: 2025-08-11

## Stage 1: Analysis runs retention trigger
Goal: Keep only the last 5 analysis runs per user and run type via DB trigger.
Success Criteria: New inserts create the run and prune oldest rows (>5) for same (user_id, run_type).
Tests: Insert >5 dummy runs and verify only 5 remain (DB-level or integration test).
Status: Complete (2025-08-11)

## Stage 2: Edge function resiliency (aggregate-analysis)
Goal: Avoid 500s when provider results fail; return 200 with partial data + error metadata.
Success Criteria: Function responds with {success:false|true, partial:true, errors:[...]} and page renders fallback content.
Tests: Simulate invalid/missing provider keys; expect graceful response, no 500.
Status: In Progress

## Stage 3: Client auth + RLS adherence for analysis_runs
Goal: Ensure mutations filter by user_id and only run when authenticated; avoid 403.
Success Criteria: Updates/PATCHes succeed for owner; unauthorized attempts blocked. No 403 in normal flow.
Tests: Start/complete analysis while signed-in; verify run status transitions without RLS errors.
Status: Complete (2025-08-11)

## Stage 4: Detail page empty-state + toasts
Goal: Show clear empty-state and actionable toasts when no data/partial data.
Success Criteria: Empty-state visible with guidance; retry actions available.
Tests: Navigate to details for missing/partial analyses; verify UX.
Status: Not Started

## Stage 5: Edge Functions Audit
Goal: Harden and secure unknown/failing functions (api-cost-tracker, data-quality-analyzer, package-manager, analyze-*, prompt-get).
Status: Complete

## Stage 6: Verification & Tests
Goal: Lightweight tests to validate admin navigation and settings integration.
Artifacts:
- src/components/admin/layout/__tests__/AdminNavItems.test.ts
- src/pages/admin/__tests__/SettingsPage.featureFlags.test.tsx
Status: Complete
