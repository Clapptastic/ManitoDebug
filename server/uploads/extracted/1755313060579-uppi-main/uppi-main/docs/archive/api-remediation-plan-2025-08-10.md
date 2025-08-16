# API Remediation & Hardening Plan

Date: 2025-08-10
Owner: Platform Engineering
Scope: Fix all issues from docs/api-audit-2025-08-10.md and ensure end-to-end API health, reliability, and security.

---

## 0) Goals & Success Criteria
- No permission denied errors in client logs (RLS-safe access only)
- All edge functions operational with clear degraded reasons when applicable
- Per-user API key usage across all AI providers; no reliance on global secrets for user work
- Competitor analyses persist correctly and are visible in UI
- Admin Debug Report includes all tab-specific errors and copies cleanly

KPIs: Health checks ≥ 99% operational, 0 PII leaks, < 1% request error rate, 100% unit/integration test pass.

---

## Progress & Status
- Tracker: Completed tasks / Total tasks = Percentage
- Current: 20 / 96 tasks (21%)
- Last updated: 2025-08-10T21:35:00Z
- Stream summary: Created provider runs/results/combined tables with RLS and indexes; added aggregate-analysis EF; wired UI enrichment via analysis_combined; metrics pipeline stable.

---

## 1) Edge Functions: Key Management & Validation

Issues: check-api-keys base64 decode errors; validate-api-key missing payload; ai-validation-engine Unauthorized to OpenAI.

Tasks:
1. Create a shared decryptIfNeeded helper in each function file (no cross-file imports in Edge Functions):
   - Accept possibly encrypted base64 string or plaintext; detect via pattern and try/catch decode, fall back to plaintext
   - On decode failure, return typed error with provider-specific guidance
2. Standardize key fetch path using RPC manage_api_key('get_for_decryption'):
   - Inputs: provider, user_id (default auth.uid), mode (validate/test)
   - For admin diagnostics only, allow explicit key in body; otherwise always per-user via RPC
3. Input validation (zod-like schema locally):
   - validate-api-key: require provider, mode; optional user_id (admin only)
   - check-api-keys: iterate user’s active keys; skip malformed with clear error, continue others; aggregate result
4. Error mapping:
   - OpenAI Unauthorized → ‘Key invalid or lacks model scope’
   - Perplexity decode error → ‘Key stored in non-standard format; re-save via Settings’
5. Observability:
   - Log to api_metrics (endpoint, provider, status_code surrogate, response_time_ms, error_msg) with service role
   - Include request_id for correlation
6. Admin API Keys function:
   - Use service-role Supabase client to read admin_api_keys (minimal, non-sensitive fields or aggregates only)
   - Gate with is_admin_user(auth.uid()) and return 403 when unauthorized
   - Alternatively, expose SECURITY DEFINER RPC with curated fields and call it from function/UI
7. Auth handling across functions (fix AuthSessionMissing in user-api-keys, document-processing, etc.):
   - Create Supabase client per request with headers: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: req.headers } })
   - Derive user via supabase.auth.getUser(); if missing, return 401 with actionable message
   - Require verify_jwt = true in supabase/config.toml for protected functions; keep public-only ones false
   - Ensure CORS + OPTIONS handler on every function
8. Standardized error responses & CORS:
   - Adopt consistent corsHeaders and createErrorResponse pattern across all functions

Tests:
- Unit: decryptIfNeeded(table of cases), provider prefix validation, payload validation
- Integration: validate-api-key with missing provider → 400; valid per-user key path → 200

Risks/Mitigations:
- Legacy keys in mixed formats → keep tolerant path; add user-facing re-save prompt in Settings.

---

## 2) Database Access & RLS Compliance

Issues: permission denied for api_keys, admin_api_keys, system_components; DB liveness probe reading restricted tables.

Tasks:
1. Replace client reads on restricted tables with safe alternatives:
   - admin_api_keys → Edge Function ‘admin-api-keys’ (service role) or RPC returning non-sensitive aggregates
   - api_keys → ALWAYS via manage_api_key RPC or Edge Function
   - system_components → expose curated RPC get_system_health_overview (already present)
2. DB liveness probe in Admin UI:
   - Replace select on admin_api_keys with rpc('debug_auth_context') success status
3. Validate RLS policies:
   - Ensure insert/update paths that include user_id columns are present for competitor_analyses and related tables
   - Add missing SELECT policies where necessary via SECURITY DEFINER RPCs rather than direct table exposure

Tests:
- Integration: Admin page loads with no permission errors
- Policy: Non-owner cannot view others’ keys/analyses

Risks:
- Overly permissive policies → use SECURITY DEFINER RPCs instead of widening table policies.

---

## 3) Microservice Health Monitor

Issues: Placeholder URLs (404/timeouts) creating noisy logs.

Tasks:
1. Source URLs from public.microservices table (exists) with columns: name, base_url, health_path, is_active
2. Implement graceful degradation:
   - 404/timeout → status ‘degraded’ with concise reason; throttle repeats; keep last_success timestamp
3. Persist simple health metrics to edge_function_metrics or api_metrics for trend view

Tests:
- Integration: when a service is down, Admin UI shows ‘degraded’ with clear reason; logs not spammy

Risks:
- Missing/invalid microservices rows → default to disabled, surface admin reminder.

---

## 4) Competitor Analysis Data Flow

Issues: UI receives empty arrays though companies exist; save path incomplete.

Tasks:
1. Ensure orchestration function sets final record in competitor_analyses:
   - Fields: status='completed', analysis_data, actual_cost, completed_at, data_quality_score
2. Use existing progress functions (insert_competitor_analysis_progress/update_competitor_analysis_progress) for status
3. Confirm RLS insert path:
   - All inserts include user_id=auth.uid(); if edge function uses service role, enforce user_id provided and authorized
4. Add retries on transient failures and idempotency (check by session_id+user_id)

Tests:
- E2E: run analysis, verify row appears for user and visible via get_user_competitor_analyses

Risks:
- Partial writes → ensure transactions or compensate with progress updates + retry.

---

## 5) Admin UI (APIIntegrationMap) Enhancements

Issues: DB probe hitting restricted table; need full tab error aggregation (already added in Debug Report).

Tasks:
1. Update Database Core healthCheck to use rpc('debug_auth_context')
2. Keep issues_summary + new tab_error_details in Debug Report (done)
3. Ensure ‘View Error’ modal always has Copy for AI and includes suggested actions + deep links to Function Logs

Tests:
- Manual: Generate Debug Report → includes all tab errors; Copy for AI works

Risks:
- None (UI-only change, non-breaking).

---

## 6) Build/Quality Hygiene

Issues: import.meta.glob deprecated option, type safety.

Tasks:
1. Replace import.meta.glob({ as: 'raw' }) with { query: '?raw', import: 'default' } where present
2. Types:
   - Use PostgrestResponse in test files per guidelines; avoid any; comprehensive fields in mocks
3. Expand unit tests for Edge Functions’ payload validation & key handling

---

## 7) Verification & Rollout

Phases:
- Phase 1 (Today): Edge Functions fixes (key handling, input validation, observability); Admin UI DB probe
- Phase 2: Microservice health config + graceful handling; Competitor analysis persistence path
- Phase 3: Quality hygiene (glob deprecation), tests expansion

Verification Matrix:
- Health checks show operational/degraded with reasons; no permission errors
- AI validation succeeds with valid per-user keys; clear messages otherwise
- Competitor analyses visible after run
- Debug Report includes tab_error_details and copies cleanly

Rollback:
- Feature flags per function/version; retain previous function versions; can toggle health monitor sources back to static list.

---

## 8) Task Board (Actionable Checklist)

A. Plan Initialization
- [x] Capture and integrate user approvals (Edge scopes, RPCs with SECURITY DEFINER, Metrics store, Providers, Auth policy, Idempotency, Alerts, Dependency hygiene, Progress tracker)
- [x] Compile Edge Function inventory from supabase/config.toml and repo summaries

B. Edge Function Inventory Audit (apply criteria to each, then check)
Criteria (apply to all): CORS+OPTIONS present; verify_jwt matches config; per-request Supabase client using request headers; no raw SQL; standardized errors; logs to api_metrics; input validation; uses manage_api_key where relevant.
- [ ] ai-chat
- [ ] ai-cofounder-chat
- [ ] ai-profile-setup
- [ ] analyze-trends
- [ ] admin-api (if present)
- [ ] admin-api-keys
- [ ] api-key-management
- [ ] api-key-validation
- [ ] check-api-keys
- [ ] code-embeddings
- [ ] code-wiki
- [ ] competitor-analysis
- [x] aggregate-analysis
- [ ] database-optimizer
- [ ] database-schema
- [ ] enrich-analysis-with-master-profile
- [ ] get-anthropic-usage
- [ ] get-cohere-usage
- [ ] get-function-url (public)
- [ ] get-gemini-usage
- [ ] get-mistral-usage
- [ ] get-openai-usage
- [ ] get-perplexity-usage
- [ ] github-code-embed
- [x] log-api-metric
- [ ] microservice-health
- [ ] microservices
- [ ] package-manager
- [ ] process-application-embeddings
- [ ] process-code-embeddings
- [ ] process-document
- [ ] prompt-get (public)
- [ ] secure-embeddings-api (public)
- [ ] secure-openai-chat
- [ ] semantic-code-search
- [ ] set-super-admin
- [ ] swagger-ui (public)
- [ ] system-health
- [ ] type-coverage-analysis
- [ ] validate-api-key
- [ ] populate-master-profiles

C. Metrics Store (api_metrics)
- [x] Create table api_metrics (pre-existing; validated schema with endpoint/method/status_code/metadata/response_time_ms/user_id/created_at)
- [x] Indexes: (created_at), (user_id, created_at), (endpoint, created_at), (status_code, created_at), (response_time_ms)
- [x] RLS: enable; policies allow service_role insert and user/admin select (validated existing)
- [x] Update edge functions to log into api_metrics using service role key (microservice-health, log-api-metric, validate-api-key, user-api-keys)
- [ ] Tests: insert/select policies; basic aggregation works

D. Providers Coverage & Toggles
- [ ] Locate provider toggle source of truth in codebase; consolidate if multiple
- [ ] Ensure supported providers: openai, anthropic, gemini, cohere, mistral, perplexity, groq (extendable)
- [x] Client validation: added GROQ key format (gsk_*, len>=40)
- [ ] Competitor analysis orchestration respects enabled providers order and "use org keys first"
- [ ] Tests: toggles on/off correctly change provider selection; fallback when none enabled

E. Alerts & Notifications (failures/degraded states)
- [ ] Confirm channel (Slack webhook preferred?) and secret name (SLACK_WEBHOOK_URL)
- [ ] Create admin-only Edge Function admin-alerts (verify_jwt = true) to send minimal webhook payload
- [ ] Store secret in Supabase secrets; do not expose client-side
- [ ] Wire critical paths (health failures, repeated provider failures) to optional alert sender
- [ ] Tests: non-admin 403; admin 200; webhook send mocked

F. Edge Functions: Key Handling & Validation
- [ ] decryptIfNeeded helper per function (no cross-file imports)
- [ ] validate-api-key schema + manage_api_key('get_for_decryption') path
- [ ] Fix AuthSessionMissing by using per-request Supabase client with headers
- [ ] Standardize corsHeaders and createErrorResponse
- [ ] Integration tests for 401/403/400 cases and happy path

G. Competitor Analysis Persistence & Idempotency
- [ ] On completion, update competitor_analyses with final fields (status, analysis_data, actual_cost, completed_at, data_quality_score)
- [ ] Use insert/update progress RPCs for status updates
- [ ] Enforce RLS-safe writes (user_id = auth.uid or authorized service role)
- [ ] Idempotency check (session_id + user_id) prior to insert; retries on transient failure
- [ ] E2E test: analysis visible via get_user_competitor_analyses

H. Dependency Hygiene
- [ ] Run security audit and outdated scan
- [ ] Apply conservative patch/minor updates to critical deps; lock exact versions
- [ ] Run full test suite; fix regressions if any
- [ ] Document changes and rationale in CHANGELOG

I. Quality Hygiene & Types
- [ ] Replace import.meta.glob deprecated options
- [ ] Supabase types: tests use PostgrestResponse; services use PostgrestResponseSuccess; mocks complete
- [ ] Expand unit tests for payload validation and key handling

---

## 9) Links (for quick access)
- Edge Functions Dashboard: https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/functions
- Logs:
  - validate-api-key: https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/functions/validate-api-key/logs
  - check-api-keys: https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/functions/check-api-keys/logs
  - ai-validation-engine: https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/functions/ai-validation-engine/logs
  - microservice-health: https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/functions/microservice-health/logs
  - system-health: https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/functions/system-health/logs
  - competitor-analysis: https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/functions/competitor-analysis/logs
- SQL Editor: https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/sql/new

---

Notes:
- We will not expose secrets in the client; all sensitive reads go via SECURITY DEFINER RPC or service-role Edge Functions.
- Do not modify reserved schemas; prefer RPCs to widen access safely.

---

## 10) Development Guidelines (Mandatory for AI Agents)

## Philosophy

### Core Beliefs

- Incremental progress over big bangs - Small changes that compile and pass tests
- Learning from existing code - Study and plan before implementing
- Pragmatic over dogmatic - Adapt to project reality
- Clear intent over clever code - Be boring and obvious

### Simplicity Means

- Single responsibility per function/class
- Avoid premature abstractions
- No clever tricks - choose the boring solution
- If you need to explain it, it's too complex

## Process

### 1. Planning & Staging

Break complex work into 3-5 stages. Document in IMPLEMENTATION_PLAN.md:

```markdown
## Stage N: [Name]
**Goal**: [Specific deliverable]
**Success Criteria**: [Testable outcomes]
**Tests**: [Specific test cases]
**Status**: [Not Started|In Progress|Complete]
```
- Update status as you progress
- Remove file when all stages are done

### 2. Implementation Flow

1. Understand - Study existing patterns in codebase
2. Test - Write test first (red)
3. Implement - Minimal code to pass (green)
4. Refactor - Clean up with tests passing
5. Commit - With clear message linking to plan

### 3. When Stuck (After 3 Attempts)

CRITICAL: Maximum 3 attempts per issue, then STOP.

1. Document what failed:
   - What you tried
   - Specific error messages
   - Why you think it failed

2. Research alternatives:
   - Find 2-3 similar implementations
   - Note different approaches used

3. Question fundamentals:
   - Is this the right abstraction level?
   - Can this be split into smaller problems?
   - Is there a simpler approach entirely?

4. Try different angle:
   - Different library/framework feature?
   - Different architectural pattern?
   - Remove abstraction instead of adding?

## Technical Standards

### Architecture Principles

- Composition over inheritance - Use dependency injection
- Interfaces over singletons - Enable testing and flexibility
- Explicit over implicit - Clear data flow and dependencies
- Test-driven when possible - Never disable tests, fix them

### Code Quality

- Every commit must:
  - Compile successfully
  - Pass all existing tests
  - Include tests for new functionality
  - Follow project formatting/linting

- Before committing:
  - Run formatters/linters
  - Self-review changes
  - Ensure commit message explains "why"

### Error Handling

- Fail fast with descriptive messages
- Include context for debugging
- Handle errors at appropriate level
- Never silently swallow exceptions

## Decision Framework

When multiple valid approaches exist, choose based on:

1. Testability - Can I easily test this?
2. Readability - Will someone understand this in 6 months?
3. Consistency - Does this match project patterns?
4. Simplicity - Is this the simplest solution that works?
5. Reversibility - How hard to change later?

## Project Integration

### Learning the Codebase

- Find 3 similar features/components
- Identify common patterns and conventions
- Use same libraries/utilities when possible
- Follow existing test patterns

### Tooling

- Use project's existing build system
- Use project's test framework
- Use project's formatter/linter settings
- Don't introduce new tools without strong justification

## Quality Gates

### Definition of Done

- [ ] Tests written and passing
- [ ] Code follows project conventions
- [ ] No linter/formatter warnings
- [ ] Commit messages are clear
- [ ] Implementation matches plan
- [ ] No TODOs without issue numbers

### Test Guidelines

- Test behavior, not implementation
- One assertion per test when possible
- Clear test names describing scenario
- Use existing test utilities/helpers
- Tests should be deterministic

## Important Reminders

NEVER:
- Use --no-verify to bypass commit hooks
- Disable tests instead of fixing them
- Commit code that doesn't compile
- Make assumptions - verify with existing code

ALWAYS:
- Commit working code incrementally
- Update plan documentation as you go
- Learn from existing implementations
- Stop after 3 failed attempts and reassess

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
#### MANDATORY REUSE DIRECTIVES
1. ONLY CREATE FROM SCRATCH IF file does not exsist in codebase - Always start by looking for the functionalities file/s in the codebase or archive.
2. PRESERVE ALL FUNCTIONALITY - Every feature mentioned in the archived file MUST be included
3. SINGLE SOURCE OF TRUTH ENFORCEMENT - Never create alternative implementations
4. MANDATORY CONSOLIDATION - Always consolidate multiple versions into one authoritative file
5. PRESERVE EXISTING FEATURES - Never simplify or remove functionality during implementation
6. NO SHORTCUTS OR CORNER CUTTING - Implement full functionality exactly as specified
7. NO PLAN MODIFICATIONS - Never adjust requirements without explicit user approval
8. FULL STACK BEST PRACTICES - Follow industry standards for all technologies
9. PRODUCTION-READY CODE ONLY - No temporary implementations or quick fixes
10. MANDATORY CURSOR INTEGRATION - Use full Cursor capabilities and MCP servers
11. PLAN CONSULTATION REQUIRED - Review this plan before any development work
12. CODEBASE CONTEXT UTILIZATION - Leverage Cursor's intelligent code understanding

## 🚨 CRITICAL: SINGLE SOURCE OF TRUTH MANDATE

### ⚠️ ABSOLUTE RULES FOR AI CODING AGENTS - NEVER VIOLATE

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

#### 🚫 FORBIDDEN ACTIONS - NEVER DO THESE
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
