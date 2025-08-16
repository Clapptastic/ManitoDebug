# Analysis Detail Page → Database Mapping (2025-08-08)

Route: /market-research/competitor-analysis/details/:analysisId
Analysis ID example: e3fbc79d-4e12-42e9-b2c1-9436c1dbd803 (current route)

Purpose
- Document what items are shown on the Enhanced Analysis Detail page and exactly which database fields power each item.
- Capture fallback behavior where the UI normalizes top-level columns with nested analysis_data.

Key Files
- UI: src/components/competitor-analysis/enhanced/EnhancedAnalysisDetailView.tsx
- Hook: src/components/competitor-analysis/report/hooks/useAnalysisReport.tsx
- Charts: src/components/competitor-analysis/visualization/AnalyticsCharts.tsx
- SWOT: src/components/ui/charts/SwotAnalysisChart.tsx

UI Sections Rendered and Data Sources
1) Breadcrumb
- Market Research (static) → navigation only
- Saved Analyses (static) → navigation only
- Current Analysis Title → competitor_analyses.name OR analysis_data.company_name

2) Header
- Status Badge → competitor_analyses.status
- Title → competitor_analyses.name OR analysis_data.company_name
- Description → competitor_analyses.description OR analysis_data.description
- Created/Updated → competitor_analyses.created_at, competitor_analyses.updated_at
- Data Quality Badge → competitor_analyses.data_quality_score

3) Quick Stats
- Market Position → competitor_analyses.market_position
- Data Quality → competitor_analyses.data_quality_score
- Founded Year → competitor_analyses.founded_year OR analysis_data.founded_year
- Employees → competitor_analyses.employee_count OR analysis_data.employee_count

4) Company Information Card
- Website → competitor_analyses.website_url OR analysis_data.website_url
- Headquarters → competitor_analyses.headquarters OR analysis_data.headquarters
- Industry → competitor_analyses.industry OR analysis_data.industry

5) SWOT Analysis
- Strengths → competitor_analyses.strengths OR analysis_data.strengths
- Weaknesses → competitor_analyses.weaknesses OR analysis_data.weaknesses
- Opportunities → competitor_analyses.opportunities OR analysis_data.opportunities
- Threats → competitor_analyses.threats OR analysis_data.threats

6) Competitors Tab (CompetitorListView)
- If analysis_data.results exists: use that array directly (each object should include name, strengths, weaknesses, etc.)
- Else derivedCompetitors fallback builds an array with one item using:
  - name → competitor_analyses.name OR analysis_data.company_name
  - description → competitor_analyses.description OR analysis_data.description
  - website → competitor_analyses.website_url OR analysis_data.website_url
  - strengths/weaknesses/opportunities/threats → same fallback as SWOT
  - employees → competitor_analyses.employee_count OR analysis_data.employee_count
  - founded_year → competitor_analyses.founded_year OR analysis_data.founded_year
  - Optional visuals if available on the object: market_share, competitive_score, funding

7) Analytics Tab (AnalyticsCharts)
- Uses derivedCompetitors
- Market Share Pie → competitors[*].market_share (if present)
- Competitive Strength Bar → competitors[*].competitive_score (0–10)
- Funding Comparison → competitors[*].funding (expects strings like “$50M”, “$1.2B”)

8) Comprehensive Tab
- ComprehensiveAnalysisView analysis prop → competitor_analyses row (plus normalized fields)

9) AI Insights Tab
- AiAssistant analysisData → competitor_analyses.analysis_data
- competitors → derivedCompetitors (as above)

10) Reports Tab
- ReportSection analysis → competitor_analyses row (plus normalized fields)

Normalization Behavior (implemented in useAnalysisReport)
- After fetch, UI backfills top-level fields from analysis_data when top-level is empty:
  - name, description, industry, website_url, employee_count, founded_year, headquarters
  - strengths, weaknesses, opportunities, threats arrays
- This ensures data renders even if only nested analysis_data is populated.

Observed Database vs UI (from recent network response)
- For example analysis: Apple Inc. (id=56df4b0d-8899-40ac-b03b-b0e4065d06e1)
  - Top-level SWOT arrays are [] but analysis_data contains full SWOT and description.
  - With normalization + fallbacks, UI shows Title, Company Info, SWOT, Competitors/Analytics via derivedCompetitors (single-entry fallback if results missing).

Mermaid Mapping (UI → DB fields with fallbacks)
```mermaid
graph LR
  %% Header
  UI_Title[UI: Header Title] --> DB_name[(DB: competitor_analyses.name)]
  UI_Title --> DB_ad_name[(DB: analysis_data.company_name)]

  UI_Status[UI: Status Badge] --> DB_status[(DB: competitor_analyses.status)]
  UI_Desc[UI: Description] --> DB_desc[(DB: competitor_analyses.description)]
  UI_Desc --> DB_ad_desc[(DB: analysis_data.description)]
  UI_Dates[UI: Created/Updated] --> DB_created[(DB: created_at)]
  UI_Dates --> DB_updated[(DB: updated_at)]
  UI_Quality[UI: Data Quality %] --> DB_quality[(DB: data_quality_score)]

  %% Quick Stats
  UI_Pos[UI: Market Position] --> DB_pos[(DB: market_position)]
  UI_Founded[UI: Founded Year] --> DB_founded[(DB: founded_year)]
  UI_Founded --> DB_ad_founded[(DB: analysis_data.founded_year)]
  UI_Employees[UI: Employees] --> DB_emp[(DB: employee_count)]
  UI_Employees --> DB_ad_emp[(DB: analysis_data.employee_count)]

  %% Company Info
  UI_Web[UI: Website] --> DB_web[(DB: website_url)]
  UI_Web --> DB_ad_web[(DB: analysis_data.website_url)]
  UI_HQ[UI: Headquarters] --> DB_hq[(DB: headquarters)]
  UI_HQ --> DB_ad_hq[(DB: analysis_data.headquarters)]
  UI_Industry[UI: Industry] --> DB_ind[(DB: industry)]
  UI_Industry --> DB_ad_ind[(DB: analysis_data.industry)]

  %% SWOT
  UI_S[UI: Strengths] --> DB_s[(DB: strengths[])]
  UI_S --> DB_ad_s[(DB: analysis_data.strengths[])]
  UI_W[UI: Weaknesses] --> DB_w[(DB: weaknesses[])]
  UI_W --> DB_ad_w[(DB: analysis_data.weaknesses[])]
  UI_O[UI: Opportunities] --> DB_o[(DB: opportunities[])]
  UI_O --> DB_ad_o[(DB: analysis_data.opportunities[])]
  UI_T[UI: Threats] --> DB_t[(DB: threats[])]
  UI_T --> DB_ad_t[(DB: analysis_data.threats[])]

  %% Competitors & Analytics
  UI_Comps[UI: Competitors List] --> DB_results[(DB: analysis_data.results[])]
  UI_Comps --> Fallback[(Fallback: derivedCompetitors from top-level + analysis_data)]

  UI_Charts[UI: Analytics Charts] --> DB_ms[(DB: results[].market_share)]
  UI_Charts --> DB_cs[(DB: results[].competitive_score)]
  UI_Charts --> DB_fund[(DB: results[].funding)]
```

Notes & Limitations
- If analysis_data.results is absent, charts relying on market_share/competitive_score/funding may show limited data (fallback creates a single competitor without these optional metrics unless present elsewhere).
- No timestamps are manually set from UI; DB triggers/columns manage created_at/updated_at.
- RLS: All reads are scoped by user_id; ensure authenticated session for visibility.

Verification Checklist
- [x] Title/Description rendered via fallbacks
- [x] Company Info visible when only analysis_data contains values
- [x] SWOT visible when top-level arrays are empty but nested arrays exist
- [x] Competitors and Analytics render using derivedCompetitors when results missing

---

Gaps vs Database (Not surfaced in UI yet)
- competitor_analyses.market_sentiment_score (numeric)
- competitor_analyses.data_quality_breakdown (jsonb)
- competitor_analyses.data_completeness_score (numeric)
- competitor_analyses.data_completeness_breakdown (jsonb)
- competitor_analyses.news_data (jsonb)
- competitor_analyses.financial_data (jsonb)
- competitor_analyses.public_company_data (jsonb)
- competitor_analyses.last_news_refresh (timestamptz)
- competitor_analyses.stock_symbol (text)
- competitor_analyses.exchange (text)
- competitor_analyses.is_public_company (boolean)
- competitor_analyses.ai_drill_down_history (jsonb)
- competitor_analyses.total_api_cost (numeric)
- competitor_analyses.cost_breakdown (jsonb)
- competitor_analyses.actual_cost (numeric)
- competitor_analyses.target_market (text[])
- competitor_analyses.pricing_strategy (jsonb)
- competitor_analyses.funding_info (jsonb)
- competitor_analyses.social_media_presence (jsonb)

Related Tables Not Surfaced on the Analysis Detail Page
- competitor_analysis_progress: realtime progress per session_id
- ai_drill_down_sessions: per-analysis drill-down Q&A history, providers used, tokens, costs
- api_usage_costs: per-user provider usage, endpoint, success, cost_usd (roll up to show total/cost_breakdown)
- user_provider_costs: per-provider limits/costs (used in settings, could inform budget banners)
- company_profiles: user company baseline (not part of per-analysis page)
- business_plans: separate module (not shown in analysis detail)

Implementation Plan (Phased)
Phase 1 – High-Impact Visuals (UI only)
- Add “Data Quality & Completeness” card set
  - Show data_quality_score, data_completeness_score with progress bars
  - Optional details drawer: data_quality_breakdown, data_completeness_breakdown
- Add “Company at a Glance” card
  - stock_symbol, exchange, is_public_company, last_news_refresh
- Add “Costs” card
  - total_api_cost, actual_cost; provider chips from cost_breakdown

Phase 2 – Rich Sections
- Financials section
  - Render financial_data (revenue, margins, growth) with small charts when present
- News & Signals section
  - Render news_data headlines with source and timestamp; badge last_news_refresh
- Public Company Profile
  - Render public_company_data (CEO, sector, market cap) when available

Phase 3 – Interactions & History
- Drill‑Down History panel
  - Render ai_drill_down_history (if embedded) and/or join ai_drill_down_sessions by analysis_id
  - Provide “Ask follow‑up” action using AiAssistant
- Progress (optional if session active)
  - Read competitor_analysis_progress by session_id and show status pill

Phase 4 – Costs & Governance
- Inline usage/cost timeline (aggregated from api_usage_costs by analysis_id)
- Budget banner if user_provider_costs monthly_cost_limit near threshold

Testing & RLS Checks
- Ensure authenticated reads; use .maybeSingle() to avoid throw on no data
- Add unit tests for normalization and fallbacks when only analysis_data is populated
- Verify RLS allows reading progress and drill_down data for the same user

