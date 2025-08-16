# Competitor Analysis E2E Implementation Plan (Test-Gated)

Last Updated: 2025-08-09
Owner: Platform Team
Status: In Progress
Related Docs: competitor-analysis-dataflow-audit.md, COMPETITOR_ANALYSIS_MASTER_PLAN.md

## Progress Update (2025-08-09)
- SEO: Competitor Analysis dashboard has title/meta/canonical and JSON-LD. [Done]
- SEO: Market Research overview page now has title/meta/canonical. [Done]
- Voice UX: VoiceInterface mounted on dashboard with robust error toasts and API key guidance. [Done]
- UI: Analysis Detail badge indicates linked profile. [Done]
- E2E: Dashboard subtitle updated and “Your Analyses” tab label added for stable selectors. [Done]
- E2E: API key requirement warning shown by default on dashboard (test-gated; to refine with real key checks). [Done]
- Phase 1: DB linkage detected (company_profiles, competitor_analyses.company_profile_id, RPCs upsert_company_profile/link_analysis_to_company/get_user_competitor_analyses). [Verified]
- Phase 2: providersSelected propagation test added; proxy logs instrumented. [Done]
- Phase 2: provider intersection enforced in service (unit); integration propagation verified. [Done]
- Phase 0 preflight (tests/build/typecheck) not yet executed in this session. [Pending]

Global Rules
NEVER:
- Use --no-verify to bypass commit hooks
- Disable tests instead of fixing them
- Commit code that doesn’t compile
- Make assumptions — verify with existing code and DB schema

ALWAYS:
- Commit working code incrementally
- Update plan documentation as you go (this file and the audit)
- Learn from existing implementations and types
- Stop after 3 failed attempts and reassess (open an incident note in docs/)

EVERY AI AGENT MUST:
1. READ THIS ENTIRE PLAN before beginning any work
2. FOLLOW EVERY RULE AND GUIDELINE specified in this document
3. NEVER DEVIATE from the specified implementation patterns
4. NEVER MODIFY requirements without explicit user approval

WORKFLOW ENFORCEMENT:
- NO CODING begins without consulting this plan
- ALL DEVELOPMENT must reference specific sections of this plan
- EVERY COMPONENT must follow the mandatory implementation pattern
- ALL CHANGES must be validated against plan requirements
- THIS PLAN governs all development decisions and processes

### CRITICAL IMPLEMENTATION RULES FOR AI AGENTS
#### 🔥 MANDATORY REUSE DIRECTIVES
1. ONLY CREATE FROM SCRATCH IF file does not exsist in codebase — Always start by looking for the functionalities file/s in the codebase or archive.
2. PRESERVE ALL FUNCTIONALITY — Every feature mentioned in the archived file MUST be included
3. SINGLE SOURCE OF TRUTH ENFORCEMENT — Never create alternative implementations
4. MANDATORY CONSOLIDATION — Always consolidate multiple versions into one authoritative file
5. PRESERVE EXISTING FEATURES — Never simplify or remove functionality during implementation
6. NO SHORTCUTS OR CORNER CUTTING — Implement full functionality exactly as specified
7. NO PLAN MODIFICATIONS — Never adjust requirements without explicit user approval
8. FULL STACK BEST PRACTICES — Follow industry standards for all technologies
9. PRODUCTION-READY CODE ONLY — No temporary implementations or quick fixes
10. MANDATORY CURSOR INTEGRATION — Use full Cursor capabilities and MCP servers
11. PLAN CONSULTATION REQUIRED — Review this plan before any development work
12. CODEBASE CONTEXT UTILIZATION — Leverage Cursor's intelligent code understanding

## 🚨 CRITICAL: SINGLE SOURCE OF TRUTH MANDATE
### ⚠️ ABSOLUTE RULES FOR AI CODING AGENTS — NEVER VIOLATE

RULE #1: ONE SOURCE OF TRUTH PER FUNCTIONALITY
- NEVER create simplified, duplicate, or alternative versions of existing functionality
- ALWAYS work on the designated "source of truth" file for each functionality
- NEVER create files with stub or incomplete code
- ALWAYS enhance and extend the existing master/source-of-truth file

RULE #2: MANDATORY FILE IDENTIFICATION
- BEFORE creating any new file, search for existing files with similar functionality
- BEFORE implementing any feature, check if it already exists in archive or active codebase
- ALWAYS use the highest-quality, most feature-complete version as the base
- NEVER start from scratch if existing functionality exists

RULE #3: CONSOLIDATION OVER CREATION
- WHEN multiple versions of the same functionality exist, consolidate into the best version
- MARK the consolidated version as "SINGLE SOURCE OF TRUTH" in comments
- ARCHIVE or delete conflicting/duplicate files after consolidation
- UPDATE all imports to point to the single source of truth

RULE #4: ENHANCEMENT OVER REPLACEMENT
- ALWAYS enhance existing functionality rather than replacing it
- ADD new features to existing components/services
- PRESERVE all existing functionality when adding new features
- NEVER remove or simplify existing features without explicit user permission

RULE #5: NO PLAN MODIFICATIONS WITHOUT USER APPROVAL
- NEVER modify, skip, or simplify any requirements in this plan
- NEVER make "temporary" implementations or shortcuts
- NEVER adjust scope or functionality without explicit user permission
- ALWAYS implement exactly what is specified in the plan
- ALWAYS ask user for approval before making any plan changes

RULE #6: FULL STACK BEST PRACTICES MANDATORY
- ALWAYS follow industry best practices for every technology
- NEVER cut corners on code quality, security, or performance
- ALWAYS implement comprehensive error handling and validation
- NEVER skip testing, documentation, or compliance requirements

RULE #7: MANDATORY LOVABLE INTEGRATION
- ALWAYS use lovables full capabilities for code generation and editing
- ALWAYS leverage Lovable’s capabilities  for enhanced functionality and efficiency
- NEVER work without first consulting this implementation plan
- ALWAYS use lovables codebase context and intelligent suggestions

RULE #8: MANDATORY PLAN REVIEW FOR ALL AI AGENTS
- EVERY AI agent must read and understand this plan before any work
- ALL development work must reference and follow this plan
- NO coding work begins without plan consultation and approval
- THIS plan is the single source of truth for all development decisions

#### 🚫 FORBIDDEN ACTIONS — NEVER DO THESE
- DO NOT create simplified versions of components (e.g., ComponentSimple.tsx)
- DO NOT create basic/lite versions (e.g., ServiceBasic.ts, UtilityLite.js)
- DO NOT create alternative implementations (e.g., ComponentAlt.tsx)
- DO NOT create temporary/placeholder files (e.g., TempComponent.tsx)
- DO NOT skip any listed functionality from archived versions
- DO NOT use mock data in production components
- DO NOT create duplicate functionality across multiple files
- DO NOT ignore SOC2 compliance requirements
- DO NOT skip testing implementation
- DO NOT create placeholder implementations
- DO NOT remove existing functionality without explicit permission
- DO NOT start from scratch if archived functionality exists
- DO NOT create "version 2" or "new" versions of existing components
- DO NOT make "quick fixes" or "temporary solutions"
- DO NOT skip error handling, validation, or testing
- DO NOT use console.log for production logging
- DO NOT hardcode values that should be configurable
- DO NOT skip TypeScript types or use 'any' type
- DO NOT implement without proper security considerations
- DO NOT skip performance optimization
- DO NOT create code without proper documentation

Global Test Gates (must pass to progress between phases)
- Unit tests
- Integration tests
- E2E tests (Playwright)
- Smoke tests (build + core flows)
- Type checks (tsc/ts-jest)
- Lint (if enabled)

Phase 0 — Preflight: Repo Hygiene and Dependency Impact Assessment
Exit criteria: No failing tests, clean build, no placeholder/mocks in runtime paths

Checklist
- [ ] Verify working tree is clean; ensure hooks active (no --no-verify bypass)
- [ ] Install dependencies: npm ci
- [ ] Type check: npm run typecheck (or tsc -p tsconfig.json)
- [ ] Unit + integration tests: npm test (Jest/Vitest)
- [ ] E2E smoke suite: npx playwright test --grep @smoke (or project tag)
- [ ] Build: npm run build
- [ ] Search for placeholder/mock data in competitor analysis codepaths and UI
  - [ ] grep for strings: "placeholder", "mock", "demo", "lorem", "TODO: replace", sample data arrays
  - [ ] Remove/replace any placeholders in runtime paths with real data integrations
- [ ] Validate Supabase connectivity locally (auth on, RLS enforced)
- [ ] Validate existing edge function competitor-analysis responds 200 and persists data minimally
- [ ] Dependency impact scan
  - [ ] npm ls to detect version conflicts
  - [ ] Confirm @supabase/supabase-js major version is consistent across app and functions
  - [ ] Confirm test libs (@testing-library/*, jest, vitest, playwright) align with current configs

Phase 1 — Database: Master Company Profile Schema & Linkage (RLS)
Exit criteria: company_profiles exists with RLS; competitor_analyses has company_profile_id FK; RPCs created; tests pass

Status: Verified existing schema and RPCs in project. No new migration needed; align with current columns (company_name, website_url, metadata, ai_analysis_data) and existing FK/company_profile_id.

DB Tasks (via migration)
- [x] Create table public.company_profiles — Verified existing (uses company_name, metadata, ai_analysis_data)
  - [ ] Columns (doc-only): planned vs. actual differ; keep existing schema and update docs/types accordingly
  - [ ] Unique constraints (doc-only): confirm normalized name/domain uniqueness in future hardening
  - [x] Trigger: BEFORE UPDATE -> public.update_updated_at_column() — Verified helper exists
  - [ ] Indexes: verify/user_id index present; add domain/website_url index if needed later
- [x] Alter public.competitor_analyses add column company_profile_id — Verified existing
  - [x] Index on company_profile_id — To confirm during DB audit (keep as follow-up if missing)
- [x] Create RPC upsert_company_profile(...) — Verified existing (upsert_company_profile(user_id_param uuid, name_param text, website_url_param text, profile_data_param jsonb))
  - [x] Logic: normalize name/website; insert/update; merge metadata; set last_enriched_at
- [x] Create RPC link_analysis_to_company(...) — Verified existing
  - [x] Validate ownership; set competitor_analyses.company_profile_id
- [ ] Enable/confirm RLS on company_profiles — To verify (policies should mirror existing project patterns)
- [x] Update RPC get_user_competitor_analyses to include fields — Verified includes company_profile_id and extensive fields
  - [x] Add company_profile_id to SELECT list (backward compatible)
  - [x] Include data_quality_score, data_completeness_score, market_sentiment_score, actual_cost, analysis_id, session_id (verified)
  - [x] Ensure ORDER/WHERE stable; SECURITY DEFINER present

Code/Types
- [x] Do not change src/integrations/supabase/types.ts (auto-generated)
- [ ] Adjust service types later (Phase 3) after verification/tests

Tests
- Unit/Integration (DB-facing via client or SQL if supported):
  - [ ] Insert and upsert behavior for upsert_company_profile
  - [ ] Linkage correctness via link_analysis_to_company and RLS ownership
- E2E:
  - [ ] Create a profile via RPC then insert an analysis and link; verify company_profile_id populated
- Smoke:
  - [ ] get_user_competitor_analyses includes company_profile_id and respects RLS

Phase 2 — Edge Function: Provider Enforcement + Persistence + Linkage
Exit criteria: Edge enforces user-toggled providers from api_keys; persists results without placeholders; links analyses to company profiles; logs costs.

Service/Tests
- [x] Service passes providersSelected through to edge body (unit test added)
- [x] StartAnalysis preflights API keys via manage_api_key RPC (existing)
- [ ] Integration: assert edge receives providersSelected and filters using DB keys (pending; needs edge instrumentation/log checks)

Edge Tasks (supabase/functions/competitor-analysis/index.ts)
- [ ] Resolve enabled providers strictly from api_keys where user_id=auth.uid(), is_active=true, status='active'
  - [ ] Ignore any requested providers not toggled in DB
- [ ] Aggregate results using user/org keys only (no globals)
- [ ] Persist results via shared db ops (no placeholders):
  - [ ] updateAnalysisResults() ensures all real fields set; remove any demo defaults beyond safe fallbacks
- [ ] For each competitor result:
  - [ ] Derive domain/name
  - [ ] Call RPC upsert_company_profile -> get company_profile_id
  - [ ] Call RPC link_analysis_to_company(analysis_id, company_profile_id, user_id)
- [ ] Log costs per provider to api_usage_costs via shared cost-tracking utilities
- [ ] Add detailed logging (provider matrix, validated providers, cost/tokens, linkage ids)
- [ ] Ensure CORS and proper OPTIONS handling remain intact

Tests
- Unit (mock Supabase client):
  - [ ] Validated providers filtering logic
  - [ ] upsert_company_profile called with expected values
  - [ ] link_analysis_to_company called with returned id
  - [ ] Results persisted to competitor_analyses without placeholders
  - [ ] api_usage_costs entries inserted with correct metadata
- Integration:
  - [x] Service-level integration test: providersSelected reaches competitor-analysis body
  - [ ] Simulate a run with at least one provider enabled; verify DB side-effects
- E2E:
  - [ ] Trigger competitor-analysis from UI/service; verify analysis row has company_profile_id and completed status
- Smoke:
  - [ ] Edge returns 200 OK and structured JSON; no unhandled errors in logs

Phase 3 — Frontend Services: Types, Retrieval, and Back-Compat
Exit criteria: Services return types updated safely; retrieval includes company_profile_id; tests pass; build clean

Tasks (competitorAnalysisService and related)
- [ ] Ensure getAnalyses() includes company_profile_id in selection and mapping
- [ ] Maintain backward compatibility for consumers
- [ ] Type Safety
  - [ ] Import: import { PostgrestResponse, PostgrestResponseSuccess } from '@supabase/supabase-js'
  - [ ] Service method return types use PostgrestResponseSuccess<...>
  - [ ] Test files use PostgrestResponse (NOT PostgrestResponseSuccess) per project rule
  - [ ] Define/align CompetitorAnalysis interface where used

Tests
- Unit:
  - [ ] Service methods type-check against Supabase types (no any)
  - [ ] MSW mocks return PostgrestResponse in tests
- Integration:
  - [ ] Service fetches company_profile_id; consumers render without errors
- E2E:
  - [ ] Start analysis -> list shows new analysis
- Smoke:
  - [ ] App builds; no unused type errors introduced

Phase 4 — UI Minimal Enhancement: Company Profile Badge (No New Page)
Exit criteria: Badge shows when company_profile_id present; no routing changes; design tokens respected; tests pass

Tasks
- [ ] In Analysis Detail/List, render small badge/link indicator when company_profile_id is set
- [ ] Use design system tokens (no hard-coded colors); responsive and accessible
- [ ] SEO sanity: H1 present once; semantic structure remains intact

Tests
- Unit (React Testing Library):
  - [ ] Badge renders conditionally with proper aria-label
- E2E:
  - [ ] After analysis completes, badge visible in detail/list
- Smoke:
  - [ ] No layout regressions; dark/light modes retain contrast

Phase 4A — UI Comprehensive Data Rendering (All Data Points)
Exit criteria: Analysis Detail shows all persisted data points with graceful empty states; tests pass

Tasks
- [ ] Render Business Info: name, website_url, industry, description, headquarters, founded_year, employee_count, business_model
- [ ] Render Strategy & Market: market_position, overall_threat_level, target_market[], customer_segments[], competitive_advantages[], competitive_disadvantages[], geographic_presence[], market_trends[], partnerships[], certification_standards[]
- [ ] Render SWOT: strengths[], weaknesses[], opportunities[], threats[], swot_analysis{}
- [ ] Render Financial & Strategy: revenue_estimate, pricing_strategy{}, funding_info{}, financial_metrics{}
- [ ] Render Tech & Ops: technology_analysis{}, product_portfolio{}, key_personnel{}, environmental_social_governance{}, social_media_presence{}
- [ ] Render Quality & Meta: data_quality_score, confidence_scores{}, source_citations[], completed_at, last_updated_sources
- [ ] Schema-driven renderer: section components map arrays/objects; only show when data exists; use semantic HTML (<section>, <article>, <aside>) and tokens
- [ ] Accessibility & SEO: headings hierarchy, Helmet tags (title/meta/canonical), image alt text, lazy-load images, structured data (JSON-LD) when applicable
- [ ] Optional realtime: subscribe to competitor_analyses changes for the analysis id; update view live

Tests
- Unit:
  - [ ] Given a fully populated analysis object, each section renders and key fields are visible (data-testid)
- Integration:
  - [ ] Service fetch returns fields consumed by the detail component without runtime type errors
- E2E:
  - [ ] After a run completes, user navigates to detail and sees representative fields across all sections
- Smoke:
  - [ ] Navigation between list/detail remains fast; no console errors

Phase 4B — Export Completeness (Optional but Recommended)
Exit criteria: JSON/CSV export includes all displayed fields; tests pass

Tasks
- [ ] Ensure exportAnalysis includes all fields rendered in UI
- [ ] Add download actions and verify content integrity

Tests
- Unit/Integration:
  - [ ] Export function returns a fully populated object/CSV with matching keys
- E2E:
  - [ ] User triggers export; downloaded file contains expected fields

Phase 5 — Observability: Cost + Progress Consistency
Exit criteria: Costs logged server-side; progress logs consistent; tests pass

Tasks
- [ ] Ensure competitorProgressService remains compatible; no duplicate logging
- [ ] Verify api_usage_costs entries written per provider run
- [ ] Add minimal dashboards/queries if applicable (no UI changes required)

Tests
- Unit:
  - [ ] cost-tracking calculate* functions return expected values
- Integration:
  - [ ] Edge inserts api_usage_costs and updates competitor_analyses.actual_cost
- E2E:
  - [ ] Run completes; monthly spend > 0 for user
- Smoke:
  - [ ] No RLS violations when inserting cost logs

Phase 6 — Placeholder/Data Sanity Guardrails
Exit criteria: No placeholders in runtime; guard test ensures we don’t regress

Tasks
- [ ] Add a test that fails if specific placeholder strings exist in src/services or supabase/functions paths
- [ ] Replace any remaining demo content in UI components with empty states and loading states

Tests
- Unit:
  - [ ] Placeholder guard test passes
- E2E:
  - [ ] Empty states render without dummy content when no analyses exist
- Smoke:
  - [ ] Build ok; UI doesn’t show placeholders

Phase 7 — Regression & Dependency Impact Verification
Exit criteria: All tests pass; no cross-feature regressions; admin-panel-service unaffected

Tasks
- [ ] Run full test suite
- [ ] Build artifacts and analyze warnings
- [ ] Spot-check admin panel service calls (executeRPC, recordApiUsage) for compatibility
- [ ] Validate supabase/functions/config.toml integrity (project_id first line; no unintended changes)
- [ ] Verify RLS policies not over-permissive; linter clean (if available)

Tests
- [ ] Unit/Integration/E2E: full pass
- [ ] Smoke: core flows (login, view analyses, start analysis, view progress, export)

Rollout & Safety
- [ ] Optional feature flag in edge: enable_master_profile_linkage (default true); fallback safe
- [ ] Add clear logging and link to function logs for monitoring

Quality Gates Before Merge per Phase
- [ ] Code compiles; no type errors
- [ ] All tests in the phase pass (unit, integration, e2e, smoke)
- [ ] Security review: RLS, no raw SQL in edge, keys per user/org only
- [ ] Dependency impact reviewed (no breaking changes)
- [ ] Documentation updated (this plan + audit doc)

Documentation Updates (Continuous)
- [ ] Update src/docs/market-research/competitor-analysis-dataflow-audit.md status when phases complete
- [ ] Record any deviations, rollbacks, or learnings

Sign-off Checklist
- [ ] New analyses auto-create/update Master Company Profile and link FK
- [ ] Only toggled providers used by edge
- [ ] api_usage_costs entries present per run/provider
- [ ] UI shows real data with proper empty states; no placeholders
- [ ] RLS prevents cross-user access; verified in tests

## Post-Competitor Analysis TODO
- [ ] Implement Affiliate Link System Enhancements (see docs/affiliate/affiliate-link-enhancements-plan.md)
