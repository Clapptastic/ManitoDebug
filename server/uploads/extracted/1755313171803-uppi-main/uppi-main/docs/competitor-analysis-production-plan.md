# Competitor Analysis — Production Readiness Plan

Status: Draft v1.0
Owner: Engineering
Scope: Bring the Competitor Analysis feature to 100% production-ready status with full functionality and a complete automated test suite.

## 0) Governance & Single Source of Truth

> THIS DOCUMENT IS THE SINGLE SOURCE OF TRUTH FOR ALL DEVELOPMENT WORK

### Workflow Enforcement
- [ ] NO CODING begins without consulting this plan
- [ ] ALL DEVELOPMENT must reference specific sections of this plan
- [ ] EVERY COMPONENT must follow the mandatory implementation pattern
- [ ] ALL CHANGES must be validated against plan requirements
- [ ] THIS PLAN governs all development decisions and processes

### Critical Implementation Rules for AI Agents

#### Mandatory Reuse Directives
1. [ ] ONLY CREATE FROM SCRATCH IF file does not exist in codebase — Always search for existing functionality first (active codebase and archive)
2. [ ] PRESERVE ALL FUNCTIONALITY — Every feature mentioned in archived files MUST be included
3. [ ] SINGLE SOURCE OF TRUTH ENFORCEMENT — Never create alternative implementations
4. [ ] MANDATORY CONSOLIDATION — Consolidate multiple versions into one authoritative file
5. [ ] PRESERVE EXISTING FEATURES — Never simplify or remove functionality during implementation
6. [ ] NO SHORTCUTS OR CORNER CUTTING — Implement full functionality exactly as specified
7. [ ] NO PLAN MODIFICATIONS — Do not adjust requirements without explicit user approval
8. [ ] FULL STACK BEST PRACTICES — Follow industry standards for all technologies
9. [ ] PRODUCTION-READY CODE ONLY — No temporary implementations or quick fixes
10. [ ] MANDATORY CURSOR INTEGRATION — Use full Cursor capabilities and MCP servers
11. [ ] PLAN CONSULTATION REQUIRED — Review this plan before any development work
12. [ ] CODEBASE CONTEXT UTILIZATION — Leverage Cursor/Lovable intelligent code understanding

### Single Source of Truth Mandate — Absolute Rules

RULE #1: One Source of Truth per Functionality
- [ ] NEVER create simplified, duplicate, or alternative versions of existing functionality
- [ ] ALWAYS work on the designated "source of truth" file for each functionality
- [ ] NEVER create files with stub or incomplete code
- [ ] ALWAYS enhance and extend the existing master/source-of-truth file

RULE #2: Mandatory File Identification
- [ ] BEFORE creating any new file, search for existing files with similar functionality
- [ ] BEFORE implementing any feature, check if it already exists in archive or codebase
- [ ] ALWAYS use the highest-quality, most feature-complete version as the base
- [ ] NEVER start from scratch if existing functionality exists

RULE #3: Consolidation Over Creation
- [ ] WHEN multiple versions exist, consolidate into the best version
- [ ] MARK the consolidated version as "SINGLE SOURCE OF TRUTH" in comments
- [ ] ARCHIVE or delete conflicting/duplicate files after consolidation
- [ ] UPDATE all imports to point to the single source of truth

RULE #4: Enhancement Over Replacement
- [ ] ALWAYS enhance existing functionality rather than replacing it
- [ ] ADD new features to existing components/services
- [ ] PRESERVE all existing functionality when adding new features
- [ ] NEVER remove or simplify existing features without explicit user permission

RULE #5: No Plan Modifications Without User Approval
- [ ] NEVER modify, skip, or simplify any requirements in this plan
- [ ] NEVER make temporary implementations or shortcuts
- [ ] NEVER adjust scope without explicit user permission
- [ ] ALWAYS implement exactly what is specified in the plan

RULE #6: Full Stack Best Practices Mandatory
- [ ] ALWAYS follow industry best practices for every technology
- [ ] ALWAYS implement comprehensive error handling and validation
- [ ] NEVER skip testing, documentation, or compliance requirements

RULE #7: Mandatory Lovable Integration
- [ ] ALWAYS use Lovable’s full capabilities for code generation and editing
- [ ] ALWAYS leverage Lovable’s codebase context and intelligent suggestions
- [ ] NEVER work without first consulting this implementation plan

RULE #8: Mandatory Plan Review for All AI Agents
- [ ] EVERY AI agent must read and understand this plan before any work
- [ ] ALL development work must reference and follow this plan
- [ ] NO coding work begins without plan consultation and approval
- [ ] THIS plan is the single source of truth for all development decisions

#### Forbidden Actions — Never Do These
- [ ] Do NOT create simplified versions of components (e.g., ComponentSimple.tsx)
- [ ] Do NOT create basic/lite versions (e.g., ServiceBasic.ts, UtilityLite.js)
- [ ] Do NOT create alternative implementations (e.g., ComponentAlt.tsx)
- [ ] Do NOT create temporary/placeholder files (e.g., TempComponent.tsx)
- [ ] Do NOT skip any listed functionality from archived versions
- [ ] Do NOT use mock data in production components
- [ ] Do NOT create duplicate functionality across multiple files
- [ ] Do NOT ignore SOC2 compliance requirements
- [ ] Do NOT skip testing implementation
- [ ] Do NOT create placeholder implementations
- [ ] Do NOT remove existing functionality without explicit permission
- [ ] Do NOT start from scratch if archived functionality exists
- [ ] Do NOT create "version 2" or "new" versions of existing components
- [ ] Do NOT make "quick fixes" or "temporary solutions"
- [ ] Do NOT skip error handling, validation, or testing
- [ ] Do NOT use console.log for production logging
- [ ] Do NOT hardcode values that should be configurable
- [ ] Do NOT use any 'any' types; maintain strict TypeScript types
- [ ] Do NOT implement without proper security considerations
- [ ] Do NOT skip performance optimization
- [ ] Do NOT write code without proper documentation and comments

## 1) Goals and Non‑Goals
- Goals
  - Reliable end‑to‑end flow: Start → Progress → Edge → DB → Results → Saved Analyses
  - Strong security: user/org-scoped API keys, strict RLS, least privilege
  - Observability: actionable logs/metrics across client, edge, DB
  - Complete test coverage: unit, integration, e2e; CI‑ready
  - Performance: fast renders, resilient realtime, minimal API calls
- Non‑Goals
  - Redesign UI/UX beyond minor polish
  - New providers beyond existing toggled ones

## 2) Current Findings (Audited)
- Intermittent 403s on analysis_runs insert
  - Root cause: direct inserts hitting RLS occasionally; solved by SECURITY DEFINER RPC insert_analysis_run
- Results not visible immediately after completion
  - Root causes:
    1) Some competitor_analyses rows may lack session_id; client filtered strictly by session
    2) Saved Analyses not refreshed on completion
  - Fixes in place: UI fallback on completion and list refresh; still recommended to stamp session_id at write time in edge function
- Non‑blocking console noise: “listener indicated async response” (browser extension)

## 3) Target Architecture (High Level)
- Frontend (React)
  - useCompetitorAnalysis hook orchestrates flow
  - competitorAnalysisService handles data access + edge invocations
  - competitorProgressService manages progress via RPC + realtime
- Backend (Supabase)
  - Storage: competitor_analyses, competitor_analysis_progress, analysis_runs
  - RPC: insert_competitor_analysis_progress, update_competitor_analysis_progress,
    get_user_competitor_analyses, insert_analysis_run
  - Edge: competitor-analysis orchestrates providers and persists results
- Security
  - RLS on all user data tables
  - API keys stored per user/org in api_keys; service role only from edge

## 4) Implementation Plan (Step‑by‑Step)

### 4.1 Database & RPC (Supabase)
Checklist
- [x] insert_analysis_run (SECURITY DEFINER)
- [x] insert_competitor_analysis_progress (SECURITY DEFINER)
- [x] update_competitor_analysis_progress (SECURITY DEFINER)
- [x] get_user_competitor_analyses
- [x] Triggers on analysis_runs (updated_at, cleanup to keep 5 latest per user/run_type)
- [x] Ensure indexes
  - [x] competitor_analyses(user_id, created_at)
  - [x] competitor_analysis_progress(session_id, user_id)
  - [x] analysis_runs(user_id, run_type, created_at DESC) — exists
- [x] Realtime
  - [x] Confirm realtime events are flowing for competitor_analysis_progress
- [x] Data integrity
  - [x] NOT NULL constraints where appropriate (e.g., competitor_analyses.user_id)
  - [x] Default timestamps managed via triggers; never set manually in code

### 4.2 Edge Functions (competitor-analysis)
- Enforce user linkage
  - On write to competitor_analyses, always set user_id = caller and session_id = provided one
- Keys & providers
  - Fetch active user/org API keys using RPC manage_api_key ('get_for_decryption' where necessary)
  - Respect toggled providers; default to OpenAI; cost tracking via api_usage_costs
- Updates
  - Progress updates via update_competitor_analysis_progress
  - Final results write competitor_analyses rows per competitor with session_id
  - Log metrics using edge_function_metrics and api_usage_costs
- Error handling
  - Standardized error JSON with correlation/session IDs
  - Always finalize progress to failed on error

### 4.3 Frontend (React)
- competitorAnalysisService
  - Use RPC insert_analysis_run instead of direct insert (done)
  - Maintain completion/failure updates to analysis_runs via .update (RLS permits)
  - Check API keys via manage_api_key('select'), format/validate masked keys only
- competitorProgressService
  - Switch initializeProgress to RPC insert_competitor_analysis_progress
  - Use update_competitor_analysis_progress RPC for updates where possible
- useCompetitorAnalysis
  - Subscription: handle in_progress → analyzing and completed → fetch
  - On completed: attempt strict session match; fallback to most recent completed (count = total_competitors)
  - Refresh Saved Analyses state automatically
- UI
  - Ensure Results tab renders immediately after completion
  - Add small toast/log on auto-refresh

### 4.4 Security & Compliance
- RLS review
  - Validate per‑user access for competitor_analyses, progress, analysis_runs
  - Confirm no policies cause recursion; use SECURITY DEFINER helpers where needed
- API keys
  - No global keys; always user/org‑scoped keys from api_keys table
  - Edge functions never return raw keys to the client
- Cost & rate limits
  - Enforce check_user_cost_allowed; allow user to adjust limits via set_user_cost_limit (already supported)

### 4.5 Observability & Monitoring
- Client
  - Scoped console logs: start, progress, completion, counts
- Edge
  - logApiMetrics, api_usage_costs entries
  - Clear error messages with sessionId
- DB
  - audit_logs and performance_logs as needed

## 5) Test Strategy & Coverage

### 5.1 Unit Tests (Jest + Testing Library)
- Services
  - competitorAnalysisService
    - getAnalyses (RPC get_user_competitor_analyses)
    - startAnalysis
      - RPC insert_competitor_analysis_progress called
      - RPC insert_analysis_run called
      - functions.invoke('competitor-analysis') happy path + error
      - completion updates analysis_runs
    - saveAnalysis (insert/update competitor_analyses)
    - updateAnalysis, deleteAnalysis
    - checkApiKeyRequirements (manage_api_key 'select')
    - getAvailableApiKeys
  - competitorProgressService
    - initializeProgress (RPC insert_competitor_analysis_progress)
    - subscribeToProgress mapping
    - completeProgress, failProgress
- Hooks
  - useCompetitorAnalysis
    - on completed event: strict session match path
    - on completed event: fallback to latest completed path
    - Saved Analyses refresh on completion
- Components
  - Results display renders with provided results
  - Saved analyses list renders and actions call handlers

Type rules in tests
- Use: import { PostgrestResponse } from '@supabase/supabase-js'
- Do NOT use PostgrestResponseSuccess in test files
- Provide mock response shapes with all required fields when needed (data, error, etc.)

### 5.2 Integration Tests (Jest)
- Mock supabase.client
  - rpc → handles: manage_api_key, insert_competitor_analysis_progress, update_competitor_analysis_progress, insert_analysis_run, get_user_competitor_analyses
  - functions.invoke → competitor-analysis returns success or error
- Verify end‑to‑end: startAnalysis → progress update → results populated → saved list refreshed

### 5.3 End‑to‑End (Playwright)
Scenarios
- Start single competitor, observe progress to completion, results visible
- Start multiple competitors, ensure result count matches
- Missing API key → UI shows actionable error
- Budget exceeded → dialog to increase limit, proceed path works
- Saved analyses view → refresh, edit title/description, delete, export

### 5.4 CI Integration
- Run unit + integration tests on PRs
- Optional nightly E2E suite
- Fail on coverage drop below thresholds (e.g., 85%)

## 6) Acceptance Criteria
- No 403s on analysis_runs inserts in client logs under normal use
- On completion, Results tab shows accurate competitor count without manual refresh
- Saved analyses auto-refresh on completion
- All RLS policies validated; no unauthorized access possible
- Test suite:
  - Unit coverage ≥ 85%
  - Integration happy and error paths covered
  - E2E: core flows pass consistently
- Observability: logs/metrics sufficient to diagnose failures quickly

## 7) Rollout Plan
1) Land backend RPC/edge consistency (session_id stamping, progress RPC usage)
2) Land frontend fallbacks (already merged), then remove fallback once session_id stamping confirmed
3) Expand tests; stabilize CI
4) Shadow production logging, monitor for regressions
5) Announce GA

## 8) Risks & Mitigations
- Realtime flakiness → Maintain polling fallback button in UI (manual refresh) and robust subscription error logs
- Provider API failures → Circuit breaker + retries (already present); ensure clear user feedback and cost logging
- RLS misconfig → Strict validation in staging; SECURITY DEFINER used for safe RPCs

## 9) Task Breakdown (Actionable)
- Database
- [x] Add/verify helpful indexes listed above
- [x] Confirm realtime config for competitor_analysis_progress
- [x] Ensure competitor_analyses.user_id NOT NULL when safe (conditional migration applied)
  - [x] Ensure competitor_analyses writes always include session_id and user_id
  - [x] Add structured logs including sessionId, competitor, provider, costs
- Frontend
  - [x] competitorProgressService.initializeProgress → RPC (insert_competitor_analysis_progress)
  - [x] competitorProgressService.updateProgress → RPC (update_competitor_analysis_progress) where applicable
  - [x] Keep insert_analysis_run RPC path for all run logging
  - [x] Add small toast on auto-refresh after completion
- Tests
  - [ ] Expand unit tests for services/hooks/components as listed
  - [ ] Add integration tests simulating edge results
  - [ ] Add Playwright E2E suite
  - [x] Ensure PostgrestResponse usage in test types
- Observability
  - [x] Add key client logs
  - [x] Confirm edge metrics (api_usage_costs)
  - [x] Validate DB audit entries

## 10) Time & Resources (Estimate)
- Backend consistency (RPC/edge stamping): 0.5–1 day
- Frontend service/progress tweaks + logs: 0.5 day
- Tests (unit/integration/E2E): 2–3 days
- Staging validation + fixes: 0.5–1 day
Total: ~4–6 engineering days

---

Appendix A — File Map (Primary Touchpoints)
- Frontend
  - src/services/competitorAnalysisService.ts
  - src/services/competitorProgressService.ts
  - src/hooks/useCompetitorAnalysis.ts
  - src/components/competitor-analysis/*
- Edge
  - supabase/functions/competitor-analysis/index.ts
- Database
  - RPC: insert_competitor_analysis_progress, update_competitor_analysis_progress, insert_analysis_run, get_user_competitor_analyses
  - Tables: competitor_analyses, competitor_analysis_progress, analysis_runs

Appendix B — Test Conventions
- Tests import PostgrestResponse (not PostgrestResponseSuccess)
- No any types; define minimal interfaces where needed
- Mock objects include all required fields in Supabase responses
