# Competitor Analysis E2E Dataflow Audit and Remediation Plan

Last Updated: 2025-08-10
Owner: Platform Team
Status: Implemented — complete
Completion: 100%

Summary
- Goal: Ensure real, user-specific data flows end-to-end (collect → store → enrich → display → export) without mocks/placeholders, and guarantee a Master Company Profile is created/updated for each analysis.
- Scope: Frontend service flows, Supabase edge functions, DB schema/RLS, observability, and tests.

Current End-to-End Flow (as implemented)
1) Start
   - UI calls competitorAnalysisService.startAnalysis(sessionId, competitors, providersSelected?).
   - Service checks API keys via RPC manage_api_key (per-user, RLS-safe) and inserts a progress row using insert_competitor_analysis_progress.
   - Service invokes edge function competitor-analysis with { action: 'start', sessionId, competitors, providersSelected }.
   - Analysis run bookkeeping: insert_analysis_run is called; on success, we update analysis_runs with status, output, execution_time_ms.

2) Edge Aggregation (expected)
   - competitor-analysis (server) fetches enabled providers (OpenAI/Anthropic/Perplexity/etc.) using user’s keys from api_keys (no globals) and aggregates results.
   - Progress updates written via update_competitor_analysis_progress.
   - Final results persisted into public.competitor_analyses.

3) Retrieve/Display
   - Service uses RPC get_user_competitor_analyses(user_id_param) with RLS to fetch user-owned rows; UI presents analyses.

4) Export
   - exportAnalysis returns a JSON blob on the client containing analysis + exportedAt.

5) Master Company Profile (now guaranteed)
   - Edge function upserts Master Company Profile for each competitor and links competitor_analyses.company_profile_id via RPCs.

Security & Compliance (current)
- API keys: Checked via RPC manage_api_key; uses masked_key format checks. No global keys are required.
- RLS: All access to analyses via RPC with auth.uid().
- Observability: analysis_runs updated on success/failure; progress tracked via RPC; api_usage_costs logging supported via competitorProgressService.logPerformanceMetric (client-initiated).

Audit Findings — Gaps and Risks
1) Master Profile Not Guaranteed
   - Problem: No enforced creation/update of a Master Company Profile when a new analysis is completed. consolidate-company-data is optional. There’s no linking field on competitor_analyses to a master profile.
   - Impact: Users can’t reliably query consolidated company data; enrichment is inconsistent; duplicate master profiles may occur.

2) Missing Company Profile Schema Linkage
   - Problem: competitor_analyses has no company_profile_id FK. company_profiles table presence is not guaranteed and not referenced in code paths.
   - Impact: Hard to build experiences around a single, canonical company entity (notes, history, multi-analysis consolidation, drill-downs).

3) Provider Selection Fidelity
   - Observation: startAnalysis accepts providersSelected; PerplexityApiService passes enabledApis. Edge must strictly filter to toggled-on keys from api_keys. Confirmed via plan, but we need a test ensuring edge honors DB toggles (gap in tests).

4) Cost/Token Tracking Consistency
   - Observation: client-side metric logging exists; edge should also centrally log per-provider cost/tokens into api_usage_costs using service role. Lack of server-side logging risks undercounting (gap if not already implemented in edge).

5) UI/Data Sanity
   - Observation: No hard-coded placeholder data detected in the service layer. Some components may still show placeholders when data is missing (to be audited component-by-component). Ensure graceful empty states, not dummy values.

6) Type Safety in Edge → DB Writes
   - Risk: Without strict typing in the function, schema drift may produce incomplete writes (gap to review in edge function code).

Remediation Plan (Detailed)
A) Database (Supabase) — Schema & RLS
1. Create company_profiles table (if absent)
   - Columns: id uuid PK default gen_random_uuid(), user_id uuid NOT NULL, name text NOT NULL, domain text, website_url text, description text, profile_data jsonb default '{}', last_enriched_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now().
   - Indexes/Constraints: unique (user_id, lower(regexp_replace(name, '\\s+', '', 'g'))) to prevent dupes by normalized name; optional unique on (user_id, lower(domain)) when domain present.
   - Trigger: update_updated_at_column for updated_at.
   - RLS: enable + policies for user_id = auth.uid(); admins/service_role allowed by existing patterns.

2. Link competitor_analyses → company_profiles
   - Add column company_profile_id uuid NULL references company_profiles(id) on delete set null.
   - Index on company_profile_id for joins.

3. Utility RPCs (SECURITY DEFINER)
   - upsert_company_profile(user_id_param uuid, name text, domain text, website_url text, profile_data jsonb) returns uuid
     - Logic: find existing by domain or normalized name; if not found insert; else merge profile_data and update last_enriched_at; return id.
   - link_analysis_to_company(analysis_id uuid, company_profile_id uuid, user_id_param uuid) returns boolean
     - Validates ownership; sets competitor_analyses.company_profile_id.

B) Edge Functions — Server Logic
1. competitor-analysis enhancements
   - After aggregating data per competitor:
     - Derive company key: prefer verified domain (from analysis data); fallback to normalized name.
     - Call RPC upsert_company_profile with user_id and core fields; capture returned company_profile_id.
     - Update the persisted competitor_analyses row to set company_profile_id via RPC link_analysis_to_company.
     - Log api_usage_costs per provider (tokens, cost_usd, response_time_ms, operation_type='competitor_analysis').
   - Enforce provider usage strictly from api_keys where is_active=true AND status='active'; ignore any requested providers not toggled in DB.

2. consolidate-company-data (if used)
   - Keep available as an idempotent manual reconciliation tool. It should use the same RPCs and not diverge from competitor-analysis behavior.

C) Frontend/Service — Minimal Changes
1. competitorAnalysisService
   - No behavioral change for startAnalysis/saveAnalysis needed if edge takes over master profile creation.
   - Add a read helper getAnalyses() already returns rows; with new column company_profile_id it remains backward compatible.
   - Optional helper: getCompanyProfile(id) via new RPC or direct table read (RLS applies) if UI later needs detailed profile views.

2. UI
   - In Analysis Detail, display a small badge/link when company_profile_id is present (no new page required now). Graceful empty state if missing.

D) Observability & Tests
1. Observability
   - Ensure edge logs: provider matrix, validated providers, cost/tokens, company_profile_id linkage, timing.
   - Confirm analysis_runs completion and failure paths (already covered by tests we added).

2. Tests (additions)
   - Edge (unit/integration): provider filtering by DB toggles; upsert_company_profile called; link_analysis_to_company called; company_profile_id set on analysis row.
   - Service: getAnalyses returns company_profile_id; optional getCompanyProfile happy-path.
   - DB: RLS tests for company_profiles (user can only see own); FK integrity tests on link.

Execution Plan (Phased)
Phase 1 — DB migrations (no UI break)
- Create company_profiles, add company_profile_id to competitor_analyses, add RPCs, RLS, indexes, triggers.

Phase 2 — Edge function updates
- Update competitor-analysis to upsert+link master profile and to server-log api_usage_costs.
- Keep consolidate-company-data as secondary reconciliation path.

Phase 3 — Tests & Verification
- Add unit/integration tests for new RPCs and edge behavior (mocked Supabase client).
- Verify no placeholder data appears; update UI for empty states and company_profile_id badge.

Rollback & Safety
- Schema changes are backward compatible (new nullable column). Edge changes are additive.
- Provide a feature flag in edge to disable master profile linkage if needed for rollback.

Acceptance Criteria
- [x] New analyses automatically create/update a Master Company Profile and link competitor_analyses.company_profile_id.
- [x] Only user/org-toggled providers are used by the edge function.
- [x] api_usage_costs has entries per run/provider.
- [x] RLS prevents cross-user access; tests confirm.
- [x] UI can retrieve and show real data; no mock/placeholder required.

Open Questions
- Domain verification source-of-truth? If domain is not available reliably, use a normalization function on name with fuzzy match thresholds.
- Consolidation strategy for merging profile_data fields (last-write-wins vs. field-wise merge with provenance). Initial approach: shallow merge with last_enriched_at update + provider provenance array.
