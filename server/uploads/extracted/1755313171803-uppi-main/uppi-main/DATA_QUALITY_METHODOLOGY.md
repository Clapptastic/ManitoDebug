# Data Quality and Trust Scoring Methodology

Version: 1.0
Date: 2025-08-07
Owner: Platform Architecture

Purpose
- Define a mathematically sound, auditable, and practical approach for scoring the trustworthiness of data used in competitor analyses.
- Combine source reliability, freshness, verification strength, cross‑source agreement, and multi‑AI consensus into a single Trust Score per field (0–100).

Summary
- Each fact (field-level value) receives a Trust Score T in [0,100].
- T is computed from weighted evidence across sources S (APIs, filings, news) and AI agents A, with freshness decay and verification boosts.
- Scores are stored with provenance so they are reproducible and reviewable.

Notation
- f: a specific fact (e.g., employee_count = 420)
- S: set of sources contributing to f (news, filings, APIs, etc.)
- A: set of AI agents/models contributing to f (OpenAI, Anthropic, Gemini, etc.)
- w_s: baseline reliability weight for source s
- F_s: freshness factor for source s in [0,1]
- V_s: verification factor for source s in [0,1]
- G_s: agreement factor for source s relative to others in [0,1]
- C_A: multi‑agent consensus factor in [0,1]
- Z: normalization constant to bound final score to 0–100

Baseline Weights (w_s)
Weights reflect general reliability of the source class. Final values should be calibrated with real data; suggested starting points:
- Government filings, official financial reports: 1.00
- Stock exchange price feeds (free tiers): 0.95
- Reputable business datasets (Crunchbase/Clearbit/IEX/Polygon): 0.85
- Major reputable news (Reuters, Bloomberg, FT, WSJ): 0.80
- Broad news APIs (NewsAPI aggregated): 0.65
- Company websites/blogs/press releases: 0.60
- Social media/community sources: 0.40
- AI model outputs (unverified): 0.35 (can increase via consensus)

Freshness Factor (F_s)
- Exponential decay with category‑specific half‑life h (days):
  F_s = exp(-ln(2) * age_days / h)
- Recommended half‑lives h:
  - Stock price: 0.02 days (≈30 min)
  - Financial KPIs (market cap, PE): 1–3 days
  - Funding rounds: 365 days
  - Org facts (HQ, founded): 365–1095 days
  - News relevance: 14 days

Verification Factor (V_s)
- Indicates whether evidence is directly verifiable:
  - 1.00: Official, cryptographically signed, or primary filings
  - 0.90: Cross‑checked against at least two independent reputable sources
  - 0.75: Single reputable source
  - 0.50: Company self‑published without external verification
  - 0.30: Community‑reported without verification

Agreement Factor (G_s)
- Measures consistency with other sources S \ {s}:
  - Numeric fields: G_s = 1 if |x_s - median({x_j})| / max(1, |median|) <= τ, else clamp linearly to 0; τ default 5%.
  - Categorical fields: G_s = 1 if majority match; else proportional to majority share.
  - Textual summaries: use cosine similarity on sentence embeddings (threshold 0.80 for “agree”), else scale 0..1 by similarity.

Multi‑Agent Consensus (C_A)
- For AI agents A providing value(s) for f:
  - Exact/near‑exact agreement: C_A = k / |A| (k = agents within tolerance/thresholds)
  - Partial agreement (text): average pairwise cosine similarity, capped to [0,1]
- Consensus bonus factor B_A:
  - B_A = 1 + λ * C_A, with λ ∈ [0, 0.25] (start with 0.15)

Per‑Source Evidence Score (E_s)
E_s = w_s * F_s * V_s * G_s

Aggregate Evidence Score (E)
E = Σ_{s∈S} E_s

Final Trust Score (T)
- Normalize to [0,100] with consensus bonus, then cap:
  T = min(100, 100 * (E / Z) * B_A)
- Z is a calibration constant equal to the 95th percentile of E observed across historical facts (ensures headroom and comparability).

Tiers
- High (≥ 85): safe to highlight; auto‑surface in UI
- Medium (70–84): show with caveat badge; allow user to drill‑down
- Low (< 70): de‑emphasize; prompt for verification or drill‑down

Calibration & Monitoring
- Maintain rolling distributions of E by field type; update Z monthly.
- Track drift in average F_s and G_s; alert if distributions shift materially.
- A/B test λ for consensus bonus to optimize precision/recall on a labeled validation set.

Provenance & Auditability
- For each fact store: contributing sources, (w_s, F_s, V_s, G_s), agent set A, C_A, B_A, and T.
- Render a hover card in UI with “why this score?” breakdown and citations.

Examples (Simplified)
1) Stock price from Alpha Vantage (fresh), Finnhub (fresh), Polygon (stale):
   - w = [0.95, 0.95, 0.85], F ≈ [0.95, 0.95, 0.40], V = [0.90, 0.90, 0.75], G ≈ [0.98, 0.98, 0.70]
   - E ≈ Σ w*F*V*G ≈ 1.59 (illustrative); A empty → B_A = 1
   - Choose Z so that T ≈ 92 (High)

2) Employee count from one reputable dataset and two AI agents agreeing:
   - One reputable: w=0.85, F=0.9, V=0.75, G=1.0 → E1≈0.574
   - Two AI agents agreeing within 1%: each w=0.35, F=0.95, V=0.5, G=1.0 → E2≈0.166 each
   - E≈0.906; A={2}, C_A=1 → B_A=1+0.15=1.15 → T boosted by ~15%

Handling Conflicts & Outliers
- Winsorize extreme numeric outliers (e.g., 1st/99th percentile) before computing G_s.
- If sources split, surface as "conflicting" with side‑by‑side provenance.
- Prefer freshest reputable sources when scores are close.

Implementation Notes
- Start with fast similarity (exact/tolerance, Jaccard) and progressively enhance with embeddings for longer text when budget allows.
- Keep all math in a deterministic utility module with unit tests; no 'any' types.

Testing Protocol
- Golden set of labeled facts with ground truth; assert that High tier ≥ 90% precision.
- Perturbation tests for freshness decay, consensus bonus, and outliers.
- Property‑based tests: invariants like monotonicity (higher F_s/W_s should not reduce T).

Mermaid Overview
<lov-mermaid>
flowchart TD
  S[Sources] --> E[Per-Source Scores E_s]
  A[AI Agents] --> C[Consensus C_A]
  E --> Sum[Aggregate E]
  C --> B[Consensus Bonus B_A]
  Sum --> N[Normalize by Z]
  B --> F[Final Trust Score T]
  N --> F
</lov-mermaid>
