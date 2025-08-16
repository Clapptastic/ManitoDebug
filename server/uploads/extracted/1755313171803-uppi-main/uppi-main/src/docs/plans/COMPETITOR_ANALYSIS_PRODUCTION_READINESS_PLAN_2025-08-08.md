# Competitor Analysis Production Readiness Plan — 2025-08-08

Status: Ready for Implementation
Owner: Engineering
Scope: Backend (Supabase tables, RPCs, Edge functions) + Frontend (services, hooks, UI) for Competitor Analysis

IMPORTANT — SINGLE SOURCE OF TRUTH

THIS DOCUMENT IS THE SINGLE SOURCE OF TRUTH FOR ALL DEVELOPMENT WORK

EVERY AI AGENT MUST:
- [ ] READ THIS ENTIRE PLAN before beginning any work
- [ ] FOLLOW EVERY RULE AND GUIDELINE specified in this document
- [ ] NEVER DEVIATE from the specified implementation patterns
- [ ] NEVER MODIFY requirements without explicit user approval

WORKFLOW ENFORCEMENT:
- [ ] NO CODING begins without consulting this plan
- [ ] ALL DEVELOPMENT must reference specific sections of this plan
- [ ] EVERY COMPONENT must follow the mandatory implementation pattern
- [ ] ALL CHANGES must be validated against plan requirements
- [ ] THIS PLAN governs all development decisions and processes

### CRITICAL IMPLEMENTATION RULES FOR AI AGENTS
#### 🔥 MANDATORY REUSE DIRECTIVES
- [ ] ONLY CREATE FROM SCRATCH IF file does not exsist in codebase — Always start by looking for the functionalities file/s in the codebase or archive.
- [ ] PRESERVE ALL FUNCTIONALITY — Every feature mentioned in the archived file MUST be included
- [ ] SINGLE SOURCE OF TRUTH ENFORCEMENT — Never create alternative implementations
- [ ] MANDATORY CONSOLIDATION — Always consolidate multiple versions into one authoritative file
- [ ] PRESERVE EXISTING FEATURES — Never simplify or remove functionality during implementation
- [ ] NO SHORTCUTS OR CORNER CUTTING — Implement full functionality exactly as specified
- [ ] NO PLAN MODIFICATIONS — Never adjust requirements without explicit user approval
- [ ] FULL STACK BEST PRACTICES — Follow industry standards for all technologies
- [ ] PRODUCTION-READY CODE ONLY — No temporary implementations or quick fixes
- [ ] MANDATORY CURSOR INTEGRATION — Use full Cursor capabilities and MCP servers
- [ ] PLAN CONSULTATION REQUIRED — Review this plan before any development work
- [ ] CODEBASE CONTEXT UTILIZATION — Leverage Cursor's intelligent code understanding

## 🚨 CRITICAL: SINGLE SOURCE OF TRUTH MANDATE

### ⚠️ ABSOLUTE RULES FOR AI CODING AGENTS - NEVER VIOLATE

RULE #1: ONE SOURCE OF TRUTH PER FUNCTIONALITY
- [ ] NEVER create simplified, duplicate, or alternative versions of existing functionality
- [ ] ALWAYS work on the designated "source of truth" file for each functionality
- [ ] NEVER create files with stub or incomplete code
- [ ] ALWAYS enhance and extend the existing master/source-of-truth file

RULE #2: MANDATORY FILE IDENTIFICATION
- [ ] BEFORE creating any new file, search for existing files with similar functionality
- [ ] BEFORE implementing any feature, check if it already exists in archive or active codebase
- [ ] ALWAYS use the highest-quality, most feature-complete version as the base
- [ ] NEVER start from scratch if existing functionality exists

RULE #3: CONSOLIDATION OVER CREATION
- [ ] WHEN multiple versions of the same functionality exist, consolidate into the best version
- [ ] MARK the consolidated version as "SINGLE SOURCE OF TRUTH" in comments
- [ ] ARCHIVE or delete conflicting/duplicate files after consolidation
- [ ] UPDATE all imports to point to the single source of truth

RULE #4: ENHANCEMENT OVER REPLACEMENT
- [ ] ALWAYS enhance existing functionality rather than replacing it
- [ ] ADD new features to existing components/services
- [ ] PRESERVE all existing functionality when adding new features
- [ ] NEVER remove or simplify existing features without explicit user permission

RULE #5: NO PLAN MODIFICATIONS WITHOUT USER APPROVAL
- [ ] NEVER modify, skip, or simplify any requirements in this plan
- [ ] NEVER make "temporary" implementations or shortcuts
- [ ] NEVER adjust scope or functionality without explicit user permission
- [ ] ALWAYS implement exactly what is specified in the plan
- [ ] ALWAYS ask user for approval before making any plan changes

RULE #6: FULL STACK BEST PRACTICES MANDATORY
- [ ] ALWAYS follow industry best practices for every technology
- [ ] NEVER cut corners on code quality, security, or performance
- [ ] ALWAYS implement comprehensive error handling and validation
- [ ] NEVER skip testing, documentation, or compliance requirements

RULE #7: MANDATORY LOVABLE INTEGRATION
- [ ] ALWAYS use lovable's full capabilities for code generation and editing
- [ ] ALWAYS leverage Lovable’s capabilities for enhanced functionality and efficiency
- [ ] NEVER work without first consulting this implementation plan
- [ ] ALWAYS use lovable's codebase context and intelligent suggestions

RULE #8: MANDATORY PLAN REVIEW FOR ALL AI AGENTS
- [ ] EVERY AI agent must read and understand this plan before any work
- [ ] ALL development work must reference and follow this plan
- [ ] NO coding work begins without plan consultation and approval
- [ ] THIS plan is the single source of truth for all development decisions

#### 🚫 FORBIDDEN ACTIONS - NEVER DO THESE
- [ ] DO NOT create simplified versions of components (e.g., ComponentSimple.tsx)
- [ ] DO NOT create basic/lite versions (e.g., ServiceBasic.ts, UtilityLite.js)
- [ ] DO NOT create alternative implementations (e.g., ComponentAlt.tsx)
- [ ] DO NOT create temporary/placeholder files (e.g., TempComponent.tsx)
- [ ] DO NOT skip any listed functionality from archived versions
- [ ] DO NOT use mock data in production components
- [ ] DO NOT create duplicate functionality across multiple files
- [ ] DO NOT ignore SOC2 compliance requirements
- [ ] DO NOT skip testing implementation
- [ ] DO NOT create placeholder implementations
- [ ] DO NOT remove existing functionality without explicit permission
- [ ] DO NOT start from scratch if archived functionality exists
- [ ] DO NOT create "version 2" or "new" versions of existing components
- [ ] DO NOT make "quick fixes" or "temporary solutions"
- [ ] DO NOT skip error handling, validation, or testing
- [ ] DO NOT use console.log for production logging
- [ ] DO NOT hardcode values that should be configurable
- [ ] DO NOT skip TypeScript types or use 'any' type
- [ ] DO NOT implement without proper security considerations
- [ ] DO NOT skip performance optimization
- [ ] DO NOT create code without proper documentation

Objective
- Achieve a reliable, secure, and observable end-to-end competitor analysis flow where:
  - Users can start analyses with selectable providers (OpenAI primary; optional Anthropic/Perplexity/Gemini/Groq/Cohere) based on stored user keys
  - Edge function orchestrates providers, logs costs, persists results to public.competitor_analyses
  - Frontend shows real-time progress and displays results immediately upon completion
  - Cost governance enforces soft limits with clear UI warnings
  - Advanced exports (PDF/CSV) are produced via a secure serverless function

Constraints & Principles
- No global API keys: use user/org keys via manage_api_key RPC
- Respect RLS; all inserts must include user_id = auth.uid()
- No raw SQL in edge functions – always use supabase client query methods or RPCs
- Don’t change routes or remove existing functionality unless explicitly asked
- Maintain TypeScript types consistently; no any; follow test typing guidance
- Do not manually set DB-managed timestamps

System Inventory (reference)
- Tables: public.competitor_analyses, public.competitor_analysis_progress, public.api_keys, public.api_usage_costs
- RPCs: get_user_competitor_analyses, manage_api_key (select, get_for_decryption), insert_competitor_analysis_progress, update_competitor_analysis_progress, check_user_cost_allowed, get_user_monthly_spend, set_user_cost_limit
- Edge Functions: competitor-analysis (primary), comprehensive-competitor-analysis (proxy)
- Frontend: services/competitorAnalysisService.ts, hooks/useCompetitorAnalysis.ts, UI pages/components

Plan Overview (phased)
1) Edge Function Reliability & Persistence (Fixes)
2) Provider Expansion behind Toggles (Gemini, Groq, Cohere)
3) Cost Governance (soft limits + UI warnings)
4) Realtime & Completion UX polish
5) Advanced Exports via Serverless (PDF/CSV)
6) Type System Harmonization & Tests
7) Security Review, RLS Validation & Observability
8) Rollout & Acceptance Validation

Detailed Steps

Phase 1 — Edge Function Reliability & Persistence
- [x] 1.1 Success-path results assignment
- In supabase/functions/competitor-analysis/index.ts, inside the per-competitor try block, after choosing result:
  - Assign results[competitor] = { success: true, data: parsedData, analysis_id, cost: combinedCost }

- [x] 1.2 Persist competitor_analyses rows
- For each competitor after parsedData is available:
  - Insert into public.competitor_analyses with:
    - user_id = auth.uid()
    - name = parsedData.company_name || competitor
    - analysis_data = parsedData + providers_used[] + cost_breakdown[]
    - status = 'completed'
    - session_id = requestData.sessionId
    - analysis_id = generated UUID (same as returned in results)
  - Handle RLS errors; log if any; do not retry infinitely

- [x] 1.3 Progress finalization
- On loop completion, RPC update_competitor_analysis_progress to status=completed, 100%, completed_competitors, and metadata = { results, analysis_ids, completedAt }

- [x] 1.4 Errors & logging
- On any per-competitor failure, set results[competitor] = { success: false, error, cost: 0 }
- Ensure api_usage_costs inserts include user_id, provider, endpoint, success, cost_usd, analysis_id (if known)
- Add clear console logs for troubleshooting (without leaking secrets)

Exit criteria
- Immediate HTTP response includes results map when success
- New rows appear in competitor_analyses for each analyzed competitor with session_id

Phase 2 — Provider Expansion behind Toggles (Gemini, Groq, Cohere)
- [x] 2.1 Backend: Key discovery & decryption
- Extend existing getDecryptedKeyFor() to support: 'gemini', 'groq', 'cohere'
- Fetch keys with RPC manage_api_key('get_for_decryption') only if the user toggled that provider

- [x] 2.2 Backend: Provider execution modules (inside competitor-analysis)
- For each provider (conditional on presence of decrypted key & toggle):
  - Call provider API
  - Parse JSON-only responses with robust guards (strip code fences, find JSON object)
  - Log api_usage_costs with provider, endpoint, cost_usd (0 if unknown), tokens if available

- [x] 2.3 Frontend: Provider toggles
- Reuse ApiToggleSection/ApiToggleItem & useApiKeyStatus
- Wire toggles to startAnalysis: pass providersSelected array
- Edge function respects providersSelected; defaults to ['openai']

- [x] 2.4 Provider preference & fallback
- Prefer OpenAI when present; otherwise choose first successful provider result
- Continue combining cost across fulfilled providers per competitor

Exit criteria
- User can select any combination of supported providers; analysis proceeds using available keys

Phase 3 — Cost Governance (Soft Limits + UI Warnings)
- [x] 3.1 Pre-flight limit check
- Frontend: before invoking edge function, call supabase.rpc('check_user_cost_allowed', { projected_cost_param: estimate })
  - Estimate low default (e.g., $0.01–$0.05 per competitor) to avoid blocking legitimate starts
  - If allowed=false → show destructive toast and abort
  - If alert=true → show warning toast but proceed

- [x] 3.2 Edge enforcement during run
- Edge: optionally re-check budget per competitor when large provider combos are used
- If over the limit mid-run, set error in progress metadata and gracefully finish remaining as skipped

- [ ] 3.3 Settings (optional, no new routes)
- If a UI exists to manage limits: call set_user_cost_limit via settings; otherwise skip adding UI in this plan

Exit criteria
- Starts are blocked when clearly over budget; warnings appear when nearing threshold

Phase 4 — Realtime & Completion UX Polish
- [x] 4.1 Realtime subscription
- useCompetitorAnalysis already subscribes to competitor_analysis_progress by session
- Ensure: status mapping → in_progress → analyzing, completed → completed

- [x] 4.2 Completion population
- On completed event, fetch analyses by session_id via RPC get_user_competitor_analyses and map to results
- Keep spinner during analyzing; avoid “No Results Yet” flash

- [x] 4.3 Error states
- If progress status=failed, show error toast and keep results empty

Exit criteria
- Results tab auto-populates on completion without manual save

Phase 5 — Advanced Exports via Serverless (PDF/CSV)
- [ ] 5.1 Edge function: analysis-export
- Input: { analysisIds: string[] | undefined, sessionId?: string, format: 'pdf'|'csv' }
- Auth required; fetch data via get_user_competitor_analyses then filter by ids/session
- Generate:
  - CSV: papaparse
  - PDF: jsPDF + autotable (already in deps)
- Return file blob with appropriate content-type; include CORS headers
- Log api_usage_costs with service='analysis-export'

- [ ] 5.2 Frontend integration
- Add export button(s) wired to supabase.functions.invoke('analysis-export', ...)
- Filename pattern: competitor-analysis-{date}.{pdf|csv}

Exit criteria
- Users can download PDF/CSV export for selected analyses or current session

Phase 6 — Type System Harmonization & Tests
- [ ] 6.1 Types
- Centralize frontend types (CompetitorAnalysis, CompetitorAnalysisResult)
- Services return typed data without any; prefer precise shapes

- [ ] 6.2 Supabase TS guidance (per project rules)
- Services: use appropriate Supabase response typing as needed
- Tests: import PostgrestResponse from '@supabase/supabase-js' (not PostgrestResponseSuccess)
- Mock responses include all required fields

- [ ] 6.3 Unit tests
- Service: getAnalyses, getById, startAnalysis (success/error), save/update/delete
- Hook: startAnalysis flow, realtime completion population, error handling
- Edge (lightweight): input validation, success-path result assignment, DB persistence (mock Supabase client)

- [ ] 6.4 E2E (Playwright)
- Start analysis with one provider & with multiple
- Verify progress updates
- Verify results appear without manual save
- Export CSV/PDF smoke checks

Exit criteria
- All unit tests pass; E2E suite green for the above flows

Phase 7 — Security, RLS & Observability
- [ ] 7.1 RLS
- competitor_analyses: verify inserts include user_id = auth.uid()
- API keys access only via manage_api_key RPC; never expose raw keys

- [ ] 7.2 Secrets & PII
- Do not log API keys; redact sensitive info in logs

- [ ] 7.3 Observability
- Ensure api_usage_costs entries for all provider calls and exports
- Add structured logs in edge functions with request correlation id (sessionId)

- [ ] 7.4 Performance
- Parallelize provider calls per competitor; small concurrency only per session
- Backoff or circuit-break on repeated provider failures

Exit criteria
- No RLS violations; clean logs; measurable cost metrics per user

Phase 8 — Rollout & Acceptance Validation
- [ ] 8.1 Rollout
- Redeploy updated edge functions (automatic in this environment)
- Smoke test with a simple competitor list

- [ ] 8.2 Acceptance Criteria
- HTTP payload contains results when success; DB rows persisted with session_id
- Results tab auto-populates on completion; Saved Analyses shows new rows
- Provider toggles respected; cost governance blocks/alerts as expected
- Exports work (PDF/CSV) for selected analyses
- All tests pass; no console errors in UI

Appendix A — Edge Function Contracts
A.1 competitor-analysis (POST)
- Body: { sessionId: string, competitors: string[], action: 'start', providersSelected?: string[] }
- Response: { success: true, sessionId, results: Record<string, { success: boolean, data?: any, error?: string, analysis_id?: string, cost?: number }> }

A.2 analysis-export (POST)
- Body: { analysisIds?: string[], sessionId?: string, format: 'pdf'|'csv' }
- Response: application/pdf or text/csv blob

Appendix B — Error Handling Matrix
- Missing/invalid API key → user-facing toast; progress set to failed; metadata includes error
- Provider API failure → continue with remaining providers; if all fail → result[competitor] = { success: false, error }
- RLS/insert failure → log error; continue; UI still shows other competitors

Appendix C — Implementation Order Checklist
- [x] P1 Edge success assignment + DB persistence + progress metadata analysis_ids
- [x] P2 Provider expansion (toggle wiring, decrypt keys, provider calls, logging)
- [x] P3 Cost governance preflight + warnings + optional mid-run enforcement
- [x] P4 Realtime completion population & UX polish
- [ ] P5 analysis-export function + UI hooks
- [ ] P6 Types + unit & e2e tests updated per project rules
- [ ] P7 Security/RLS review + observability checks
- [ ] P8 Rollout + acceptance validation

Notes
- Keep changes minimal and incremental; verify after each phase
- Do not modify routes or remove features
- Use maybeSingle() when fetching a single row with potential empties
- Avoid dev-only logs in production builds
