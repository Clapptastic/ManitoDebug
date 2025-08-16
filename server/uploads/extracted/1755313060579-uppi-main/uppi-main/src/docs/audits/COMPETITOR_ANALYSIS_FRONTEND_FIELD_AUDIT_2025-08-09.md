# Competitor Analysis Frontend vs Data vs API Audit

Date: 2025-08-09
Route audited: /market-research/competitor-analysis/details/:id
Analysis example used: e9cd6f4d-562b-4f07-b049-7c0e87219882 (Microsoft)

Scope and method
- Enumerate every frontend field across tabs/sections of the Analysis Report UI
- For each, report: data binding status (present, path, flow), notes/root-cause if hidden
- Map the corresponding API fields requested per provider and typical return state
- Sources: UI components in src/components/competitor-analysis/report/*, visualization/*; Edge function prompts in supabase/functions/competitor-analysis/index.ts and provider clients

Legend
- Present: data found and rendered
- Hidden: component guards prevent rendering (null/empty/zero)
- Missing: key not present in record
- Flow: field source and any mismatches
- Providers (asks/returns): O=OpenAI, A=Anthropic, G=Gemini, P=Perplexity (asks=prompted for; returns=commonly returned)

## Header (AnalysisReportHeader)
| UI Field (Label — Key) | Data Status (Flow) | Notes / Why not visible | Providers (asks/returns)
|---|---|---|---|
| Title — analysis.name | Present (top-level) | — | O asks/returns; A asks/returns; G asks/returns; P asks/returns
| Status badge — analysis.status | Present | — | n/a
| Quality badge — data_quality_score | Present but scaling bug (uses 0..1 directly) | UI uses Math.round(score) -> 1%; expected score*100; shows inconsistent values | O asks/returns; A asks/returns; G asks/returns; P asks/returns
| Created — created_at | Present | — | n/a
| Completed — completed_at | Missing (null) | Hidden due to falsy guard | n/a
| Website — primaryResult.website_url (results[0] or top-level) | Present (from analysis_data.results[0]) | Shows “Visit Site” | O/A/G/P ask/return
| Team Size — primaryResult.employee_count | Present | — | O/A/G/P ask/return
| AI Sources — analysis.analysis_data.provider_count | Missing | Hidden; provider_count not set; could derive from confidence_scores.overall or providers_used | n/a

## Executive (ExecutiveSummarySection)
| Field | Data Status (Flow) | Notes | Providers
|---|---|---|---|
| Overall Threat Level — analysis.overall_threat_level | Missing | Displays “Unknown” | Not directly asked in prompts; can be derived from SWOT; currently not provided by providers
| Market Share — analysis.market_share_estimate | Missing -> renders 0% | Hidden meaningfully; consider nullable guard to hide 0 | O/G prompts include market_share (as %); Per provider return varies
| Data Quality — analysis.data_quality_score | Present but scaling bug | Needs score*100 | O/A/G/P
| Revenue Estimate — analysis.revenue_estimate | Missing -> N/A | Providers may return if public/estimated | O/A/G prompt revenue
| Company Overview — primaryResult.company_overview or analysis.description | Present (from description) | Fallback works | O/A/G/P
| Industry — primaryResult.industry | Present | — | O/A/G/P
| Founded — primaryResult.founded_year | Present | — | O/A/G/P
| Headquarters — primaryResult.headquarters | Present | — | O/A/G/P
| Employee Count — primaryResult.employee_count | Present | — | O/A/G/P
| Performance scores (innovation_score, brand_strength_score, operational_efficiency_score, market_sentiment_score) | Mostly Missing (market_sentiment_score=0) | Section filters out 0 values; nothing shows | Not explicitly asked except some (sentiment) in some prompts; optional
| Business Model — primaryResult.business_model | Present | — | O/A/G/P
| Market Position — analysis.market_position | Present | leader | O/A/G/P
| Target Markets — analysis.target_market[] | Present | Shows chips | O/A/G/P
| Multi-Source banner — analysis.analysis_data.provider_count + consistency_score | Missing | Hidden; provider_count not set; consistency_score present (0.57) | n/a

## SWOT (SwotAnalysisSection)
| Field | Data Status (Flow) | Notes | Providers
|---|---|---|---|
| Strengths — strengths[] (top-level or primaryResult) | Present | Count shown; items listed | O/A/G/P
| Weaknesses — weaknesses[] | Present | — | O/A/G/P
| Opportunities — opportunities[] | Present | — | O/A/G/P
| Threats — threats[] | Present | — | O/A/G/P
| Strategic Analysis — swot_analysis (string/object) | Missing | Hidden when absent | O/A/G sometimes return narrative; P less so

## Market (MarketAnalysisSection)
| Field | Data Status | Notes | Providers
|---|---|---|---|
| Market Share — market_share_estimate | Missing -> 0% | Consider hide when null | O/G prompt market_share; P may return
| Market Position — market_position | Present | — | O/A/G/P
| Market Sentiment — market_sentiment_score | Present=0% | Renders 0% | Some providers return; not guaranteed
| Geographic Reach — geographic_presence[] | Missing | Hidden | G asks; others optional
| Target Markets — target_market[] | Present | — | O/A/G/P
| Customer Segments — customer_segments[] | Missing | Hidden | G asks; O/A optional
| Market Trends — market_trends[] | Missing | Hidden | G asks/returns
| Market Analysis Summary — primaryResult.market_analysis | Missing | Hidden | Depends on provider

## Financial (FinancialAnalysisSection)
| Field | Data Status | Notes | Providers
|---|---|---|---|
| Revenue Estimate — revenue_estimate | Missing (N/A) | — | O/A/G prompt
| Market Share — market_share_estimate | Missing | 0% | see above
| Funding Status — funding_info.total_funding | Missing (null) | Hidden/“Private” | O/A/G prompt funding_info
| Financial Health — financial_metrics.health_score | Missing | Hidden | Not commonly returned yet
| Pricing Strategy — pricing_strategy (string/object) | Present (model) | Shows model; tiers/examples optional | O/A/G/P
| Funding Information — funding_info (object/text) | Missing | Hidden | Providers vary; not returned in sample
| Financial Metrics — financial_metrics.* | Missing | Hidden | Rarely provided
| Financial Analysis Summary — primaryResult.financial_analysis | Missing | Hidden | Provider-dependent

## Technology (TechnologyAnalysisSection)
| Field | Data Status | Notes | Providers
|---|---|---|---|
| Innovation Score — innovation_score | Missing | Hidden | Not consistently returned
| Patent Count — patent_count | Missing | Hidden | G asks; returns sometimes
| Tech Stack Complexity — technology_analysis.stack_complexity | Missing (string provided instead) | Our record has technology_analysis as string; object expected by UI | O/A/G/P often return text; need normalization
| Security Score — technology_analysis.security_score | Missing | Hidden | Rare
| Technology Stack — technology_analysis.stack | Missing | Hidden | 
| Certifications — certification_standards[] | Missing | Hidden | 
| Products & Services — technology_analysis.products[] | Missing | Hidden | 
| Product Portfolio — product_portfolio.{primary_products,services,apis} | Missing | Hidden | Not in provider prompts; internal enrichment expected
| Dev Tools — technology_analysis.development_tools[] | Missing | Hidden | 
| Infrastructure — technology_analysis.infrastructure{...} | Missing | Hidden | 
| Open Source/GitHub — technology_analysis.github_url or social_media_presence.github | Partial (github via social_media_presence) | UI expects technology_analysis.github_url; current data has social_media_presence.github | O/A/G prompts include social/social links sometimes
| Tech Blog — technology_analysis.tech_blog_url | Missing | Hidden | 

## Competitive (CompetitiveAnalysisSection)
| Field | Data Status | Notes | Providers
|---|---|---|---|
| Threat Level — overall_threat_level | Missing -> shows “Unknown” | Not explicitly asked; could be derived | —
| Brand Strength — brand_strength_score | Missing | Hidden | Not consistently returned
| Competitive Advantages — competitive_advantages[] | Present | — | O/A/G/P
| Competitive Disadvantages — competitive_disadvantages[] | Missing | Hidden | G asks sometimes
| Partnerships — partnerships[] | Missing | Hidden | G asks sometimes
| Competitive Positioning Summary — narrative | Missing | Hidden | Provider-dependent

## Personnel (PersonnelAnalysisSection)
| Field | Data Status | Notes | Providers
|---|---|---|---|
| Team Size — employee_count | Present | — | O/A/G/P
| Key Personnel — key_personnel{...} | Missing | Hidden | Rarely returned
| Employee Verified — employee_count_verified | Present=false (from top-level) | UI reads primaryResult.employee_count_verified (undefined) → displays “No”; consider reading top-level | —
| Growth Rate — key_personnel.growth_rate | Missing | Hidden | —
| Departments — key_personnel.departments | Missing | Hidden | —
| Headquarters — headquarters | Present | — | O/A/G/P
| Geographic Presence — geographic_presence[] | Missing | Hidden | G asks
| Company Culture — key_personnel.culture | Missing | Hidden | —
| Personnel Analysis Summary — primaryResult.personnel_analysis | Missing | Hidden | —

## Sources (SourceCitations)
| Field | Data Status | Notes | Providers
|---|---|---|---|
| Citations — source_citations[] | Present (3 items) | Provider=OpenAI; rendered | O/A/G/P
| Confidence — confidence_scores.primary_result{...} | Present | Used to synthesize fallback citations if none | O/A/G prompts include per-field confidence (0..1)
| Multi-API consistency — confidence_scores.consistency_score | Present (0.57) | Displayed only when multiple providers (overall length>1) | Aggregated across providers

---

## Provider prompts vs expected fields
- OpenAI (competitor-analysis/index.ts): Asks for canonical keys: company_name, website_url, industry, description, employee_count, founded_year, headquarters, business_model, target_market[], market_position, strengths[], weaknesses[], opportunities[], threats[], competitive_advantages[], pricing_strategy (object|string), funding_info (object), social_media_presence (object), technology_analysis (string), source_citations [{ field, source, url?, confidence? }], confidence (Record<string, number>), data_quality_score (number 0..1), analysis_method, analyzed_at.
- Anthropic: Same canonical keys as OpenAI (slightly different model/endpoint).
- Perplexity: Same canonical keys (compact instruction).
- Gemini: Same canonical keys (compact instruction); separate gemini-client has a richer alternative schema but the orchestrator uses the canonical keys.

Return state observed (sample record providers_used: ["openai"]):
- Consistently returned: company_name, website_url, industry, description, employee_count, founded_year, headquarters, business_model, target_market, market_position, strengths, weaknesses, opportunities, threats, competitive_advantages, pricing_strategy, source_citations, confidence, data_quality_score, analyzed_at, analysis_method.
- Often missing/variable: revenue_estimate, market_share_estimate, market_trends, customer_segments, geographic_presence, funding_info details, financial_metrics, technology_analysis as structured object (often text), patent_count, innovation_score, brand_strength_score, partnerships, key_personnel.

## Key mismatches and fixes
1) Data quality scaling in UI
- Issue: UI uses Math.round(score) for 0..1 values, rendering 1% instead of 57%.
- Fix: Multiply by 100 then round in all badges/metrics where data_quality_score is shown.

2) provider_count not shown
- Issue: analysis.analysis_data.provider_count not set; UI hides Multi-Source indicators.
- Fix: Derive provider_count from confidence_scores.overall keys length or analysis.analysis_data.providers_used length if available.

3) technology_analysis shape mismatch
- Issue: Providers commonly return a string narrative; UI expects an object for stack/products/etc.
- Fix: Normalization: if string, keep narrative in technology_analysis.summary and leave object parts undefined; UI should render narrative fallback.

4) Employee verified sourcing
- Issue: UI reads primaryResult.employee_count_verified; record has top-level field only.
- Fix: Read top-level when primaryResult missing.

5) Market share/sentiment 0 values
- Issue: 0 renders as 0% and may be misleading.
- Fix: Prefer nullable undefined for unknowns; hide when null.

---

## Appendix: Full field coverage by tab
- Executive: overall_threat_level, market_share_estimate, data_quality_score, revenue_estimate, company_overview|description, industry, founded_year, headquarters, employee_count, innovation_score, brand_strength_score, operational_efficiency_score, market_sentiment_score, business_model, market_position, target_market, analysis_data.provider_count, analysis_data.consistency_score
- SWOT: strengths[], weaknesses[], opportunities[], threats[], swot_analysis
- Market: market_share_estimate, market_position, market_sentiment_score, geographic_presence[], target_market[], customer_segments[], market_trends[], primaryResult.market_analysis
- Financial: revenue_estimate, market_share_estimate, funding_info{total_funding,last_round{type,date,amount},investors[]}, financial_metrics{...}, pricing_strategy{model,tiers[],description}, primaryResult.financial_analysis
- Technology: innovation_score, patent_count, technology_analysis{stack_complexity,security_score,stack,products[],development_tools[],infrastructure{...},github_url,tech_blog_url,open_source}, product_portfolio{primary_products[],services[],apis[]}
- Competitive: overall_threat_level, brand_strength_score, competitive_advantages[], competitive_disadvantages[], partnerships[], positioning summary
- Personnel: employee_count, key_personnel{growth_rate,departments{...},culture,...}, employee_count_verified, headquarters, geographic_presence[]
- Sources: source_citations[], confidence_scores{overall, primary_result, consistency_score}

Notes
- Where “primaryResult” is referenced, the UI reads analysis.analysis_data.results[0] as a fallback for top-level fields.
- Visibility guards: many sections check for truthy values or non-empty arrays before rendering.
