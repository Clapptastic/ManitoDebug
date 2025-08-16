# Competitor Analysis Backend ⇄ Frontend Dataflow Audit
Date: 2025-08-10

## Scope
Comprehensive audit of all competitor analysis backend capabilities and their mapping to the frontend UI. Identifies any mock/placeholder data, visibility gaps, and proposes a plan to ensure end-to-end dataflow reliability without duplicate/conflicting code.

---

## Backend Inventory (Supabase Edge + DB)

- Edge Functions
  - competitor-analysis
    - Orchestrates multi-provider AI calls (OpenAI, Anthropic, Perplexity, Gemini, Groq, Cohere as available) with providersSelected filtering
    - Persists results to public.competitor_analyses (insert/update), links to company_profiles
    - Tracks progress via RPC: insert_competitor_analysis_progress, update_competitor_analysis_progress
    - Writes audit_logs and api_usage_costs; enforces budget via check_user_cost_allowed
    - Uses user-scoped API keys via manage_api_key (select, get_for_decryption)
  - competitor-analysis-gate
    - Feature gating and provider readiness checks; responds with can_proceed/unlocked and provider statuses
  - analysis-export
    - Generates JSON/CSV for an analysis id (PDF is client-side)
  - data-quality-analyzer
    - Computes quality metrics and persists them to competitor_analyses; logs internal zero-cost usage
- Shared
  - functions/shared/api-client.ts (provider-aware client used by functions)
  - functions/shared/api-providers.ts (baseUrl/defaultModel/timeouts)
- Database functions used by the flow
  - insert_competitor_analysis_progress, update_competitor_analysis_progress
  - insert_analysis_run (logging), get_user_competitor_analyses (user-scoped list)
  - upsert_company_profile, link_analysis_to_company
  - manage_api_key (select, get_for_decryption)
  - check_user_cost_allowed, set_user_cost_limit

---

## Frontend Inventory (React)

- Services/Hooks
  - src/services/competitorAnalysisService.ts
    - getAnalyses() via RPC get_user_competitor_analyses
    - startAnalysis(sessionId, competitors, providersSelected) → invoke competitor-analysis (action: start) and create progress/run logs via RPC
    - save/update/delete/export analysis (DB + client Blob export)
    - getAvailableProviders() from manage_api_key; validate logic for keys
  - src/hooks/useCompetitorAnalysis.ts
    - Orchestrates UI flow: start, progress realtime, fetch/save/update/delete/export
    - Realtime subscription to competitor_analysis_progress and Saved Analyses refresh
    - Fallback behavior if session_id match is missing (see Gaps)
  - src/components/competitor-analysis/report/hooks/useAnalysisReport.tsx
    - Details page data loader: RPC-first; normalizes analysis_data into top-level fields (strengths, weaknesses, opportunities, threats, cost_breakdown, total_api_cost, source_citations, confidence_scores, market_position_data, technology_innovation_data, customer_journey_data)
  - src/hooks/useCompetitorGate.ts
    - Wraps competitor-analysis-gate (check/unlock)
- UI Pages/Components
  - CompetitorAnalysisDashboard (start flow, lists, progress, warnings)
  - AnalysisDetailPage → AnalysisDetailView → EnhancedAnalysisDetailView and sections (reads source_citations, confidence_scores, market_position_data, technology_innovation_data, customer_journey_data, cost_breakdown/total_api_cost)
  - ExportAnalysisDialog → analysis-export (CSV/JSON)

---

## End-to-End Dataflow Map

1) Start
- UI: CompetitorInput → useCompetitorAnalysis.startAnalysis(competitors, focusAreas, providersSelected)
- Service: competitorAnalysisService.startAnalysis(sessionId, competitors, providersSelected)
  - RPC: insert_competitor_analysis_progress, insert_analysis_run
  - Edge: invoke competitor-analysis with body { action: 'start', competitors, sessionId, providersSelected }

2) Orchestration & Persistence (Edge)
- Loads user API keys via manage_api_key (select/get_for_decryption)
- Parallel provider calls (selected providers only); costs tracked in api_usage_costs
- Fuses results, computes confidence_scores, data_quality_score, builds source_citations
- Upsert/insert into competitor_analyses (includes session_id, analysis_id, extended *_data fields)
- Updates progress via update_competitor_analysis_progress

3) UI Updates
- Realtime subscription (useCompetitorAnalysis) on competitor_analysis_progress for sessionId
- On completion, fetches get_user_competitor_analyses; Results tab shows formatted session rows
- Saved analyses list refreshed; Details page uses useAnalysisReport (RPC-first) and normalization

4) Export
- ExportAnalysisDialog calls analysis-export for JSON/CSV; client-only PDF

---

## Findings

- Data visibility: All persisted fields from competitor-analysis are surfaced in frontend detail views:
  - source_citations, confidence_scores, cost_breakdown/total_api_cost, market_position_data, technology_innovation_data, customer_journey_data are consumed by Enhanced* views and report sections
- Provider selection: providersSelected is propagated from UI → service → edge and stored in progress metadata (verified by tests)
- API keys: UI gating and ModernApiKeyAlert rely on getAvailableProviders(); gate function is integrated in admin tools and start buttons
- No runtime mock/placeholder data found in competitor analysis UI; only placeholder text (inputs) and unit tests use mocks
- Console shows "[Circular Reference ...]" inside normalized object logs; this is only a logging artifact (safe). It does not affect rendering

### Gaps/Risks
1) Result association fallback
- When session_id match yields 0 rows, useCompetitorAnalysis falls back to most recent completed analyses to populate the Results tab
- Risk: in concurrent runs, this may display unrelated analyses temporarily
2) Edge → session_id consistency
- Edge function writes session_id consistently, but if any error occurs before persistence, the UI relies on realtime completion to fetch rows; transient empty states can occur
3) Gate observability
- Gate outcomes are not surfaced to end users except via error toasts; could include a small UI badge indicating which providers were used/skipped

---

## PLAN: CA-Dataflow-Alignment-2025-08-10

Goal: Keep frontend fully aligned with backend capabilities while preventing regressions, without duplicating/conflicting code. Deliver a 100% functioning end-to-end competitor analysis experience for each user, using only their user/org-scoped API keys.

Implementation Strategy: Phased, test-first, minimal-touch changes focusing on the single service boundary, single detail loader, and existing edge functions.

Phase 0 — Preconditions & Safety Nets
- Confirm authentication: verify supabase.auth is configured and user is present before any analysis action.
- Secrets & providers: ensure user/org-scoped API keys exist via manage_api_key (UI relies on getAvailableProviders and competitor-analysis-gate).
- DB health check: run linter and verify RLS on:
  - competitor_analyses, competitor_analysis_progress, api_keys, analysis_runs
  - RPCs: insert_competitor_analysis_progress, update_competitor_analysis_progress, get_user_competitor_analyses
- Logging: verify audit_logs and api_usage_costs inserts from edge functions are succeeding; check check_user_cost_allowed returns allowed for typical runs.

Phase 1 — Tests First (Guardrails and Acceptance)
- Add integration tests to verify Details view renders:
  - cost_breakdown total is displayed
  - source_citations count > 0
  - confidence_scores object present and rendered
- Add test: when gate denies, UI shows actionable message and competitor-analysis edge function is NOT invoked
- Add test: providersSelected propagates UI → service → edge and is stored in progress metadata
- Add test: no direct external AI calls from frontend (enforce edge-only policy)
- Types in tests: import PostgrestResponse (not PostgrestResponseSuccess) and ensure full mock fields where applicable; no any types

Phase 2 — Tighten Result Association (useCompetitorAnalysis)
- Change fallback behavior:
  - Only fallback when no rows match session_id
  - Timebox to last N minutes (default: 10; configurable constant)
  - Require competitor set match: compare sorted normalized competitor names against progress.metadata.competitors
  - Restrict to current user
- Add inline comments explaining rationale and risks (concurrent runs)
- Add unit tests:
  - Session match wins over fallback
  - Fallback only triggers with timebox and competitor match
  - No match → empty state with guidance

Phase 3 — Gate & Provider Transparency (UI)
- Results list and Details header: display providers_used badge group and an indicator if any selected provider was skipped (invalid/missing key)
  - Source fields: analysis.analysis_data.providers_used, cost_breakdown
  - Reuse design system tokens; avoid custom colors
- Small tooltip or aside explaining why providers were skipped with actionable link to API key settings

Phase 4 — Detail Data Normalization (useAnalysisReport)
- Keep this as the single detail loader/normalizer. Ensure mapping covers:
  - strengths, weaknesses, opportunities, threats
  - cost_breakdown, total_api_cost, actual_cost
  - source_citations, confidence_scores
  - market_position_data, technology_innovation_data, customer_journey_data
  - data_quality_score, data_completeness_score, market_sentiment_score
- Provide safe defaults (empty arrays/objects) to avoid rendering gaps
- Document normalization rules inline; note known harmless “[Circular Reference …]” logging artifact
- Add unit tests to assert normalization produces expected shapes for partial payloads

Phase 5 — Service Boundary Hardening (competitorAnalysisService)
- Single boundary for all operations: getAnalyses, startAnalysis, save/update/delete/export, getAvailableProviders
- Ensure RPC-first fetching via get_user_competitor_analyses; use .maybeSingle() where appropriate (avoid .single() when optional)
- Ensure providersSelected in startAnalysis is forwarded to edge and included in progress metadata
- Types:
  - In service code, prefer Supabase response types (PostgrestResponseSuccess for success paths)
  - In test files, import and use PostgrestResponse (per project rule)
- Add robust error mapping and toast messaging; never swallow errors

Phase 6 — Edge Functions Verification (competitor-analysis & gate)
- competitor-analysis:
  - Loads user API keys via manage_api_key(get_for_decryption)
  - Honors providersSelected; parallelizes only selected providers
  - Persists providers_used, cost breakdown, citations, confidence_scores, extended *_data fields
  - Updates progress via update_competitor_analysis_progress
  - Writes api_usage_costs; enforces check_user_cost_allowed before large calls
  - Links company profiles via upsert_company_profile + link_analysis_to_company when possible
- competitor-analysis-gate:
  - Validates provider readiness per user keys
  - Returns can_proceed/unlocked and provider statuses
- analysis-export and data-quality-analyzer:
  - Confirm they read existing analysis rows and update quality metrics
- Add smoke tests (edge-mocked in FE tests) to assert request bodies and critical response fields are handled

Phase 7 — Admin Diagnostics (no backend change)
- Add compact panel (admin-only) to read analysis_runs by session_id, show status, duration, and errors; provide correlation to progress rows

Phase 8 — Realtime and Progress UX
- Verify realtime subscription on competitor_analysis_progress filters by session_id and user_id
- Compute derived percentage from progress_percentage or completed_competitors/total_competitors consistently
- Ensure unsubscribe/cleanup and heartbeat tracking via track_realtime_subscription

Phase 9 — Security & Policy Review
- Validate RLS policies allow users to read only their own analyses/progress
- Verify api_keys access respects can_access_api_key; ensure no frontend exposure of raw secrets
- Confirm storage buckets used by this feature have appropriate visibility (competitor-logos is public by design)

Phase 10 — Rollout & Monitoring
- Feature flag new fallback behavior (config constant) for quick rollback if needed
- Ship with added tests; monitor audit_logs, api_usage_costs, and system_health metrics for anomalies
- Provide “Run Diagnostics” link for admins to quickly inspect recent runs

Execution Order (Detailed)
1) Implement tests (Phase 1) and ensure current behavior is captured
2) Implement Phase 2 fallback changes in useCompetitorAnalysis with comments
3) Implement Phase 3 provider badges in Results and Details header
4) Validate/extend normalization in useAnalysisReport (Phase 4) and add documentation comments
5) Harden competitorAnalysisService types and error handling (Phase 5)
6) Verify edge functions alignment (Phase 6) with focused smoke tests
7) Add Admin Diagnostics UI (Phase 7)
8) Realtime UX verification (Phase 8)
9) Run Security/Policy Review (Phase 9)
10) Rollout with flag, monitor (Phase 10)

Artifacts To Update (No Duplication)
- Service boundary: src/services/competitorAnalysisService.ts
- Hooks: src/hooks/useCompetitorAnalysis.ts, src/hooks/useCompetitorGate.ts, src/hooks/useCompetitorAnalysisProgress.ts, src/components/competitor-analysis/report/hooks/useAnalysisReport.tsx
- UI: Results list, AnalysisDetailView → EnhancedAnalysisDetailView header, AnalysisReportHeader, provider badges
- Tests: Add/update unit/integration tests as described in Phases 1–4
- Docs: Inline comments per Phases 2 and 4; this audit doc

Rollback Strategy
- Toggle off tightened fallback (config constant)
- Revert provider badges UI behind a feature flag if necessary
- Tests remain as guardrails to catch regressions upon re-enabling

Acceptance Criteria
- No mismatched results in concurrent runs (session-first, timeboxed, competitor-matched fallback)
- Providers used are visible to users; skipped providers surfaced with actionable guidance
- All key backend fields render in Details without manual refresh
- Guardrail tests pass; no direct external calls leak to frontend; proper Supabase types are used

Plan Extensions: Infra & E2E Hardening (2025-08-10)
- Database triggers & timestamps
  - Ensure cleanup_old_analysis_runs trigger fires on INSERT to analysis_runs (already defined); verify attachment and behavior in tests
  - Ensure updated_at triggers exist and are attached for competitor_analysis_progress and competitor_analyses (update_updated_at_progress, update_updated_at_column)
  - Never manually set DB-managed timestamps in code
- Indexing for performance and correctness
  - Add/verify indexes: competitor_analyses (user_id, created_at DESC), (session_id), competitor_analysis_progress (user_id, session_id), api_usage_costs (user_id, date), analysis_runs (user_id, session_id)
  - Verify get_user_competitor_analyses ORDER BY created_at uses an index
- Realtime configuration checks
  - Confirm tables used for realtime (competitor_analysis_progress) are included in publication and emit full row data; verify client subscription filters by session_id and user_id
  - Presence/heartbeat: verify track_realtime_subscription usage and add tests
- Edge resiliency
  - Add exponential backoff and per-provider circuit breaker in competitor-analysis when providers rate limit or fail; short-circuit skipped providers and record in providers_used/skipped metadata
  - Implement request budget guard using check_user_cost_allowed before expensive calls; fail fast with actionable errors
- End-to-end Playwright coverage
  - Start → realtime progress → completion → details render (cost_breakdown total, providers_used badge, citations count, confidence scores)
  - Gate denied path (no invoke), missing keys UX, and concurrent runs (validate tightened fallback)
  - Export JSON/CSV flow renders and downloads; confirm content includes providers_used, cost_breakdown, source_citations, confidence_scores, totals
- Org/user-scoped keys and RLS verification
  - Validate manage_api_key paths (insert/select/get_for_decryption/delete) respect can_access_api_key; ensure UI never exposes raw secrets
  - If org contexts are enabled, verify check_organization_permission gating UI/edge behavior for org-owned analyses/keys
- Data retention & cleanup policy
  - Define retention: progress rows older than 30 days pruned via scheduled job/function; maintain last 5 analysis_runs per user (trigger already in place)
  - Ensure audit_logs and api_usage_costs retention aligns with compliance requirements
- Security posture & logs
  - Investigate recurring "permission denied for table system_components" in Postgres logs; remove any non-essential queries from client/edge or add admin-only path with proper RLS/policies
  - Re-run linter and manual RLS review for all touched tables; add tests to prevent accidental privilege escalation
- Export schema stability
  - Add contract tests to ensure analysis-export output schemas include all key fields; prevent breaking changes via fixture comparisons


---

## Implementation Checklist — CA-Dataflow-Alignment-2025-08-10
Rule: After completing each task, check the box and save this file.

- [ ] Phase 0 — Preconditions & Safety Nets
  - [ ] Verify Supabase auth/session available before analysis actions
  - [ ] Verify user/org-scoped API keys via manage_api_key and gate
  - [ ] Run DB linter and verify RLS on key tables/RPCs
  - [ ] Validate audit_logs and api_usage_costs writes; check check_user_cost_allowed
- [x] Phase 1 — Tests First (Guardrails & Acceptance)
  - [x] Details view renders cost_breakdown total, source_citations count, confidence_scores
  - [x] Gate denied path shows actionable message; no competitor-analysis invocation
  - [x] providersSelected propagates UI → service → edge → progress metadata
  - [x] Frontend contains no direct external AI calls (edge-only)
- [x] Phase 2 — Tighten Result Association
  - [x] Implement session-first, timeboxed (10m) + competitor-name match fallback
  - [x] Add comments explaining rationale and risks
  - [x] Unit tests: session wins; fallback requires timebox+match; no match → empty state
- [x] Phase 3 — Gate & Provider Transparency (UI)
  - [x] Show providers_used badges; show skipped count with tooltip
  - [ ] Link to Settings for fixing keys
- [x] Phase 4 — Detail Data Normalization (useAnalysisReport)
  - [x] Normalize SWOT, costs (total_api_cost), citations, confidence
  - [x] Backfill extended fields (market/tech/customer journeys)
  - [x] Safe defaults; document normalization rules
  - [x] Unit tests for partial payloads
- [x] Phase 5 — Service Boundary Hardening
  - [x] Keep competitorAnalysisService as single boundary
  - [x] RPC-first fetching; use maybeSingle where appropriate
  - [ ] Types: service uses Supabase types; tests import PostgrestResponse
  - [x] Robust error mapping + toasts
- [x] Phase 6 — Edge Functions Verification
  - [x] competitor-analysis honors providersSelected, persists providers_used, costs, citations, confidence
  - [x] Progress updates via RPC; budget guard via check_user_cost_allowed
  - [x] Company linking via upsert_company_profile + link_analysis_to_company
  - [x] competitor-analysis-gate returns can_proceed/unlocked + provider statuses
  - [x] analysis-export/data-quality-analyzer paths confirmed
  - [x] Smoke tests for request/response handling in FE
- [ ] Phase 7 — Admin Diagnostics (UI Only)
  - [ ] Diagnostics panel reads analysis_runs by session_id and correlates to progress rows
- [ ] Phase 8 — Realtime & Progress UX
  - [x] Subscription filters by session_id + user_id
  - [x] Derived percentage computed consistently
  - [ ] Unsubscribe/cleanup; presence heartbeat tracked
- [x] Phase 9 — Security & Policy Review
  - [x] RLS confirms user-only access to analyses/progress
  - [x] api_keys guarded by can_access_api_key; no raw secrets in FE
  - [x] Storage bucket visibility validated
- [ ] Phase 10 — Rollout & Monitoring
  - [ ] Feature-flag fallback behavior for quick rollback
  - [ ] Monitor audit_logs/api_usage_costs/system_health after release
  - [ ] Admin Run Diagnostics link available

- [ ] Plan Extensions — Infra & E2E Hardening (2025-08-10)
  - [ ] Triggers: cleanup_old_analysis_runs attached; updated_at triggers on progress/analyses
  - [ ] Indexes: analyses(user_id, created_at), (session_id); progress(user_id, session_id); costs(user_id, date); runs(user_id, session_id)
  - [ ] Realtime: publication includes progress; full row data; filters validated
  - [ ] Edge resiliency: backoff + circuit breaker; record skipped providers; budget guard
  - [ ] E2E Playwright: start→progress→details→export; gate denied; concurrent runs fallback
  - [ ] Export contract tests ensure JSON/CSV include providers_used, costs, citations, confidence, totals
  - [ ] Org/user key RLS verified; org permission checks where applicable
  - [ ] Retention: prune old progress; keep last 5 runs per user; logs retention aligned
  - [ ] Security: resolve "permission denied for system_components"; linter + RLS tests pass

## Mock/Placeholder Usage Report
- No mock or placeholder data used in runtime UI for competitor analysis.
- Unit/integration tests use mocks as expected (e.g., ComprehensiveAnalysisButton.test.tsx). No action required.
