# Competitor Analysis Detail Page — Full‑Stack Implementation Plan (2025‑08‑08)

Status: Planning document for closing gaps across UI → Edge Functions → Database so every tab renders complete, cited, confidence‑scored data per analysis.

Progress Tracker
- Phase 1 (Contract + Edge): Completed ✅
- Phase 2 (UI Wiring): Completed ✅ — All tabs wired; per-field citations/confidence implemented
- Phase 3 (QA & Tests): In Progress — Added service + UI tests; expanding coverage
- Phase 4 (Perf/UX Polish): Pending
- Current Completion: 75%

Goals
- Ensure each tab (Overview, Competitors, Analytics, Comprehensive, AI Insights, Reports) fully renders data without empty placeholders.
- Gather from multiple AI providers using the user's toggled API keys only; never use global keys.
- Standardize the payload, persist to Supabase with source citations and confidence scores, and surface in UI consistently.
- Maintain strict RLS and per‑user data isolation; log costs and provider usage.

Mermaid: End‑to‑End Data Flow
<lov-mermaid>
sequenceDiagram
  autonumber
  participant UI as Detail Tabs (React)
  participant Hook as useAnalysisReport
  participant Svc as competitorAnalysisService
  participant Edge as supabase/functions/competitor-analysis
  participant Prov as AI Providers (OpenAI, Anthropic, Perplexity, etc.)
  participant DB as Supabase DB (competitor_analyses, api_usage_costs, progress)

  UI->>Hook: mount(detail/:id) → fetchAnalysis()
  Hook->>DB: SELECT competitor_analyses by id (maybeSingle)
  DB-->>Hook: row (analysis + analysis_data)
  Hook-->>UI: normalized analysis (fallbacks)
  UI->>Edge: refreshAnalysis(action:"start", competitors[], sessionId, analysisId)
  Edge->>DB: update_competitor_analysis_progress(...in_progress)
  Edge->>Prov: fan‑out requests (only user's enabled providers)
  Prov-->>Edge: JSON results (+ optional citations)
  Edge->>DB: INSERT competitor_analyses (normalized payload + costs + citations + confidence)
  Edge->>DB: INSERT api_usage_costs breakdown per provider
  Edge->>DB: update_competitor_analysis_progress(...completed)
  UI->>Hook: fetchAnalysis() (refresh)
  Hook->>DB: SELECT updated row
  DB-->>Hook: updated analysis row
  Hook-->>UI: render tabs with citations + confidence
</lov-mermaid>

A. Current Gaps (from audit and code review)
- UI: Some tabs show placeholders when analysis_data lacks fields (Overview summary text, AI Insights, parts of Comprehensive/Analytics).
- Data shape: edge function persists minimal analysis_data; no standardized confidence_scores or source_citations arrays.
- Citations: SourceCitations component expects citations[] and confidenceScores; not consistently populated.
- Consistency: Inter‑provider agreement not computed; confidence scores mostly absent.

B. Data Contract (Normalized Payload v2)
Persist the following on competitor_analyses rows (JSONB fields are additive and safe):
- analysis_data: normalized content for all tabs
  - company: { name, website_url, industry, description, employee_count, founded_year, headquarters, business_model }
  - swot: { strengths[], weaknesses[], opportunities[], threats[] }
  - market: { market_position, market_share_estimate, market_trends[], target_market[], customer_segments[], geographic_presence[] }
  - financials: { revenue_estimate, pricing_strategy, funding_info, financial_metrics }
  - technology: { technology_analysis, patent_count, certification_standards[], innovation_score }
  - social: { social_media_presence, key_personnel, environmental_social_governance }
  - cost_breakdown: [{ provider, cost_usd }]
  - providers_used: ["openai","anthropic",...]
  - raw_provider_summaries: optional provider‑level short JSON snapshots for debugging
- source_citations: Array<SourceCitation>
  - { field: string, source: string, url?: string, confidence: number, provider?: string, competitor_name?: string }
- confidence_scores: object
  - primary_result: { [field: string]: number } // 0..1 model‑reported or heuristic
  - overall: { [provider: string]: number } // provider reliability weight used in fusion
  - consistency_score: number // 0..1 inter‑provider agreement
- api_responses (optional): provider raw payloads redacted of secrets (for debugging)

C. Edge Function Work (competitor-analysis)
1) Prompt & Response Shape
- Update prompts for each provider to return strict JSON with all fields required by analysis_data plus:
  - confidence: { fieldName: 0..1 }
  - citations: [{ field, source, url, confidence }]
- For Perplexity, request real web citations; for providers without browsing, return model‑estimated confidence and a generic provider source (no URL).

2) Fusion & Confidence
- Merge provider responses field‑by‑field with a simple fusion:
  - For text lists (strengths, etc.): union + dedupe by similarity; score by provider agreement ratio.
  - For numerics (employee_count, founded_year): choose median; score by variance.
  - Compute consistency_score = avg(per‑field agreement).
- Build confidence_scores.primary_result from fused outputs; keep overall provider weights in confidence_scores.overall.

3) Persistence
- INSERT competitor_analyses row with: name, status='completed', session_id, analysis_id, analysis_data, source_citations, confidence_scores.
- INSERT api_usage_costs for each provider call (already present) and include analysis_id and model metadata.
- Preserve RLS (table already protected); no global keys used.

4) Progress/Errors
- Keep update_competitor_analysis_progress calls; include metadata: { analysis_ids, completedAt, providers_used }.

D. Database Enhancements (Optional but Recommended)
- If competitor_analyses lacks columns, add JSONB with defaults:
  - source_citations JSONB DEFAULT '[]'::jsonb
  - confidence_scores JSONB DEFAULT '{}'::jsonb
- Indexing: consider GIN indexes for querying by provider or fields later (phase 2+ performance tuning).
- NO timestamps manually set (triggers handle updated_at).
- Strict RLS remains by user_id (already in place).

E. Frontend Implementation (Tabs)
1) useAnalysisReport hook
- Keep normalization fallback from analysis_data → top‑level.
- Add memoized selectors for: citations (source_citations) and confidence (confidence_scores), costs (analysis_data.cost_breakdown).
- Handle maybeSingle() no‑row gracefully.

2) Overview Tab
- Executive summary from description or analysis_data.description.
- Stats: market_position, data_quality_score, founded_year, employee_count.
- Include SourceCitations inline badge showing total citations and overall consistency.

3) Competitors Tab
- Render derivedCompetitors from analysis_data.results or fallback single item.
- Each CompetitorCard shows confidence badge and a citations popover for key fields.

4) Analytics Tab
- Use AnalyticsCharts with confidence overlays (tooltip showing confidence per series).
- Show costs summary (total_api_cost or sum(cost_breakdown)).

5) Comprehensive Tab
- Grid of sections (Company, SWOT, Market, Financials, Technology, Social).
- Each cell shows value, confidence chip, and a "View sources" hover link (uses SourceCitations filtered by field).

6) AI Insights Tab
- List of insights with impact and confidence; show sources per insight if present (map from source_citations by field="insight:<slug>").

7) Reports Tab
- ReportSection integrates SourceCitations at the bottom; export dialog includes citations and confidence in JSON/CSV; PDF appendix summarizing sources.

F. Testing Plan
- Unit
  - Edge function fusion: numeric median, list dedupe, confidence calculations.
  - Hook normalization and selectors.
- Integration
  - Start analysis → progress updates → DB rows → UI displays data without placeholders.
  - Export includes citations and confidence.
- Types
  - Use shared types from src/types/competitor-analysis.ts across UI and tests.
  - Follow project rule: test files import PostgrestResponse; services use PostgrestResponseSuccess as applicable.

G. Analytics, Costing, and Observability
- Continue logging api_usage_costs per provider with analysis_id.
- Add performance logs for fusion steps (optional).
- UI DataQualityIndicators shows confidence and source counts.

H. Rollout Phases & Acceptance Criteria
Phase 1: Contract + Edge
- Implement provider prompts, fusion, and persistence of analysis_data + source_citations + confidence_scores.
- AC: DB rows always include citations[] (can be non‑URL for non‑browsing models) and confidence_scores.primary_result.

Phase 2: UI Wiring
- Hook selectors; update all tabs to consume citations/confidence; remove empty placeholders.
- AC: No empty blocks; each displayed value shows either a confidence chip or "insufficient data" badge.

Phase 3: QA & Tests
- Add unit/integration tests; verify RLS and per‑user isolation.
- AC: All tests pass; no TypeScript errors.

Phase 4: Perf/UX Polish
- Optional indexes; skeletons; lazy load charts; tooltips for sources.
- AC: Lighthouse good; interaction smooth.

Open Questions / Decisions
- Do we also persist a flattened analysis_citations table for advanced querying? (Recommend deferring until needed.)
- Provider weighting scheme configurable per user/org? (Future.)

Owner & Next Steps
- Edge: Update supabase/functions/competitor-analysis (prompts + fusion + persistence fields)
- UI: Hook + tabs to consume confidence & citations
- Docs: Keep this plan updated; cross‑reference db mapping doc

---

## SINGLE SOURCE OF TRUTH MANDATE (Binding Rules for All AI Agents)

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

### CRITICAL IMPLEMENTATION RULES FOR AI AGENTS
#### 🔥 MANDATORY REUSE DIRECTIVES
1. ONLY CREATE FROM SCRATCH IF file does not exist in codebase
2. PRESERVE ALL FUNCTIONALITY — Every feature in the existing files MUST remain
3. SINGLE SOURCE OF TRUTH ENFORCEMENT — Never create alternative implementations
4. MANDATORY CONSOLIDATION — Consolidate multiple versions into one authoritative file
5. PRESERVE EXISTING FEATURES — Do not simplify or remove functionality
6. NO SHORTCUTS — Implement full functionality exactly as specified
7. NO PLAN MODIFICATIONS — Do not change requirements without explicit user approval
8. FULL STACK BEST PRACTICES — Follow industry standards for all technologies
9. PRODUCTION-READY CODE ONLY — No temporary implementations or quick fixes
10. MANDATORY CURSOR INTEGRATION — Use full Cursor capabilities and MCP servers
11. PLAN CONSULTATION REQUIRED — Review this plan before any development work
12. CODEBASE CONTEXT UTILIZATION — Leverage the project's code understanding

## 🚨 ABSOLUTE RULES FOR AI CODING AGENTS — NEVER VIOLATE
RULE #1: ONE SOURCE OF TRUTH PER FUNCTIONALITY
- NEVER create simplified, duplicate, or alternative versions of existing functionality
- ALWAYS work on the designated source file for each functionality
- NEVER create files with stub or incomplete code
- ALWAYS enhance/extend the master file

RULE #2: MANDATORY FILE IDENTIFICATION
- BEFORE creating any new file, search for existing functionality first
- ALWAYS use the most complete version as the base
- NEVER start from scratch if functionality exists

RULE #3: CONSOLIDATION OVER CREATION
- WHEN multiple versions exist, consolidate into the best version
- MARK the consolidated version as SINGLE SOURCE OF TRUTH in comments
- UPDATE all imports to the single source file

RULE #4: ENHANCEMENT OVER REPLACEMENT
- ALWAYS enhance existing functionality rather than replacing it
- ADD new features without removing existing ones

RULE #5: NO PLAN MODIFICATIONS WITHOUT USER APPROVAL
- NEVER adjust scope or functionality without explicit permission

RULE #6: FULL STACK BEST PRACTICES MANDATORY
- ALWAYS include robust error handling, validation, tests, and docs

RULE #7: MANDATORY LOVABLE INTEGRATION
- ALWAYS use Lovable's capabilities and project context for changes

RULE #8: MANDATORY PLAN REVIEW FOR ALL AI AGENTS
- ALL development must reference and follow this plan

#### 🚫 FORBIDDEN ACTIONS
- Do NOT create simplified/basic/alternative/lite versions of components/services
- Do NOT use mock data in production components
- Do NOT duplicate functionality across files
- Do NOT remove features without explicit permission
- Do NOT skip testing, docs, validation, or security
- Do NOT hardcode values that should be configurable
- Do NOT use any TypeScript 'any' types

---

ACKNOWLEDGMENT
By proceeding, agents assert they have read, understood, and will strictly adhere to this plan.
