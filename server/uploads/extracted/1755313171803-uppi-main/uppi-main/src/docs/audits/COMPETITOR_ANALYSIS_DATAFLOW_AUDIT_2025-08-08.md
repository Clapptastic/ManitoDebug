# Competitor Analysis Backend ↔ Frontend Dataflow Audit
Date: 2025-08-08

Status: Action Required

## 1) Scope
Comprehensive audit of competitor analysis data flow across Supabase (tables, RPCs, Edge functions) and the React frontend (services, hooks, components). Identify mismatches, mock/placeholder usage, and blockers to showing results in the UI.

## 2) System Inventory (Relevant)
- Supabase Tables
  - public.competitor_analyses (RLS ON) — stores analyses
  - public.competitor_analysis_progress (RLS ON) — progress tracking
  - public.api_keys (RLS ON) — user/org keys
  - public.api_usage_costs — cost/metrics logging
- Supabase RPCs (present and used)
  - get_user_competitor_analyses
  - manage_api_key (select, get_for_decryption)
  - insert_competitor_analysis_progress
  - update_competitor_analysis_progress
- Edge Functions
  - competitor-analysis (primary pipeline)
  - comprehensive-competitor-analysis (proxy to competitor-analysis)
- Frontend
  - Service: src/services/competitorAnalysisService.ts
  - Hook: src/hooks/useCompetitorAnalysis.ts
  - UI: src/pages/competitor-analysis/CompetitorAnalysisDashboard.tsx
  - UI: src/components/competitor-analysis/CompetitorInput.tsx
  - UI: src/components/competitor-analysis/CompetitorAnalysisResults.tsx

## 3) Expected Dataflow (Design)
1. User starts analysis (UI) → useCompetitorAnalysis.startAnalysis(sessionId, competitors)
2. Service inserts progress via insert_competitor_analysis_progress
3. Service invokes edge function competitor-analysis with { sessionId, competitors, action: 'start' }
4. Edge orchestrates providers (OpenAI, optional Anthropic/Perplexity), logs costs, writes/updates competitor_analyses with final data, updates progress to completed
5. Frontend subscribes to progress via realtime and, on completion, displays results in Results tab and list views (saved analyses)

## 4) Observed Backend Behavior
- Edge function competitor-analysis (supabase/functions/competitor-analysis/index.ts):
  - Validates auth and retrieves user-specific provider keys via manage_api_key
  - Fans out calls to providers and logs API usage to api_usage_costs
  - Updates progress status via update_competitor_analysis_progress
  - RETURNS a “results” object in the HTTP response
  - DOES NOT persist competitor_analyses rows (missing insert/upsert)
  - BUG: Inside the per-competitor loop, the success path computes parsedData but never assigns it into results[competitor] (only the catch assigns failure). Therefore, results is empty on success.

## 5) Observed Frontend Behavior
- useCompetitorAnalysis:
  - Starts analysis, expects edge response.results to build formattedResults
  - On empty results, falls back to fetching DB by session_id (we added a fallback + realtime completion handler)
  - Prior to fix, UI marked status completed even when no data existed, so Results tab showed “No Results Yet”
- CompetitorAnalysisDashboard: now shows a spinner in Results when status = analyzing; will auto-populate on completion via realtime fetch

## 6) Mismatches / Issues
- Mismatch A: Edge function does not populate results on success (results remains empty)
- Mismatch B: Edge function does not write to competitor_analyses; frontend fallback expecting DB rows by session_id will not find data unless user explicitly saves
- Mismatch C: Orchestrator path (src/services/api/apiOrchestrator.ts) exists but primary UI flow uses competitorAnalysisService; ensure no conflicting pathways are used simultaneously
- Mock/Placeholder Data:
  - Some services unrelated to this flow use mock data (e.g., api-keys model management, AI service) — no direct impact on competitor-analysis pipeline
  - TODO in EnhancedAnalysisDetailView (delete not implemented) — minor and unrelated to immediate dataflow

## 7) Conclusion
Backend pipeline is functionally close but missing two critical steps: (1) assigning success results per competitor to the returned payload, and (2) persisting competitor_analyses rows. The frontend has been adjusted to wait for completion and attempt session-scoped reads, but without backend persistence, UI will still lack data unless “Save Analysis” is manually triggered.

---

# Competitor Analysis Dataflow Remediation Plan — 2025-08-08

Goal: Make the frontend Results tab reliably display analysis output immediately after run, and ensure saved analyses list reflects newly completed runs without manual save.

## A) Backend (Edge Function) Changes
1) Fix success-path results assignment
   - In supabase/functions/competitor-analysis/index.ts, inside the competitor loop, after choosing parsedData, set:
     results[competitor] = { success: true, data: parsedData, analysis_id: crypto.randomUUID(), cost: combinedCost };
2) Persist competitor_analyses rows
   - After computing parsedData for a competitor, upsert into public.competitor_analyses with:
     - user_id = auth.uid()
     - name = parsedData.company_name || competitor
     - analysis_data = parsedData plus provider and cost breakdown
     - status = 'completed' (or update at the end)
     - session_id = requestData.sessionId
     - analysis_id = same ID placed in results for cross-linking
     - created_at default; do NOT set updated_at manually (triggers manage it)
   - Option: perform insert/update at the end for each competitor to reduce partial writes; still fine under RLS
3) Progress finalization
   - Continue updating competitor_analysis_progress to ‘completed’ with progress_percentage=100 and metadata including a list of analysis_ids written

## B) Frontend Adjustments (Minimal)
1) useCompetitorAnalysis
   - Keep the new behavior: if edge returns empty results, remain in ‘analyzing’ and rely on realtime completion; upon completion, fetch analyses filtered by session_id and populate Results
   - If edge returns results (post-fix), display them immediately; still fetch saved list for parity
2) Results Panel UX
   - Current change to show spinner during analyzing is correct; keep it

## C) Testing & Verification
1) Unit/Integration
   - Edge: add tests or logs verifying results[competitor] is set and that inserts into competitor_analyses succeed under RLS
   - Frontend: add test ensuring Results tab shows content after realtime ‘completed’ event, even if initial HTTP payload had no results
2) E2E Check
   - Run a full flow (e.g., “microsoft”) and verify:
     - progress updates appear
     - Results tab auto-populates
     - get_user_competitor_analyses returns a new row with session_id

## D) Security & Policies
- RLS is already ON; inserts must include user_id = auth.uid() from the Edge function
- Continue using RPCs with security definer for progress updates; no raw SQL

## E) Rollout Steps
1) Implement Edge fixes (assignment + persistence)
2) Redeploy Edge function (automatic in this environment)
3) Verify with a live run; confirm Results tab populated and saved list updated

## F) Acceptance Criteria
- Results tab shows competitor report immediately after analysis finishes
- Saved analyses contains new row(s) with correct session_id and analysis_id
- No mock or placeholder data used for competitor results in production flow

---

Appendix: Evidence
- Edge function lacks success assignment and DB persistence (file: supabase/functions/competitor-analysis/index.ts)
- Frontend fallback implemented in useCompetitorAnalysis to populate on completion
- Network logs show successful RPC calls for get_user_competitor_analyses but missing immediate results display prior to fixes
