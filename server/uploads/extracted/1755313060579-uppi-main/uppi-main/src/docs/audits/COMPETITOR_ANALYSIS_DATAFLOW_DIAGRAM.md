# Competitor Analysis Dataflow Diagram
Date: 2025-08-13

This diagram illustrates the end-to-end flow from the Analyze button through Edge Functions, database persistence, master profile linkage, and UI rendering. A live, animated version is available in the Admin Flow Monitor (Admin → Analysis Flow).

```mermaid
graph TD
  %% UI initiation
  U[User UI: Analyze button] --> H[useCompetitorAnalysis hook]
  H --> G[Edge Function: competitor-analysis-gate (check/unlock)]
  G --> PF[RPC: check_user_cost_allowed(projected_cost)]
  PF --> S[competitorAnalysisService.startAnalysis(sessionId, competitors)]
  S --> RPC1[RPC: insert_competitor_analysis_progress → status=pending]
  S --> ARUN[RPC: insert_analysis_run(run_type='competitor', session_id)]
  
  %% Orchestration and key management
  S --> EF1[Edge Function: competitor-analysis]
  EF1 --> AK[RPC: manage_api_key(get_for_decryption) per enabled provider]
  AK -. per-user/org keys with RLS .- K[api_keys]
  
  subgraph Providers
    PRUNS[analysis_provider_runs: per provider] --> PPL[Perplexity: realtime search]
    PRUNS --> OAI[OpenAI: structure/summarize]
    PPL --> ARES[analysis_provider_results]
    OAI --> ARES
  end
  
  EF1 --> PRUNS
  EF1 --> PPL
  EF1 --> OAI
  
  %% Logging and costs
  EF1 --> AILOG[ai_prompt_logs]
  EF1 --> COST[api_usage_costs + tokens]
  EF1 --> MET[api_metrics (status/time)]
  EF1 --> ARUNU[analysis_runs.status/metrics]
  
  %% Normalization and persistence
  EF1 --> ORCH[Normalize + merge provider outputs]
  ORCH --> PERSIST[Upsert competitor_analyses rows]
  ORCH --> RET[Return results map {competitor → status,data,analysis_id,cost}]
  PERSIST --> PROG[RPC: update_competitor_analysis_progress]
  
  %% Master profile enrichment and combined view
  PERSIST --> EF2[Edge Function: enrich-analysis-with-master-profile]
  EF2 --> UPCP[RPC: upsert_company_profile]
  EF2 --> LINK[RPC: link_analysis_to_company]
  EF2 --> COMB[Upsert analysis_combined]
  
  %% Realtime and frontend rendering
  PROG --> RT[Realtime: competitor_analysis_progress]
  RET --> H
  RT --> H
  H --> F1[RPC: get_user_competitor_analyses(session_id)]
  H --> F2[Select analysis_combined by analysis_id]
  F1 --> UI[Details page: useAnalysisReport]
  F2 --> UI
  UI --> MODS[Modules render: aggregated results + provenance]
  
  %% Error paths
  G -. failure .-> HERR[Notify UI: gate locked or cost exceeded]
  EF1 -. provider error .-> PRUNSFAIL[analysis_provider_runs: status=failed]
  EF1 -. error .-> PROGFAIL[update_competitor_analysis_progress(status='failed')]
  EF1 -. error .-> METFAIL[api_metrics: error capture]
  
  %% Security guardrails
  RLS[RLS Policies on all tables] -. protects .- PERSIST
  RLS -. protects .- K

  %% Legend (classes used by live UI)
  classDef ok fill:#16a34a,color:#fff,stroke:#14532d,stroke-width:2px;
  classDef warn fill:#f59e0b,color:#111,stroke:#92400e,stroke-width:2px;
  classDef err fill:#ef4444,color:#fff,stroke:#7f1d1d,stroke-width:2px;
  classDef neutral fill:#94a3b8,color:#111,stroke:#475569,stroke-width:1px;
```


Notes:
- All AI calls use user/org-scoped API keys via manage_api_key; no global keys.
- Gate check and cost preflight run first: competitor-analysis-gate + check_user_cost_allowed.
- Provider-level tracking uses analysis_provider_runs and analysis_provider_results.
- Prompts and API ops are logged in ai_prompt_logs and api_metrics; costs in api_usage_costs; run status in analysis_runs.
- Realtime progress via competitor_analysis_progress RPC + channel to the UI.
- enrich-analysis-with-master-profile links analyses to company_profiles and writes analysis_combined for unified rendering.
- Strict RLS protects all tables; API keys never leave the server.