# Competitor Analysis – End-to-End Implementation Plan (Max Data Extraction)

Date: 2025-08-09
Owner: Platform Architecture
Scope: Unify provider prompts, normalize results, compute trust/quality, persist securely with RLS, and render every UI field consistently across tabs.
Do not code in this step; this is an actionable plan.

---

## 0) Objectives
1. Guarantee every provider returns the canonical schema (single superset).
2. Normalize/merge per-provider payloads into one coherent record.
3. Compute field-level confidence and multi-provider consistency; produce a 0–100 Data Quality score.
4. Persist results securely (user/org scoped) with costs and provenance.
5. Ensure all frontend fields map to data, hide unknowns gracefully, and display provider_count/consistency.
6. Provide exhaustive tests and monitoring.

---

## 1) Canonical Data Model (Source of Truth)
1.1 Define/confirm canonical keys (already used in orchestrator):
- Identity: company_name, website_url, industry, description, employee_count, founded_year, headquarters, business_model
- Positioning: target_market[], market_position, market_share_estimate
- SWOT: strengths[], weaknesses[], opportunities[], threats[]
- Strategy: competitive_advantages[], competitive_disadvantages[], partnerships[]
- Pricing & Finance: pricing_strategy (object|string), funding_info (object)
- Technology: technology_analysis (string|object), social_media_presence (object)
- Meta: source_citations[{field,source,url?,confidence?}], confidence (Record<string,number>), analyzed_at, analysis_method
- Quality/Consistency: data_quality_score (0–1 inbound → normalize), providers_used[], provider_count, confidence_scores.consistency_score (0–1)

1.2 Normalization rules:
- Accept null/empty for unknown values; do NOT invent defaults.
- If technology_analysis is a string, store as technology_analysis.summary; leave nested fields undefined.
- Convert any confidence values 0..1 to float; never >1.0.
- Derive provider_count from providers_used length or confidence.overall key count.

1.3 Storage mapping to competitor_analyses:
- Map company_name → name (top-level) but keep original under analysis_data.primary_result.company_name for provenance.
- Store raw per-provider payloads under analysis_data.providers[provider].raw.
- Store merged result under top-level canonical columns and analysis_data.primary_result.
- Persist providers_used[], provider_count, consistency_score, data_quality_score (0..100 stored), cost_breakdown, total_api_cost.

---

## 2) Provider Prompts – Harmonization
2.1 Ensure all active providers request EXACT canonical keys (OpenAI, Anthropic, Perplexity, Gemini). Keep strict JSON-only instruction.
2.2 Include these rules in every prompt:
- “Return ONLY valid JSON; no markdown.”
- “Use null for unknowns; cite sources in source_citations with url if available.”
- “Include ‘confidence’ 0..1 per returned key.”
2.3 Model tuning:
- Set temperature low (0.2–0.3) for factual outputs.
- max_tokens ~1500; allow provider-specific limits.
2.4 Error handling:
- If model returns extra text, regex-extract first JSON object; log parsing anomalies.

---

## 3) Per-Provider Parsing & Validation
3.1 After parsing, run schema validator (zod or custom) to coerce/strip fields.
3.2 Normalize types:
- Numbers: coerce numeric strings (e.g., "221000") to numbers; strip %, $ in market_share/revenue if present.
- Arrays: ensure arrays for list fields; fallback to [] if not.
- Objects: pricing_strategy, funding_info; if strings, move to .description.
3.3 Stamp provider metadata: provider name, model, latency, token usage, partial errors.
3.4 Record source_citations: ensure each entry has field, source, optional url, and confidence 0..1.

---

## 4) Merge Strategy (Multi-Provider)
4.1 Field precedence:
- If multiple providers returned a field:
  - Categorical/text short fields: pick majority by normalized string match (case/trim), fallback to highest-confidence provider.
  - Numeric fields: median of numeric candidates; capture dispersion.
  - Arrays: union by Jaccard threshold > 0.8; rank items by frequency and provider confidence.
4.2 Provenance:
- For each final field, store contributing providers, raw values, and per-provider confidence in analysis_data.provenance[field].
4.3 providers_used & provider_count: set from successful provider responses.

---

## 5) Trust, Consistency, and Data Quality
5.1 Per-field confidence:
- Aggregate per-provider confidences with freshness and agreement (from methodology):
  E_s = w_s * F_s * V_s * G_s (weights configured by source class; for AI, w≈0.35; bump via multi-agent consensus)
- Compute field Trust Score T_f: scaled 0..100; store in confidence_scores.primary_result[field] as 0..1 (divide by 100).
5.2 Consistency score:
- Compare providers for overlapping fields using:
  - Numeric: relative deviation vs median (≤5% ok)
  - Categorical: majority match
  - Arrays: Jaccard similarity
- confidence_scores.consistency_score = average agreement across populated fields (0..1).
5.3 Data Quality score (record-level):
- Weighted blend of: field coverage (completeness), average T_f, citations density (with URLs), and consistency bonus.
- Output 0..100; store as integer/float percent. In UI always display Math.round(score).

---

## 6) Persistence & Costs
6.1 Costs: record cost per provider call with tokens, model, latency in api_usage_costs and analysis_data.cost_breakdown.
6.2 Update competitor_analyses row:
- Set status (running → completed/failed), providers_used, provider_count, data_quality_score (0..100), confidence_scores, analysis_data (merged result + provenance), total_api_cost.
6.3 Audit log: insert Audit with action=update_analysis, resource_id=analysis.id, metadata (providers, costs, changes).

---

## 7) Frontend Normalization & Rendering
7.1 useAnalysisReport hook:
- Backfill top-level from analysis_data.primary_result ONLY when missing.
- Provide computed provider_count = analysis_data.provider_count || providers_used?.length || Object.keys(confidence_scores.overall||{}).length.
- Expose normalized technology_analysis: if string → { summary } and keep string too for legacy.
- Ensure data_quality_score exposed to UI as 0..100 (not 0..1).
7.2 UI fixes (no logic change beyond display):
- Quality: show Math.round(data_quality_score) + ‘%’ consistently.
- Multi-Source panel: show when provider_count > 1; show consistency = Math.round(consistency_score*100)%.
- Hide 0% for unknown metrics (market_share_estimate, sentiment) unless explicitly 0 is meaningful; prefer null to hide.
- Personnel “Employee Verified”: read top-level employee_count_verified if primaryResult undefined.
- SourceCitations: prefer real citations; fallback to confidence-derived only when none.
7.3 Navigation badges:
- Executive badge = quality%; SWOT badge = total items; Sources badge = citations count.

---

## 8) API Key Security & Selection
8.1 Use manage_api_key RPC (select/get_for_decryption) with user scope.
8.2 Enforce provider toggles: only call providers with active keys and user selection.
8.3 Budget enforcement: check_user_cost_allowed(projected) pre-flight and mid-run; respect alerts and stop early if disallowed.

---

## 9) Error Handling & Retries
9.1 Per provider: if non-OK, log and continue; do not fail the entire analysis.
9.2 Parsing safeguards: extract JSON block; on failure, log and skip.
9.3 Partial completion: write analysis with status=completed and metadata.partial=true if some providers failed.

---

## 10) Tests (Typesafe & Deterministic)
10.1 Unit: normalization utils (numbers, arrays, objects), merge logic (majority/median/Jaccard), trust scoring (methodology invariants), scaling boundaries (0..1 vs 0..100).
10.2 Service tests: competitorAnalysisService invokes edge function, persists mapping, reads back with maybeSingle.
10.3 Edge function tests (mock HTTP): per-provider prompt, parse, merge, provenance, costs, final payload shape.
10.4 UI tests: per-tab rendering toggles (hide nulls), quality/consistency badges, citations fallback.
10.5 Type conformance: no ‘any’; interfaces aligned with src/types/competitor/unified-types.ts; Postgrest types in tests follow guidance.

---

## 11) Observability & Ops
11.1 Edge logs: log provider start/stop, latency, tokens, parse errors; redact keys.
11.2 Metrics: api_usage_costs, performance_logs for slow ops, system_health metrics.
11.3 Dashboard: show provider coverage per analysis (used vs available), costs, and quality trend.

---

## 12) Rollout Plan
12.1 Feature flag ‘multi_provider_merge_v1’ for algorithmic scoring & merge.
12.2 Backfill job: recompute data_quality_score and consistency for recent N analyses.
12.3 Progressive enablement: start with OpenAI-only normalization; enable others incrementally.
12.4 Post-deploy validation: sample 10 analyses; verify UI field coverage vs audit checklist.

---

## 13) Acceptance Criteria
- All tabs render without placeholders when data exists; unknowns hidden gracefully.
- provider_count and consistency visible with multi-provider runs.
- Data Quality consistently shown as NN% (0..100).
- Citations list available with URLs where provided; fallback works.
- Unit and UI tests pass; no ‘any’ types introduced; RLS unaffected.

---

## 14) Work Items (Checklist)
A. Orchestrator: enforce canonical prompts for A/O/G/P; parse & normalize; provenance; merge; compute quality/consistency; persist; costs; audit.
B. Normalizers: numbers, strings, arrays, objects; technology_analysis shape guard; pricing/funding coercion.
C. Hook/UI: scaling fix, provider_count derivation, hide-unknowns policy, personnel verified fallback, citations priority.
D. Tests: unit (merge/scoring), service, UI, types.
E. Observability: logs, metrics dashboard additions.
F. Rollout: flagging, backfill, validation.

---

## 15) Risks & Mitigations
- Model drift: keep low temperature; add deterministic validators; surface parse anomalies.
- Cost overruns: budget checks; provider selection gating.
- Partial provider outages: resilient merge; status partial-complete.
- Schema creep: single canonical schema gate; strict validator with allowed extras dropped into analysis_data.extra.

---

## 16) Timeline (Suggested)
Week 1: Provider harmonization, normalization utils, orchestrator merge prototype, UI scaling/provider_count fixes.
Week 2: Trust/consistency algorithm per methodology, provenance storage, tests, logs/metrics.
Week 3: Backfill, rollout with flag, dashboard views, documentation.

---

## 17) Documentation
- Update DATA_QUALITY_METHODOLOGY.md references inside code comments for scoring steps.
- Add diagrams to docs for merge and scoring flow.
- Include mapping table from audit (already created) and keep in sync.

---

## 18) Superadmin Prompt Management (Single Source of Truth)
Goal: Provide a centralized, versioned, auditable Prompt Management page in the Superadmin panel to view, edit, version, and roll back every AI prompt used across the platform. Fully functional at 100% and enforced as the system’s single source of truth.

## 18) Superadmin Prompt Management (Single Source of Truth)
Goal: Provide a centralized, versioned, auditable Prompt Management page in the Superadmin panel to view, edit, version, and roll back every AI prompt used across the platform. Fully functional at 100% and enforced as the system’s single source of truth.

> Progress: 100% — Integration tests added for DB path; edge function, seeding, UI wiring, RLS, and audit logs complete.

18.0 Status Checklist
- [x] DB schema (prompts, prompt_versions), indexes
- [x] Triggers (update_updated_at, set_prompt_version with security definer)
- [x] RLS and policies (super_admin full, service_role select)
- [x] Admin nav + /admin/prompts route
- [x] Service layer: create/update/delete, versioning, history, rollback, audit logs
- [x] UI wired to service (editor/history/rollback)
- [x] Seed initial prompts into DB
- [x] Edge function read path with caching and alerts (CORS enabled)
- [x] Integration/E2E tests (basic integration via mocked DB path)

18.1 Prompt Coverage (Scope)

18.1 Prompt Coverage (Scope)

18.1 Prompt Coverage (Scope)
- Must include prompts for all AI-powered domains (keys suggested):
  - competitor_analysis.openai.primary
  - competitor_analysis.anthropic.primary
  - competitor_analysis.perplexity.primary
  - competitor_analysis.gemini.primary
  - news_aggregator.openai.summary
  - financial_data.openai.enrichment
  - ai_drill_down.openai.followup
  - data_quality_analyzer.openai.validation
  - generate_forecast.openai.forecast
  - any other model/provider prompts referenced by edge functions or services

18.2 Data Model (Supabase)
- Table: prompts (single source of truth index)
  - id UUID PK (default gen_random_uuid())
  - key TEXT UNIQUE NOT NULL            -- e.g., "competitor_analysis.openai.primary"
  - provider TEXT NOT NULL              -- openai|anthropic|perplexity|gemini|cohere|mistral|system
  - domain TEXT NOT NULL                -- competitor_analysis|news|financials|drill_down|quality|forecast|admin
  - description TEXT                    -- what this prompt does
  - current_version_id UUID NULL        -- FK to prompt_versions.id (current active)
  - is_active BOOLEAN DEFAULT TRUE
  - created_at TIMESTAMPTZ DEFAULT now()
  - updated_at TIMESTAMPTZ DEFAULT now()

- Table: prompt_versions (immutable version history)
  - id UUID PK (default gen_random_uuid())
  - prompt_id UUID NOT NULL             -- FK to prompts.id
  - version INTEGER NOT NULL            -- monotonically increasing per prompt
  - content TEXT NOT NULL               -- full prompt body
  - metadata JSONB DEFAULT '{}'         -- e.g., temperature, max_tokens, notes
  - created_by UUID NOT NULL            -- user id of editor
  - created_at TIMESTAMPTZ DEFAULT now()
  - is_rollback BOOLEAN DEFAULT FALSE   -- marked true if created by rollback

- Triggers
  - update_updated_at_column on prompts

- Indexes
  - UNIQUE (prompt_id, version) on prompt_versions
  - INDEX on prompts.key, prompts.domain, prompts.provider

- RLS (Security)
  - Only super_admin (per get_user_role) may SELECT/INSERT/UPDATE/DELETE
  - service_role may SELECT (read-only) for edge functions to fetch prompts
  - No admin or regular user access
  - All edits must be audit logged via admin_audit_log

18.3 Service/Edge Function Integration (Read Path)
- All AI callers must fetch the prompt by key from prompts joined to prompt_versions via current_version_id.
- The prompt text returned is the single source of truth; do not hardcode.
- Caching: in-memory per-edge-function with short TTL (e.g., 60s) to reduce DB reads.
- Failure behavior: if not found, log error (admin alert) and fail safely; do NOT invent defaults.

18.4 UI/UX (Superadmin Panel)
- Route: /admin/prompts
- Admin side nav: add “Prompts” (under Configuration or System)
- Page layout
  - Header: H1 “AI Prompts (Single Source of Truth)” with description
  - Toolbar: Search by key/domain/provider; filters; add new prompt button
  - Table: columns = Key, Provider, Domain, Description, Current Version, Last Updated, Actions (View, Edit, History, Duplicate)
  - View/Edit Drawer or Modal
    - Readonly viewer for current version with provider/domain/key metadata
    - Edit mode uses a large textarea/editor (monospace) with character count
    - Save → creates new prompt_versions row (version+1) and sets prompts.current_version_id
    - Show diff vs previous version on save confirmation
  - History Modal/Panel
    - List versions with: version, created_at, created_by, is_rollback, metadata summary
    - Actions: View, Compare vs current, Roll back → pick a previous version; creates new version by copying selected content (is_rollback=true)
    - Rollback confirmation dialog explaining audit trail impact
  - Notifications: toasts for success/error; optimistic UI but always confirms result from DB

18.5 Audit & Compliance
- Every create/edit/rollback must write to admin_audit_log with resource_type='prompt' and resource_id=prompt_id
- Include diffs in metadata where possible (size-limited); always include old_version/new_version

18.6 Access Control
- Only super_admin can view/edit/rollback; all other roles have no access
- Edge functions use service_role to read prompts (read-only); enforced via RLS and UI guards

18.7 Testing (Prompt Management)
- Unit: version increment logic, rollback creates new version with same content, metadata integrity
- Integration: create → edit → history → compare → rollback → view current; permissions enforced
- E2E: super_admin can manage; admin/user blocked; side nav link visible only for super_admin
- Performance: pagination works; search/filter returns expected results
- Security: no leakage of content to non-admins; audit logs recorded for all mutating ops

18.8 Acceptance Criteria
- All prompts used by the system are listed and editable by super_admin
- Current version propagates to edge function callers on next fetch (or after TTL)
- Full version history visible; one-click rollback with confirmation; audit logged
- RLS strictly enforces: super_admin full read/write; service_role read-only; no admin/user access
- Tests pass per the Phase Gating rule (see Section 20)

18.9 Final Status
- STATUS: COMPLETE ✅ — All checklist items are finished and validated (DB schema, RLS, UI, seeding, edge function, and tests). Future changes should follow governance in Section 19.

---

## 19) Governance – Single Source of Truth Mandate (Authoritative)
THIS DOCUMENT IS THE SINGLE SOURCE OF TRUTH FOR ALL DEVELOPMENT WORK

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

CRITICAL IMPLEMENTATION RULES FOR AI AGENTS
Mandatory Reuse Directives
1. ONLY CREATE FROM SCRATCH IF file does not exist in codebase – always search first
2. PRESERVE ALL FUNCTIONALITY – every feature from archived files must be included
3. SINGLE SOURCE OF TRUTH ENFORCEMENT – never create alternative implementations
4. MANDATORY CONSOLIDATION – consolidate multiple versions into one authoritative file
5. PRESERVE EXISTING FEATURES – never remove without explicit permission
6. NO SHORTCUTS OR CORNER CUTTING – implement full functionality as specified
7. NO PLAN MODIFICATIONS – never adjust requirements without explicit user approval
8. FULL STACK BEST PRACTICES – follow industry standards across technologies
9. PRODUCTION-READY CODE ONLY – no temporary or quick fixes
10. MANDATORY CURSOR INTEGRATION – use full Cursor capabilities and MCP servers
11. PLAN CONSULTATION REQUIRED – review this plan before any development work
12. CODEBASE CONTEXT UTILIZATION – leverage intelligent code understanding

SINGLE SOURCE OF TRUTH MANDATE – Absolute Rules
- ONE SOURCE OF TRUTH PER FUNCTIONALITY: never duplicate or simplify
- MANDATORY FILE IDENTIFICATION: always find and reuse the best existing file
- CONSOLIDATION OVER CREATION: merge variants; mark the consolidated file as authoritative
- ENHANCEMENT OVER REPLACEMENT: extend without breaking existing features
- NO PLAN MODIFICATIONS WITHOUT USER APPROVAL
- FULL STACK BEST PRACTICES MANDATORY
- MANDATORY LOVABLE INTEGRATION: leverage Lovable capabilities and project context
- MANDATORY PLAN REVIEW FOR ALL AI AGENTS

FORBIDDEN ACTIONS (Never Do)
- No simplified/basic/lite/alt/temp versions; no mock data in production
- No duplicate functionality; no removal of features without permission
- No skipping tests, error handling, validation, or security
- No console.log in production logging; no hardcoded configurable values
- No any types; maintain strict TypeScript typing
- No placeholder implementations or quick fixes

---

## 20) Phase Gating – Tests Required Before Progression (New)
Rule: Each phase must be tested and pass all tests prior to moving to the next phase.
- Phase Definition: A phase is any major section in this plan (e.g., Sections 2–6 Provider & Persistence, 7 Frontend Rendering, 11 Observability, 18 Prompt Management).
- Gate Criteria for each phase:
  1) Unit tests implemented and passing
  2) Integration tests implemented and passing
  3) Security/RLS checks validated where applicable
  4) TypeScript type checks with zero errors (no any)
  5) Documentation updated (this plan and related docs)
- CI Enforcement: Pipelines block merges when a phase’s tests fail
- Exception Process: Only with explicit super_admin approval recorded in admin_audit_log

---

## 21) Admin Navigation & SEO (Prompt Page)
- Side Nav: Add “Prompts” under Admin > Configuration; highlight on active route; keep group open
- SEO/Accessibility for /admin/prompts:
  - Title: “AI Prompts – Superadmin Control | Admin” (<60 chars)
  - Meta Description: “Edit, version, and roll back all AI prompts from a single superadmin page.”
  - Single H1: “AI Prompts (Single Source of Truth)”
  - Semantic layout: <main><section>…</section></main>
  - Canonical tag for /admin/prompts
  - Responsive design, keyboard accessible dialogs, proper aria labels

---

## 22) Additional Tests & Acceptance (Global)
- All new data structures for prompts have RLS enabled and validated by tests
- Edge functions read prompts via the single source of truth; integration tests stub versions
- UI E2E covers edit→version bump→history compare→rollback flow and permission guards
- Observability includes prompt edit/rollback events in dashboards

---

## 23) Summary
- Added Superadmin Prompt Management as single source of truth with versioning and rollback
- Codified governance rules (single source of truth mandate and workflow enforcement)
- Introduced Phase Gating rule: no progression without all tests passing
- Acceptance and test plans updated accordingly
