# Competitor Analysis Components – Implementation Plan

Date: 2025-08-12
Owner: Frontend
Source: src/docs/audits/COMPETITOR_ANALYSIS_COMPONENTS_AUDIT_2025-08-12.md (read end-to-end)

Goals
- Enforce Single Source of Truth across competitor-analysis components
- Consolidate duplicate legacy/modern variants into one component with variants
- Remove hardcoded colors; use design system semantic tokens
- Implement pending Market Sentiment module
- Preserve functionality and routes; no regressions
- Strengthen tests and documentation

## Stage 1: Consolidate Duplicate Components (Variants)
**Goal**: Merge overlapping components into a single component per responsibility with visual variants.
**Success Criteria**: One export per responsibility; all imports updated; tests passing.
**Tests**: Unit parity tests, integration renders, affected E2E flows.
**Status**: In Progress

Mapping (→ target as source of truth):
- ResultsDisplay + modern/ModernResultsDisplay → ResultsDisplay (variant: "modern")
- AnalysisHeader + modern/ModernAnalysisHeader → AnalysisHeader (variant: "modern")
- AnalysisProgress + modern/ModernAnalysisProgress → AnalysisProgress (variant: "modern")
- SavedAnalysesList + modern/ModernSavedAnalysesList → SavedAnalysesList (variant: "modern")
- CompetitorCard (top-level) + visualization/CompetitorCard → visualization/CompetitorCard (rename imports)
- AdvancedExportDialog + ExportAnalysisDialog → AdvancedExportDialog (ExportAnalysisDialog removed)
- ApiKeySetupBanner + modern/ModernApiKeyAlert → ApiKeyAlert (new unified component)
- CompetitorAnalysisForm + modern/ModernCompetitorInput → CompetitorAnalysisForm (variant: "modern")

Checklist
- [x] Create variants in target components (prop: variant: 'default' | 'modern') [ResultsDisplay, SavedAnalysesList]
- [ ] Migrate styles/animations from modern components into variant paths
- [ ] Replace imports project-wide to point to the target component
- [x] Add deprecation headers to legacy files and remove once imports updated (Export dialog pair)
- [ ] Update Storybook/docs if present (optional)
- [x] Ensure no routing or functionality changes (wrapper delegation)
- [x] Add "SINGLE SOURCE OF TRUTH" comment to consolidated targets (Export dialog, ResultsDisplay, SavedAnalysesList)

Progress
- Consolidated: AdvancedExportDialog + ExportAnalysisDialog → AdvancedExportDialog (wrapper)
- Variants added: ResultsDisplay (delegates to ModernResultsDisplay), SavedAnalysesList (delegates to ModernSavedAnalysesList)
- Pending: Headers, Progress, CompetitorCard, API Key alert, Form

## Stage 2: Design System Compliance (Colors, Tokens)
**Goal**: Replace hardcoded colors in visualizations with semantic tokens.
**Success Criteria**: No hex colors in competitor-analysis visuals; theming consistent in light/dark.
**Tests**: Visual regression (manual), snapshot testing on charts components.
**Status**: In Progress

Files
- visualization/AnalyticsCharts.tsx
- visualization/CostBreakdownChart.tsx (verify; already good but replace hex palette)

Checklist
- [x] Define chart color palette using CSS variables (index.css) and Tailwind tokens
- [x] Replace hex arrays with token-based classes or compute colors via tokens
- [x] Ensure adequate contrast and dark mode support
- [x] Add props to inject custom palette if needed
- [x] Add unit tests to validate color assignment logic (no hex literals)

## Stage 3: Implement Market Sentiment Analyzer
**Goal**: Replace stub with functional component using available data.
**Success Criteria**: Displays computed sentiment from analysis_data or derived metrics; tested.
**Tests**: Unit tests for computation; render test in detail view.
**Status**: In Progress

Approach
- Create hook useMarketSentiment(analysis): computes sentiment from fields such as social_engagement, growth signals, confidence_scores
- Fallback to analysis.analysis_data.results[0] fields if present
- Expose currentScore and trend; allow onSentimentUpdate callback

Checklist
- [x] Create hooks/analysis: report/hooks/useMarketSentiment.ts
- [x] Implement MarketSentimentAnalyzer to consume hook
- [x] Add to EnhancedAnalysisDetailView (conditional render when data)
- [x] Unit tests for hook and component

## Stage 4: ReportSection Cleanup
**Goal**: Remove or integrate placeholder component superseded by report/sections/*.
**Success Criteria**: No dead/duplicate report entry points.
**Tests**: Build and report pages render.
**Status**: Not Started

Checklist
- [x] Audit visualization/ReportSection.tsx usage
- [ ] If unused, remove file and references
- [ ] If used, re-route to report/sections equivalents

## Stage 5: Tests and QA
**Goal**: Maintain and extend coverage for consolidated components.
**Success Criteria**: All existing tests pass; new parity tests added; E2E green.
**Tests**: Unit, Integration, E2E (Playwright)
**Status**: Not Started

Checklist
- [ ] Update unit tests to import unified components
- [ ] Add parity tests: legacy vs modern variant produce expected elements
- [ ] Update report/useAnalysisReport normalization tests if component APIs changed (should not)
- [ ] Run E2E: competitor analysis workflow, API keys mgmt
- [ ] Add tests for Market Sentiment

## Stage 6: Documentation & Deprecations
**Goal**: Document changes and ensure devs use unified components.
**Success Criteria**: Docs updated; deprecation notes added.
**Status**: Not Started

Checklist
- [ ] Add file headers "SINGLE SOURCE OF TRUTH" in target components
- [ ] Update WHERE_TO_FIND_ENHANCED_FEATURES.md with consolidated components
- [ ] Create/Update component README in competitor-analysis folder

## Stage 7: Accessibility & SEO Review
**Goal**: Ensure semantic structure and metadata remain correct.
**Success Criteria**: One H1 per page, Helmet tags intact, alt attributes present.
**Status**: Not Started

Checklist
- [ ] Verify AnalysisDetailPage Helmet tags and canonical
- [ ] Ensure images/icons have descriptive alt/aria-labels where needed
- [ ] Confirm keyboard focus order not impacted by variant changes

## Stage 8: Security & RLS Considerations
**Goal**: No exposure of sensitive data; API usage remains per-user keys.
**Success Criteria**: No client-side key handling changes; edge invocations unchanged.
**Status**: Not Started

Checklist
- [ ] Confirm export dialogs do not include secrets
- [ ] Verify supabase functions invocations are unchanged (per-user)
- [ ] No changes to DB or RLS required in this plan

## Stage 9: Routing & Integration Verification
**Goal**: Maintain existing routes and navigation.
**Success Criteria**: All routes continue to work; imports updated without breakage.
**Status**: Not Started

Checklist
- [ ] Verify /market-research/competitor-analysis and detail routes
- [ ] Validate Saved Analyses page integrations
- [ ] Smoke test navigation/actions (delete, export, new analysis)

---

## Risks & Mitigations
- Risk: Visual regressions after merge
  - Mitigation: Introduce variant stories/tests; incremental merges
- Risk: Import churn causing build failures
  - Mitigation: Use codemods/find-replace; run typecheck CI locally
- Risk: Chart theming issues in dark mode
  - Mitigation: Test both themes; token-based colors

## Rollout Plan
- Branch: feature/competitor-components-consolidation
- PRs per Stage (1 → 3 small PRs), then 2, 3, 4–9 combined where tiny
- QA sign-off after each PR; keep incremental and reversible

## Definition of Done
- [ ] All duplicate components consolidated with variants
- [ ] No hardcoded chart colors; tokens used
- [ ] Market Sentiment implemented with tests
- [ ] Dead components removed or documented
- [ ] All tests (unit/integration/E2E) green
- [ ] Docs updated; deprecation notes added
- [ ] No routing or security regressions
