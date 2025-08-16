# Competitor Analysis Frontend Components Audit (2025-08-12)

Single Source of Truth: src/components/competitor-analysis/*
Scope: Exhaustive inventory of components under competitor-analysis, categorized, with completion estimates, similar/duplicate counterparts, and audit notes.

Legend for % Complete (subjective estimate)
- 90–100% = Production-ready
- 70–89% = Feature-complete with minor gaps/UX polish
- 40–69% = Partial, core present but missing features/tests
- 0–39% = Stub/WIP

## Core Views and Containers
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| AnalysisDetailView.tsx | Wrapper to Enhanced detail view | 90% | enhanced/EnhancedAnalysisDetailView.tsx | 95% | Thin wrapper; keep SEO on page level.
| enhanced/EnhancedAnalysisDetailView.tsx | Full analysis detail hub UI | 95% | – | – | Rich, integrated with charts, AI, report hook.
| report/AnalysisReportContainer.tsx | Report shell + section routing | 85% | – | – | Solid; relies on useAnalysisReport.
| report/AnalysisReportHeader.tsx | Report toolbar (export, actions) | 90% | AdvancedExportDialog.tsx | 90% | Well-integrated with export dialog.
| report/AnalysisReportNavigation.tsx | Report section navigation | 85% | – | – | Works; UX polish possible.

## Input and Setup
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| CompetitorAnalysisForm.tsx | Start analysis form | 80% | modern/ModernCompetitorInput.tsx | 85% | Modern version is more animated.
| ApiKeySetupBanner.tsx | CTA to set up keys | 85% | modern/ModernApiKeyAlert.tsx | 85% | Similar function; consider unifying.
| ApiKeyWarning.tsx | Warns when keys missing | 85% | – | – | Uses Supabase client; UX ok.
| modern/ModernCompetitorInput.tsx | Animated competitor input | 85% | CompetitorAnalysisForm.tsx | 80% | Duplicated responsibility.
| modern/ModernApiKeyAlert.tsx | Animated API key alert | 85% | ApiKeySetupBanner.tsx | 85% | Duplicate responsibility.

## Progress and Status
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| AnalysisProgress.tsx | Progress display | 85% | modern/ModernAnalysisProgress.tsx | 85% | Similar visuals; unify variants.
| modern/ModernAnalysisProgress.tsx | Animated progress | 85% | AnalysisProgress.tsx | 85% | Duplicate responsibility.
| ProviderHealthBadge.tsx | Provider gate health | 80% | – | – | Depends on useCompetitorGate (external hook).
| DebugPanel.tsx | Diagnostics panel | 70% | – | – | Useful dev tool; hidden in prod.

## Results and Lists
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| ResultsDisplay.tsx | Legacy/basic results grid | 80% | modern/ModernResultsDisplay.tsx | 85% | Prefer modern; deprecate legacy.
| modern/ModernResultsDisplay.tsx | Animated results grid | 85% | ResultsDisplay.tsx | 80% | Candidate for single source.
| enhanced/CompetitorListView.tsx | Filterable competitor list | 90% | – | – | Feature-rich; animations.
| SavedAnalysesList.tsx | Legacy saved list | 90% | modern/ModernSavedAnalysesList.tsx | 85% | Prefer modern visuals.
| modern/ModernSavedAnalysesList.tsx | Animated saved list | 85% | SavedAnalysesList.tsx | 90% | Keep one list component with variants.

## Dialogs and Actions
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| dialogs/DeleteAnalysisDialog.tsx | Confirm deletion | 90% | – | – | Good UX; shows metadata.
| AdvancedExportDialog.tsx | Rich export (PDF/CSV/JSON) | 90% | ExportAnalysisDialog.tsx | 85% | Consider consolidating to one export dialog.
| ExportAnalysisDialog.tsx | Simpler export dialog | 85% | AdvancedExportDialog.tsx | 90% | Overlap; choose one.
| SaveAnalysisDialog.tsx | Save current analysis | 85% | – | – | Functional; verify RLS paths.
| ComprehensiveAnalysisButton.tsx | Action to run full analysis | 85% | – | – | Has tests; good.

## Enhanced Views (Deep Dives)
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| enhanced/ComprehensiveAnalysisView.tsx | Tabbed deep-dive view | 90% | – | – | Extensive; many sections.
| enhanced/MarketPositionPerformanceView.tsx | Market position focus | 85% | – | – | Solid, uses fallbacks.
| enhanced/TechnologyInnovationView.tsx | Tech stack focus | 85% | – | – | Leverages multiple fields.
| enhanced/CustomerJourneyView.tsx | Customer journey focus | 85% | – | – | Interactive; states.
| enhanced/CompetitorInsightsHub.tsx | Insights hub tabs | 80% | – | – | Good base; polish possible.

## Visualization and Cards
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| visualization/CompetitorCard.tsx | Visual card (enhanced) | 85% | CompetitorCard.tsx | 80% | Duplicate name; unify API.
| CompetitorCard.tsx | Legacy/basic card | 80% | visualization/CompetitorCard.tsx | 85% | Mark legacy.
| visualization/AnalyticsCharts.tsx | Recharts overview visuals | 60% | – | – | Colors hardcoded; improve DS tokens.
| visualization/CostBreakdownChart.tsx | Cost pie chart | 90% | – | – | Good; filters invalid data.
| visualization/ArrayBadgeList.tsx | Generic badge list | 95% | – | – | Reusable.
| visualization/JsonKeyValueCard.tsx | KV display card | 90% | – | – | Good empty-state handling.
| visualization/AllDataExplorer.tsx | Debug/full-data explorer | 85% | – | – | Helpful for audits.
| visualization/ReportSection.tsx | Placeholder report section | 60% | Report sections | 85–90% | Keep only if needed.

## Report: Sections, UI, Types, Hooks
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| report/sections/ExecutiveSummarySection.tsx | Summary KPIs | 90% | – | – | Solid.
| report/sections/MarketAnalysisSection.tsx | Market metrics | 85% | – | – | Good.
| report/sections/CompetitiveAnalysisSection.tsx | Competitors view | 85% | – | – | Good.
| report/sections/FinancialAnalysisSection.tsx | Financials | 80% | – | – | Solid baseline.
| report/sections/PersonnelAnalysisSection.tsx | Team/Hiring | 80% | – | – | Solid baseline.
| report/sections/TechnologyAnalysisSection.tsx | Tech/Products | 85% | – | – | Interactive filters.
| report/ui/MetricCard.tsx | Metric card | 95% | – | – | Reusable.
| report/ui/InsightCard.tsx | Insight card | 90% | – | – | Reusable.
| report/ui/ScoreVisualization.tsx | Score bars | 90% | – | – | Reusable.
| report/ui/LoadingStates.tsx | Skeletons & errors | 90% | – | – | Good UX.
| report/utils/analysisSelectors.ts | Safe selectors | 95% | – | – | Great normalization helpers.
| report/types/reportTypes.ts | Type bridge | 95% | – | – | Aligned with unified types.
| report/hooks/useAnalysisReport.tsx | Fetch/normalize hook | 90% | – | – | Tested; robust backfills.

## AI Tools
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| ai/AiAssistant.tsx | On-page AI assistant (local) | 70% | – | – | Local-only insights; no provider calls.
| ai/AiDrillDownInsights.tsx | RPC-based drilldowns | 75% | – | – | Uses Supabase functions; good base.

## Sources & Verification
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| SourceCitations.tsx | Show citations & confidence | 90% | – | – | Strong UX; test exists.
| SourceVerificationBanner.tsx | Verification summary | 90% | – | – | Clean and informative.

## Market Sentiment
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| market-sentiment/MarketSentimentAnalyzer.tsx | Sentiment module (stub) | 20% | – | – | Marked "implementation pending".

## Miscellaneous / Utilities
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| AnalysisHeader.tsx | Marketing header | 85% | modern/ModernAnalysisHeader.tsx | 85% | Duplicate responsibility.
| modern/ModernAnalysisHeader.tsx | Animated header | 85% | AnalysisHeader.tsx | 85% | Unify as variants.
| AnalysisComparison.tsx | Compare analyses | 80% | – | – | Works; refine metrics.
| BulkAnalysisManager.tsx | Bulk run manager | 75% | – | – | Good base; ensure rate limiting.
| EditableTitle.tsx | Inline title editing | 90% | – | – | Reusable.
| CompetitorAnalysisResults.tsx | Combined results/exports | 85% | – | – | Integrates AdvancedExportDialog.

## Tests in this folder
| File | Purpose | % Complete | Similar/Duplicate | Similar % | Notes |
|---|---|---:|---|---:|---|
| __tests__/ComprehensiveAnalysisButton.test.tsx | Action button tests | 90% | – | – | Good coverage for states.
| __tests__/DebugPanel.test.tsx | Debug panel smoke | 80% | – | – | Basic presence tests.
| __tests__/SourceCitations.test.tsx | Citations badge | 85% | – | – | Covers key rendering.

---

## Findings and Recommendations

- Duplicate/Overlapping Components
  - Pairs: ResultsDisplay ↔ ModernResultsDisplay, AnalysisHeader ↔ ModernAnalysisHeader, AnalysisProgress ↔ ModernAnalysisProgress, SavedAnalysesList ↔ ModernSavedAnalysesList, CompetitorCard (top-level) ↔ visualization/CompetitorCard, AdvancedExportDialog ↔ ExportAnalysisDialog, ApiKeySetupBanner ↔ ModernApiKeyAlert, CompetitorAnalysisForm ↔ ModernCompetitorInput.
  - Action: Consolidate each pair into a single component with visual variants ("legacy"/"modern") to enforce Single Source of Truth.

- Incomplete Modules
  - MarketSentimentAnalyzer.tsx (~20%): Marked pending; define data source and integrate with report/useAnalysisReport or separate provider.
  - visualization/AnalyticsCharts.tsx (~60%): Replace hard-coded colors with design tokens; wire to real metrics.
  - visualization/ReportSection.tsx (~60%): Likely superseded by report/sections/*; consider removal or merge.

- Quality/UX
  - Prefer modern components for lists/results, but keep one implementation with variants.
  - Ensure all visualization components use semantic design tokens (no hard-coded hex).

- Testing
  - Good coverage on key items; add tests for modern components parity after consolidation and for MarketSentiment once implemented.

- Types & Data
  - Report selectors/utilities are strong; continue routing all UI through normalized data from useAnalysisReport to avoid field drift.

---

Audit generated on 2025-08-12. If you want, I can follow up by proposing a minimal consolidation plan (variants + deprecation of legacy duplicates) to uphold the Single Source of Truth mandate.

## 2025-08-13 Update — Server Crash Fix
- Resolved infinite recursion in RLS on public.team_members by:
  - Adding SECURITY DEFINER helper: public.is_member_of_team(team_id uuid, user_id uuid)
  - Replacing recursive SELECT policy with function-based condition and admin override
- Behavior preserved: self visibility, same-team visibility, admin access; RLS remains enabled.

Next steps (Competitor Analysis audit):
- [ ] Verify analyze-competitor uses toggled-on user/org API keys consistently
- [ ] Confirm progress updates and polling via update_competitor_analysis_progress
- [ ] Add PostgrestResponse-typed tests for competitor services (no any)
- [ ] Ensure .maybeSingle() for optional single-row reads
- [ ] Validate logging to ai_prompt_logs and api_usage_costs

## Implementation Plan Execution (Updated 2025-08-13)

Stage 0 — Pre-work
- Status: Complete
- Item: Server crash fix (RLS recursion) — see section above

Stage 1 — Results & Lists
- Status: In Progress
- Today’s progress:
  - [x] Finalized consolidation strategy with variant={"legacy"|"modern"}
  - [x] Identified canonical components: modern/ModernResultsDisplay, modern/ModernSavedAnalysesList, visualization/CompetitorCard
  - [x] Added variant smoke tests for SavedAnalysesList (default vs modern)
  - [ ] Create re-export shims for legacy: ResultsDisplay, SavedAnalysesList, top-level CompetitorCard
  - [ ] Capture baseline snapshots for both variants
  - [ ] Add parity tests (sorting/filtering interactions, a11y)
- Definition of Done:
  - [ ] Single import path per component family
  - [ ] Visual parity validated across light/dark and mobile/desktop
  - [ ] No behavior regressions in filters/sorting/selection

Stage 2 — Input, Progress, Headers
- Status: Not Started

Stage 3 — Export Dialogs
- Status: Not Started

Stage 4 — Visualization Tokens & A11y
- Status: Not Started

Stage 5 — Types & Services Hardening
- Status: Not Started


## Minimal Consolidation Plan (Approved 2025-08-13)
Goal: Enforce Single Source of Truth via variants, preserve all functionality and routes, and improve DX/UX.

Stage 1 — Results & Lists
- Consolidate: ResultsDisplay ↔ ModernResultsDisplay, SavedAnalysesList ↔ ModernSavedAnalysesList, CompetitorCard (legacy) ↔ visualization/CompetitorCard
- Deliverables: One component per pair with variant={"legacy"|"modern"} and design tokens; deprecate legacy files via re-export shim until imports are updated
- Success: All imports compile, visual parity verified, no behavior regressions
- Tests: Snapshot parity per variant, interaction tests for filtering/sorting

Stage 2 — Input, Progress, Headers
- Consolidate: CompetitorAnalysisForm ↔ ModernCompetitorInput, AnalysisProgress ↔ ModernAnalysisProgress, AnalysisHeader ↔ ModernAnalysisHeader, ApiKeySetupBanner ↔ ModernApiKeyAlert
- Ensure missing-key UX uses ProviderHealthBadge and consistent toasts
- Tests: Form validation, progress polling, missing-key paths

Stage 3 — Export Dialogs
- Canonicalize AdvancedExportDialog with a “simple” mode replacing ExportAnalysisDialog
- Tests: Export formats (PDF/CSV/JSON), large dataset, error fallback

Stage 4 — Visualization Tokens & A11y
- Replace hard-coded colors with design tokens; validate dark mode and contrast
- Tests: Axe checks on key views; responsive snapshots

Stage 5 — Types & Services Hardening
- No any; service methods use supabase-js types; in tests import PostgrestResponse (not PostgrestResponseSuccess)
- Prefer .maybeSingle() for optional single rows; guard null states in UI
- Verify cost controls via check_user_cost_allowed before long runs

Risks & Mitigations
- Refactor risk: use re-export shims and incremental import updates
- Visual drift: snapshot parity per variant, manual QA checklist
- RLS assumptions: run smoke tests under user/admin/service-role contexts

