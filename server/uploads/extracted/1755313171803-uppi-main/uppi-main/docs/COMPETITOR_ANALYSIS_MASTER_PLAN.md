# 🚨 SINGLE SOURCE OF TRUTH: Competitor Analysis – Master Implementation Plan (Agent-Ready, Production-Grade)

Owner: Platform Team
Last updated: 2025-08-08
Applies to: Backend (Supabase Edge Functions + DB), Frontend (React/Vite/TS), Analytics & Admin

This document replaces and consolidates ALL prior competitor-analysis documentation. It is the single, authoritative plan.

[PROGRESS TRACKER]
- [x] P0 – Remove mocks: comprehensive-competitor-analysis → proxy to competitor-analysis (done)
- [x] Archive outdated docs superseded by this plan (done)
- [x] Phase P0 test(s): UI proxy call integration tests added (done)
- [ ] P1 – DB migrations
  - [x] P1.1 provider_preferences table + RLS + indexes
  - [x] P1.2 api_usage_costs.organization_id + indexes
  - [x] P1.3 trigger set_api_usage_org_id()
  - [x] P1.4 view v_org_monthly_costs
  - [ ] P1.5 pg_cron nightly schedule (blocked: cron schema missing)
- [ ] P2 – Edge/shared updates
  - [x] Update shared/cost-tracking.ts to insert api_usage_costs via Supabase client (legacy metrics preserved)
  - [ ] CentralizedApiManager: task-based priorities, circuit breaker, backoff, cache
  - [ ] apiOrchestrator: task-category routing, toggle/priority respect, attach analysis_id
- [ ] P3 – Frontend (settings toggles/priorities, filters, UI parity)
- [ ] P4 – Tests & QA (unit + E2E full coverage)
- [ ] P5 – Release and monitoring


====================================================================
GOVERNANCE (MANDATORY)
====================================================================
THIS DOCUMENT IS THE SINGLE SOURCE OF TRUTH FOR ALL DEVELOPMENT WORK

EVERY AI AGENT MUST:
1) READ THIS ENTIRE PLAN before beginning any work
2) FOLLOW EVERY RULE AND GUIDELINE specified here
3) NEVER DEVIATE from the specified implementation patterns
4) NEVER MODIFY requirements without explicit user approval

WORKFLOW ENFORCEMENT:
- NO CODING begins without consulting this plan
- ALL DEVELOPMENT must reference specific sections of this plan
- EVERY COMPONENT must follow the mandatory implementation pattern
- ALL CHANGES must be validated against plan requirements
- THIS PLAN governs all development decisions and processes

CRITICAL IMPLEMENTATION RULES FOR AI AGENTS
🔥 MANDATORY REUSE DIRECTIVES
1) ONLY CREATE FROM SCRATCH IF file does not exist in codebase — first search active code and /archive
2) PRESERVE ALL FUNCTIONALITY — include every feature found in archived/active versions
3) SINGLE SOURCE OF TRUTH ENFORCEMENT — no alternative implementations
4) MANDATORY CONSOLIDATION — consolidate duplicates into one authoritative file
5) PRESERVE EXISTING FEATURES — do not remove or simplify without explicit approval
6) NO SHORTCUTS — full, production-grade implementations only
7) NO PLAN MODIFICATIONS — changes require explicit user approval
8) FULL STACK BEST PRACTICES — security, performance, accessibility
9) PRODUCTION-READY CODE ONLY — no temporary or placeholder code
10) CURSOR/Lovable INTEGRATION — leverage tooling and MCP servers/context
11) PLAN CONSULTATION REQUIRED — read plan before any development work
12) CODEBASE CONTEXT UTILIZATION — leverage intelligent search and history

🚨 SINGLE SOURCE OF TRUTH MANDATE – ABSOLUTE RULES
RULE #1: One SoT per functionality; enhance existing master file(s)
RULE #2: Mandatory file identification prior to creation
RULE #3: Consolidation over creation; mark consolidated file with “SINGLE SOURCE OF TRUTH”
RULE #4: Enhancement over replacement; never remove functionality silently
RULE #5: No requirement changes without explicit approval
RULE #6: Best practices, error handling, validation, testing are mandatory
RULE #7: Mandatory Lovable integration and context-aware editing
RULE #8: All agents must read and reference this plan before coding

FORBIDDEN ACTIONS (NEVER DO THESE)
- No simplified/lite/alt/temp versions; no mock data in production
- No duplicate functionality across files; no skipping tests
- No console.log in production logging; no hardcoded secrets/values
- No ‘any’ types; no weakening of security or RLS
- No manual timestamps for DB-managed columns

====================================================================
A) OBJECTIVES & SCOPE
====================================================================
- Remove all mock/placeholder data from competitor analysis flows
- Use top providers with task-based priorities and robust fallback logic
- Per-request cost tracking with org rollups; admin visibility
- Master company profiles periodically consolidated from all user analyses
- Frontend parity with backend features, with rich filtering/specificity controls
- Single coordinated release; maintain existing routes; no duplicates

====================================================================
B) SYSTEM ARCHITECTURE OVERVIEW
====================================================================
Core Edge Functions
- competitor-analysis (PRIMARY pipeline, authenticated)
- comprehensive-competitor-analysis (PUBLIC proxy to PRIMARY; no mock data)
- bulk-consolidate-companies (Master profile consolidation)

Shared Function Modules (Deno side)
- supabase/functions/shared/api-config.ts (Provider base URLs + defaults)
- supabase/functions/shared/api-providers.ts (Provider metadata)
- supabase/functions/shared/cost-tracking.ts (Cost logging helpers)

Frontend
- Hook: src/hooks/useCompetitorAnalysis.ts
- Services: src/services/api/apiOrchestrator.ts, src/services/api/centralizedApiManager.ts
- Master profile integration: src/services/api/masterProfileIntegrationService.ts
- Pages/Components: CompetitorAnalysisDashboard and tabs (New Analysis, Results, Saved)

Key DB Tables (public schema)
- competitor_analyses, master_company_profiles, api_keys, admin_api_keys, api_usage_costs
- organization_members, profiles (for org linkage)

====================================================================
C) CONTRACTS & INTERFACES (STRICT)
====================================================================
Types (reuse existing; do not alter shapes without approval)
- src/types/competitor/api-response.ts
  - interface AnalysisApiResponse { success: boolean; results: CompetitorApiResponse[]; session_id: string; error?: string }
- src/types/competitor/unified-types.ts
  - CompetitorAnalysisEntity et al. – treat as canonical shapes in UI

Edge Function Invocation (Frontend)
- supabase.functions.invoke('competitor-analysis' | 'comprehensive-competitor-analysis', { body })
  - Body must include: { competitors: string[]; focusAreas?: string[]; session_id?: string; industry?: string }
  - competitor-analysis requires Authorization (verify_jwt = true)
  - comprehensive-competitor-analysis is a thin proxy to the primary pipeline and returns the same shape

Proxy Behavior (Implemented)
- comprehensive-competitor-analysis forwards body and Authorization to competitor-analysis and returns its response verbatim
- No random/placeholder fields are generated by the proxy

Master Consolidation
- bulk-consolidate-companies reads competitor_analyses, normalizes names, merges into master_company_profiles with provenance in source_analyses

====================================================================
D) PROVIDERS & FALLBACKS (DETAILED)
====================================================================
Supported Providers
- Web+Reasoning: Perplexity (sonar), OpenAI (gpt-4.1-2025-04-14), Anthropic (sonnet-4-20250514), Gemini (1.5-pro)
- Fallback LLMs: Mistral, Cohere
- Signals: SerpAPI (search), NewsAPI (news), Alpha Vantage (financials)

Task Categories
- search (web retrieval), qa (structured analysis), enrichment (signals/news/financials summarization)

Priority Order (Default; configurable via preferences)
- search: Perplexity → OpenAI → Anthropic → Gemini
- qa: OpenAI → Anthropic → Gemini → Mistral
- enrichment: AlphaVantage/NewsAPI/SerpAPI (fetch) → LLM summarization (OpenAI → Anthropic)

Fallback Algorithm (Pseudo-code)
1) Resolve effective provider list per task using preferences (user override → org → default)
2) For provider in ordered list:
   - If circuit open for provider, continue
   - Try request with backoff policy
   - On success: record metrics/costs; return result
   - On failure (429/5xx): increment error rate; exponential backoff; try next provider
3) If all fail: return structured error with provider attempts and statuses

Circuit Breaker
- Track error_count in sliding window; open circuit after threshold (e.g., 5 fails/60s); half-open retry after cooldown (e.g., 30s)

Response Caching (Short-Lived)
- Cache by hash(provider+model+prompt) with TTL (e.g., 5m) to reduce costs on repeated prompts

====================================================================
E) COST TRACKING (PER REQUEST + ORG ROLLUP)
====================================================================
DB Changes (Migration Required)
- ALTER TABLE api_usage_costs ADD COLUMN organization_id uuid NULL;
- Create view v_org_monthly_costs (organization_id, month, provider, requests, tokens, cost_usd)
- Trigger set_api_usage_org_id(): on insert to api_usage_costs, set organization_id by looking up active membership for user_id

Function Changes
- supabase/functions/shared/cost-tracking.ts
  - For each external call, insert a row into api_usage_costs with fields:
    - user_id, organization_id, analysis_id, provider, model_used, tokens_used, cost_usd, latency, endpoint, success, metadata
  - Compute costs using helpers:
    - calculateOpenAICost, calculateAnthropicCost; add tables for Perplexity/Gemini/Mistral/Cohere per 1K tokens or per-call pricing
  - Remove reliance on shared/api-metrics.ts hardcoded cost paths for competitor analysis flows

Admin/Analytics UI
- Show per-user and per-org totals; filter by provider/date; include request counts, token counts, cost

====================================================================
F) API KEYS, TOGGLES, PRIORITIES (USER & ORG)
====================================================================
Storage
- api_keys (user scope); admin_api_keys (org/admin scope)

Preferences Table (Migration Required)
- provider_preferences: id uuid pk, user_id uuid nullable, organization_id uuid nullable, provider text, task_category text ('search'|'qa'|'enrichment'), enabled boolean default true, priority int default 100, created_at, updated_at
- Constraint: one of (user_id, organization_id) must be non-null
- Indexes: (user_id, provider, task_category), (organization_id, provider, task_category)

Key Resolution
- Effective key for a request: user key (if enabled) → org key (if enabled) → none (error)
- “Use org keys first” optional toggle to invert precedence (persist per user)

Validation
- validate-api-key edge function supports OpenAI, Anthropic, Gemini, Perplexity, Mistral, Cohere, SerpAPI, NewsAPI, Alpha Vantage
- Store masked_key, key_prefix, last_validated; never log plaintext

UI Settings
- Provider Toggles per scope; drag/drop to set priority per task category; checkbox “Use org keys first”

====================================================================
G) MASTER COMPANY PROFILE – CONSOLIDATION & ENRICHMENT
====================================================================
Scheduling (Migration Required)
- Enable pg_cron + pg_net
- Nightly at 03:00 local: cron job posts to https://jqbdjttdaihidoyalqvs.functions.supabase.co/bulk-consolidate-companies with service role Authorization

Merge Strategy
- Normalize company name; merge with rules: newest wins, higher completeness wins, higher confidence wins; keep source_analyses provenance

Enrichment on Read
- When running analysis: if master exists, fill gaps in UI result; annotate enriched fields and adjust confidence; do not overwrite user’s raw record

====================================================================
H) FRONTEND PARITY & CONTROLS (UI/UX)
====================================================================
useCompetitorAnalysis (Hook)
- Request enabled providers + priorities from CentralizedApiManager
- Pass task category per step (search, qa, enrichment)
- Maintain existing progress streaming, save/export

New Analysis Controls
- Focus areas (SWOT, pricing, tech stack, ICP, geography)
- Freshness window (30/90/365 days) applied to news/financials
- Source filters (news vendors, SERP country/language)
- Depth vs speed slider (affects model/tokens)

Results UI
- Provider badges, confidence adjustments, enrichment indicators
- Source citations and timestamps when available

Settings
- User + Org provider toggles, ordering; “Use org keys first” toggle

Accessibility & Theming
- Use design tokens; no hardcoded colors; responsive; proper landmarks and aria

====================================================================
I) SECURITY, RLS & COMPLIANCE
====================================================================
RLS (verify/update policies)
- api_usage_costs: user can see own rows; org admins can see org rows; service_role full
- provider_preferences: owner (user_id) can manage own; org admins can manage org; service_role full
- competitor_analyses/master_company_profiles: enforce existing policies; ensure user_id and organization_id are always set

Secrets Handling
- Never store plaintext API keys in logs; keep masked values and prefixes only
- Use Supabase secrets for function configs as needed

Timestamps
- Do not set DB-managed timestamps in code; rely on defaults/triggers

Types & Tests
- No any; Services use PostgrestResponseSuccess; tests use PostgrestResponse (per project rule)

====================================================================
J) DETAILED STEP-BY-STEP TASK LIST (EXECUTION ORDER)
====================================================================
P0 – Mock Removal (Completed)
- comprehensive-competitor-analysis now proxies to competitor-analysis (no mock data)

P1 – Database Migrations (prepare SQL via migration tool; do not run code changes before approval)
1) Add provider_preferences table with RLS and indexes
2) ALTER api_usage_costs ADD COLUMN organization_id uuid NULL; add indexes (user_id, organization_id, date)
3) Create view v_org_monthly_costs (organization_id, month, provider, requests, tokens, cost_usd)
4) Create trigger/function set_api_usage_org_id() to populate organization_id on insert
5) Enable pg_cron/pg_net; schedule bulk-consolidate-companies nightly at 03:00 via http_post

P2 – Edge Functions & Shared Utilities
6) Update shared/cost-tracking.ts to write to api_usage_costs with accurate cost computations (OpenAI/Anthropic already implemented; add Perplexity/Gemini/Mistral/Cohere)
7) CentralizedApiManager: implement task-based routing, circuit breaker, backoff, short-lived cache
8) apiOrchestrator: pass task category per step; respect toggles/priorities; attach analysis_id to provider calls

P3 – Frontend Updates
9) Settings UI: provider toggles for user/org, drag/drop priority, “Use org keys first”
10) New Analysis: add filters (focus areas, freshness, sources, depth/speed)
11) Results UI: provider badges, enrichment/confidence annotations, citations
12) Admin dashboard: org/user cost charts and summaries

P4 – Testing & QA
13) Unit tests: orchestrator fallbacks, key resolution, cost logging, enrichment logic
14) E2E: happy path; provider failure; missing keys; org-overrides; scheduled consolidation effects
15) Types: verify service/test response types per rules; zero any types

P5 – Release
16) Run migrations (tool-approved), deploy functions, deploy frontend
17) Smoke tests; enable cron; monitor logs; prepare rollback steps

Rollback
- Revert migrations and disable cron; revert functions and frontend deploy

====================================================================
K) ACCEPTANCE CRITERIA
====================================================================
- No mock/placeholder outputs anywhere in competitor analysis paths
- Providers can be toggled and prioritized; fallback works under failures/rate limits
- Master profiles consolidate nightly and enrich user results on read
- Costs logged per request; org rollups visible in admin
- All routes remain functional; no duplicate or conflicting code paths
- Tests pass; type checks clean; RLS enforced; no plaintext secrets

====================================================================
L) VERIFICATION CHECKLIST (AGENT MUST CONFIRM EACH)
====================================================================
- [ ] comprehensive-competitor-analysis proxy returns identical shape as competitor-analysis
- [ ] provider_preferences created with RLS; indexes present
- [ ] api_usage_costs has organization_id; trigger populates for members
- [ ] v_org_monthly_costs returns correct aggregates
- [ ] Nightly cron invokes bulk-consolidate-companies successfully
- [ ] cost-tracking writes a row per provider call with correct costs/latency
- [ ] CentralizedApiManager applies priorities and fallbacks; circuit breaker functioning
- [ ] UI settings allow toggles and ordering; “Use org keys first” persisted
- [ ] New Analysis filters applied to provider requests
- [ ] Results UI shows provider badges, enrichment, confidence changes
- [ ] Admin dashboard shows org and user cost summaries
- [ ] Unit/E2E tests pass; no any types; correct Supabase response types used

Notes & Constraints
- Do not modify auth or reserved schemas; only public schema
- Prefer Supabase client methods in functions; never execute raw SQL from edge functions
- Keep error messages structured and user-friendly; log with context (no secrets)
