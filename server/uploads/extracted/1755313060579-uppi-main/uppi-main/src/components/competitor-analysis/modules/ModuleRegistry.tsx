import React from 'react';

// Single source of truth for analysis module definitions
// Each module decides its own visibility based on available data
// This registry allows easy addition/removal without touching page code

export interface AnalysisModuleProps<T = unknown> {
  analysis: T;
}

export interface AnalysisModuleDescriptor<T = unknown> {
  id: string;
  title: string;
  description?: string;
  // Render returns JSX or null when hidden (no data)
  render: (props: AnalysisModuleProps<T>) => React.ReactNode | null;
}

// Safe access helpers to avoid runtime crashes
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

// Multi-result helpers (read all analysis results consistently)
const getResults = (a: Record<string, unknown>): Record<string, unknown>[] => {
  const ad = isObject(a.analysis_data) ? (a.analysis_data as any) : null;
  const res = ad && Array.isArray(ad.results) ? ad.results : [];
  return res.filter((r: unknown): r is Record<string, unknown> => isObject(r));
};

const combineFromResults = (results: Record<string, unknown>[], key: string): unknown[] => {
  const out: unknown[] = [];
  for (const r of results) {
    const v = (r as any)[key];
    if (Array.isArray(v)) out.push(...v);
    else if (v != null) out.push(v);
  }
  return out;
};

const uniqStrings = (values: unknown[]): string[] => Array.from(new Set(values.map((v) => String(v))));

// Basic cards for simple data rendering (kept internal to module system)
const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div className="p-4 border-b">
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const KeyValue: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    <div className="text-sm">{value ?? '—'}</div>
  </div>
);

// Default module set covering all persisted fields from the Edge Function
export function getDefaultModules<T = unknown>(): AnalysisModuleDescriptor<T>[] {
  const modules: AnalysisModuleDescriptor<T>[] = [
    {
      id: 'company-overview',
      title: 'Company Overview',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;

        // If we have multiple results, render per-result overview blocks
        const results = getResults(a);
        if (results.length > 0) {
          const blocks = results
            .map((r, idx) => {
              const rName = (r as any).name as string | undefined;
              const website = (r as any).website as string | undefined;
              const industry = (r as any).industry as string | undefined;
              const description = (r as any).description as string | undefined;
              const headquarters = (r as any).headquarters as string | undefined;
              const founded = (r as any).founded_year as number | undefined;
              const employeeCount = (r as any).employee_count as number | undefined;
              const businessModel = (r as any).business_model as string | undefined;
              const hasAny = rName || website || industry || description || headquarters || founded || employeeCount || businessModel;
              if (!hasAny) return null;
              return (
                <div key={`overview-${idx}`} className="space-y-2">
                  <div className="text-sm font-medium">{rName || `Result ${idx + 1}`}</div>
                  <KeyValue label="Website" value={website ? <a className="text-primary underline" href={website} target="_blank" rel="noreferrer">{website}</a> : '—'} />
                  <KeyValue label="Industry" value={industry} />
                  <KeyValue label="Headquarters" value={headquarters} />
                  <KeyValue label="Founded" value={founded} />
                  <KeyValue label="Employees" value={employeeCount} />
                  <KeyValue label="Business Model" value={businessModel} />
                  {description && (
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</div>
                      <p className="text-sm leading-relaxed">{description}</p>
                    </div>
                  )}
                  {idx < results.length - 1 && <div className="border-t my-2" />}
                </div>
              );
            })
            .filter(Boolean);
          if (blocks.length === 0) return null;
          return (
            <SectionCard title="Company Overview">
              <div className="space-y-4">{blocks as unknown as React.ReactNode}</div>
            </SectionCard>
          );
        }

        // Single-entity fallback (top-level + analysis_data)
        const name = (a.name as string) || (isObject(a.analysis_data) ? (a.analysis_data.name as string) : undefined);
        const website = (a.website_url as string) || (isObject(a.analysis_data) ? (a.analysis_data.website_url as string) : undefined);
        const industry = (a.industry as string) || (isObject(a.analysis_data) ? (a.analysis_data.industry as string) : undefined);
        const description = (a.description as string) || (isObject(a.analysis_data) ? (a.analysis_data.description as string) : undefined);
        const headquarters = (a.headquarters as string) || (isObject(a.analysis_data) ? (a.analysis_data.headquarters as string) : undefined);
        const founded = (a.founded_year as number) || (isObject(a.analysis_data) ? (a.analysis_data.founded_year as number) : undefined);
        const employeeCount = (a.employee_count as number) || (isObject(a.analysis_data) ? (a.analysis_data.employee_count as number) : undefined);
        const businessModel = (a.business_model as string) || (isObject(a.analysis_data) ? (a.analysis_data.business_model as string) : undefined);
        const hasAny = name || website || industry || description || headquarters || founded || employeeCount || businessModel;
        if (!hasAny) return null;
        return (
          <SectionCard title="Company Overview">
            <KeyValue label="Name" value={name} />
            <KeyValue label="Website" value={website ? <a className="text-primary underline" href={website} target="_blank" rel="noreferrer">{website}</a> : '—'} />
            <KeyValue label="Industry" value={industry} />
            <KeyValue label="Headquarters" value={headquarters} />
            <KeyValue label="Founded" value={founded} />
            <KeyValue label="Employees" value={employeeCount} />
            <KeyValue label="Business Model" value={businessModel} />
            {description && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</div>
                <p className="text-sm leading-relaxed">{description}</p>
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'swot',
      title: 'SWOT',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const results = getResults(a);

        const strengthsTop = arr(a.strengths || (isObject(a.analysis_data) && (a.analysis_data as any).strengths));
        const weaknessesTop = arr(a.weaknesses || (isObject(a.analysis_data) && (a.analysis_data as any).weaknesses));
        const opportunitiesTop = arr(a.opportunities || (isObject(a.analysis_data) && (a.analysis_data as any).opportunities));
        const threatsTop = arr(a.threats || (isObject(a.analysis_data) && (a.analysis_data as any).threats));

        const strengths = uniqStrings([...strengthsTop, ...combineFromResults(results, 'strengths')]);
        const weaknesses = uniqStrings([...weaknessesTop, ...combineFromResults(results, 'weaknesses')]);
        const opportunities = uniqStrings([...opportunitiesTop, ...combineFromResults(results, 'opportunities')]);
        const threats = uniqStrings([...threatsTop, ...combineFromResults(results, 'threats')]);

        if (![strengths, weaknesses, opportunities, threats].some((x) => x.length)) return null;
        return (
          <SectionCard title="SWOT Analysis">
            {([['Strengths', strengths], ['Weaknesses', weaknesses], ['Opportunities', opportunities], ['Threats', threats]] as const).map(([label, items]) => (
              items.length ? (
                <div key={label}>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((it, idx) => (
                      <span key={String(idx)} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">{String(it)}</span>
                    ))}
                  </div>
                </div>
              ) : null
            ))}
          </SectionCard>
        );
      }
    },
    {
      id: 'market-and-financials',
      title: 'Market & Financials',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const revenue = (a.revenue_estimate as number) || (isObject(a.analysis_data) ? (a.analysis_data.revenue_estimate as number) : undefined);
        const marketShare = (a.market_share_estimate as number) || (isObject(a.analysis_data) ? (a.analysis_data.market_share_estimate as number) : undefined);
        const marketPosition = (a.market_position as string) || (isObject(a.analysis_data) ? (a.analysis_data.market_position as string) : undefined);
        const overallThreat = (a.overall_threat_level as string) || (isObject(a.analysis_data) ? (a.analysis_data.overall_threat_level as string) : undefined);
        const financialMetrics = (a.financial_metrics as Record<string, unknown>) || (isObject(a.analysis_data) ? (a.analysis_data.financial_metrics as Record<string, unknown>) : undefined);
        const hasAny = revenue || marketShare || marketPosition || overallThreat || (financialMetrics && Object.keys(financialMetrics).length);
        if (!hasAny) return null;
        return (
          <SectionCard title="Market & Financials">
            <KeyValue label="Revenue Estimate" value={revenue} />
            <KeyValue label="Market Share" value={marketShare} />
            <KeyValue label="Market Position" value={marketPosition} />
            <KeyValue label="Overall Threat Level" value={overallThreat} />
            {financialMetrics && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Financial Metrics</div>
                <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(financialMetrics, null, 2)}</pre>
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'product-and-technology',
      title: 'Product & Technology',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const productPortfolio = (a.product_portfolio as unknown[]) || (isObject(a.analysis_data) ? (a.analysis_data.product_portfolio as unknown[]) : undefined);
        const techAnalysis = (a.technology_analysis as Record<string, unknown>) || (isObject(a.analysis_data) ? (a.analysis_data.technology_analysis as Record<string, unknown>) : undefined);
        const certifications = arr(a.certification_standards || (isObject(a.analysis_data) && (a.analysis_data as any).certification_standards));
        const hasAny = (productPortfolio && productPortfolio.length) || (techAnalysis && Object.keys(techAnalysis).length) || certifications.length;
        if (!hasAny) return null;
        return (
          <SectionCard title="Product & Technology">
            {productPortfolio && productPortfolio.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Product Portfolio</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {productPortfolio.map((p, idx) => (<li key={String(idx)}>{String(p)}</li>))}
                </ul>
              </div>
            )}
            {techAnalysis && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Technology</div>
                <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(techAnalysis, null, 2)}</pre>
              </div>
            )}
            {certifications.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Certifications</div>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((it, idx) => (
                    <span key={String(idx)} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">{String(it)}</span>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'customers-and-market',
      title: 'Customers & Market',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const results = getResults(a);

        const targetMarketTop = arr(a.target_market || (isObject(a.analysis_data) && (a.analysis_data as any).target_market));
        const segmentsTop = arr(a.customer_segments || (isObject(a.analysis_data) && (a.analysis_data as any).customer_segments));
        const geoTop = arr(a.geographic_presence || (isObject(a.analysis_data) && (a.analysis_data as any).geographic_presence));
        const trendsTop = arr(a.market_trends || (isObject(a.analysis_data) && (a.analysis_data as any).market_trends));

        const targetMarket = uniqStrings([...targetMarketTop, ...combineFromResults(results, 'target_market')]);
        const segments = uniqStrings([...segmentsTop, ...combineFromResults(results, 'customer_segments')]);
        const geo = uniqStrings([...geoTop, ...combineFromResults(results, 'geographic_presence')]);
        const trends = uniqStrings([...trendsTop, ...combineFromResults(results, 'market_trends')]);

        if (![targetMarket, segments, geo, trends].some((x) => x.length)) return null;
        return (
          <SectionCard title="Customers & Market">
            {targetMarket.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Target Market</div>
                <div className="flex flex-wrap gap-2">
                  {targetMarket.map((it, idx) => (<span key={String(idx)} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">{String(it)}</span>))}
                </div>
              </div>
            )}
            {segments.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Customer Segments</div>
                <div className="flex flex-wrap gap-2">
                  {segments.map((it, idx) => (<span key={String(idx)} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">{String(it)}</span>))}
                </div>
              </div>
            )}
            {geo.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Geographic Presence</div>
                <div className="flex flex-wrap gap-2">
                  {geo.map((it, idx) => (<span key={String(idx)} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">{String(it)}</span>))}
                </div>
              </div>
            )}
            {trends.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Market Trends</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {trends.map((p, idx) => (<li key={String(idx)}>{String(p)}</li>))}
                </ul>
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'team-and-partnerships',
      title: 'Team & Partnerships',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const people = (a.key_personnel as unknown[]) || (isObject(a.analysis_data) ? (a.analysis_data.key_personnel as unknown[]) : undefined);
        const partnerships = arr(a.partnerships || (isObject(a.analysis_data) && (a.analysis_data as any).partnerships));
        if (!(people && people.length) && partnerships.length === 0) return null;
        return (
          <SectionCard title="Team & Partnerships">
            {people && people.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Key Personnel</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {people.map((p, idx) => (<li key={String(idx)}>{typeof p === 'string' ? p : JSON.stringify(p)}</li>))}
                </ul>
              </div>
            )}
            {partnerships.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Partnerships</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {partnerships.map((p, idx) => (<li key={String(idx)}>{String(p)}</li>))}
                </ul>
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'pricing-and-costs',
      title: 'Pricing & Costs',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const pricing = (a.pricing_strategy as Record<string, unknown>) || (isObject(a.analysis_data) ? (a.analysis_data.pricing_strategy as Record<string, unknown>) : undefined);
        const costBreakdown = (a.cost_breakdown as unknown[]) || (isObject(a.analysis_data) ? (a.analysis_data.cost_breakdown as unknown[]) : undefined);
        const totalCost = (a.total_api_cost as number) || undefined;
        const actualCost = (a.actual_cost as number) || (isObject(a.analysis_data) ? (a.analysis_data.actual_cost as number) : undefined);
        const providerCount = (a.provider_count as number) || (isObject(a.analysis_data) ? (a.analysis_data.provider_count as number) : undefined);
        const providersUsed = arr(a.providers_used || (isObject(a.analysis_data) && (a.analysis_data as any).providers_used));
        const providersSkipped = arr(a.providers_skipped || (isObject(a.analysis_data) && (a.analysis_data as any).providers_skipped));
        const hasAny = pricing || (costBreakdown && (costBreakdown as unknown[]).length > 0) || totalCost || actualCost || providerCount || providersUsed.length || providersSkipped.length;
        if (!hasAny) return null;
        return (
          <SectionCard title="Pricing & API Costs">
            {pricing && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pricing Strategy</div>
                <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(pricing, null, 2)}</pre>
              </div>
            )}
            {(typeof totalCost === 'number') && (
              <KeyValue label="Total API Cost (USD)" value={`$${totalCost.toFixed(4)}`} />
            )}
            {(typeof actualCost === 'number') && (
              <KeyValue label="Actual API Cost (USD)" value={`$${actualCost.toFixed(4)}`} />
            )}
            {(typeof providerCount === 'number') && (
              <KeyValue label="Providers Count" value={providerCount} />
            )}
            {Array.isArray(costBreakdown) && (costBreakdown as unknown[]).length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cost Breakdown</div>
                <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(costBreakdown, null, 2)}</pre>
              </div>
            )}
            {(providersUsed.length > 0 || providersSkipped.length > 0) && (
              <div className="flex flex-wrap gap-4">
                {providersUsed.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Providers Used</div>
                    <div className="flex flex-wrap gap-2">
                      {providersUsed.map((p, idx) => (<span key={String(idx)} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">{String(p)}</span>))}
                    </div>
                  </div>
                )}
                {providersSkipped.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Providers Skipped</div>
                    <div className="flex flex-wrap gap-2">
                      {providersSkipped.map((p, idx) => (<span key={String(idx)} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">{String(p)}</span>))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'quality-and-provenance',
      title: 'Quality & Provenance',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const confidence = (a.confidence_scores as Record<string, unknown>) || (isObject(a.analysis_data) ? (a.analysis_data.confidence_scores as Record<string, unknown>) : undefined);
        const citations = (a.source_citations as unknown[]) || (isObject(a.analysis_data) ? (a.analysis_data.source_citations as unknown[]) : undefined);
        const dataQuality = (a.data_quality_score as number) || (isObject(a.analysis_data) ? (a.analysis_data.data_quality_score as number) : undefined);
        const hasAny = (confidence && Object.keys(confidence).length) || (Array.isArray(citations) && citations.length > 0) || typeof dataQuality === 'number';
        if (!hasAny) return null;
        return (
          <SectionCard title="Quality & Provenance">
            {typeof dataQuality === 'number' && <KeyValue label="Data Quality Score" value={`${Math.round((dataQuality <= 1 ? dataQuality * 100 : dataQuality))}%`} />}
            {confidence && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Confidence Scores</div>
                <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(confidence, null, 2)}</pre>
              </div>
            )}
            {Array.isArray(citations) && citations.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Source Citations</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {citations.map((c, idx) => (<li key={String(idx)}>{typeof c === 'string' ? c : JSON.stringify(c)}</li>))}
                </ul>
              </div>
            )}
          </SectionCard>
        );
      }
    },
  ];

  // Extended modules: easy to extend without touching consumer pages
  modules.push(
    {
      id: 'moat-and-advantages',
      title: 'Moat & Competitive Advantages',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const advantages = arr(a.competitive_advantages || (isObject(a.analysis_data) && (a.analysis_data as any).competitive_advantages));
        const disadvantages = arr(a.competitive_disadvantages || (isObject(a.analysis_data) && (a.analysis_data as any).competitive_disadvantages));
        if (advantages.length === 0 && disadvantages.length === 0) return null;
        return (
          <SectionCard title="Moat & Competitive Advantages">
            {advantages.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Advantages</div>
                <div className="flex flex-wrap gap-2">
                  {advantages.map((it, idx) => (<span key={String(idx)} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">{String(it)}</span>))}
                </div>
              </div>
            )}
            {disadvantages.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Disadvantages</div>
                <div className="flex flex-wrap gap-2">
                  {disadvantages.map((it, idx) => (<span key={String(idx)} className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs">{String(it)}</span>))}
                </div>
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'risks',
      title: 'Risks',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const threats = arr(a.threats || (isObject(a.analysis_data) && (a.analysis_data as any).threats));
        const overallThreat = (a.overall_threat_level as string) || (isObject(a.analysis_data) ? (a.analysis_data.overall_threat_level as string) : undefined);
        if (threats.length === 0 && !overallThreat) return null;
        return (
          <SectionCard title="Risks">
            {overallThreat && <KeyValue label="Overall Threat Level" value={overallThreat} />}
            {threats.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Threats</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {threats.map((t, i) => (<li key={String(i)}>{String(t)}</li>))}
                </ul>
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'pricing-matrix',
      title: 'Pricing Matrix',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const pricing = (a.pricing_strategy as Record<string, unknown>) || (isObject(a.analysis_data) ? (a.analysis_data.pricing_strategy as Record<string, unknown>) : undefined);
        const tiers = (isObject(pricing) && Array.isArray((pricing as any).tiers)) ? (pricing as any).tiers as any[] : [];
        if (!pricing) return null;
        return (
          <SectionCard title="Pricing Matrix">
            {tiers.length > 0 ? (
              <div className="space-y-3">
                {tiers.map((t, idx) => (
                  <div key={String(idx)} className="flex items-center justify-between rounded border p-3">
                    <div className="font-medium">{String((t as any).name || (t as any).tier || `Tier ${idx+1}`)}</div>
                    <div className="text-sm text-muted-foreground">{String((t as any).price || (t as any).cost || 'N/A')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(pricing, null, 2)}</pre>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'scores-and-indicators',
      title: 'Scores & Indicators',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const brand = (a.brand_strength_score as number) || (isObject(a.analysis_data) ? (a.analysis_data.brand_strength_score as number) : undefined);
        const ops = (a.operational_efficiency_score as number) || (isObject(a.analysis_data) ? (a.analysis_data.operational_efficiency_score as number) : undefined);
        const innov = (a.innovation_score as number) || (isObject(a.analysis_data) ? (a.analysis_data.innovation_score as number) : undefined);
        const patents = (a.patent_count as number) || (isObject(a.analysis_data) ? (a.analysis_data.patent_count as number) : undefined);
        const sentiment = (a.market_sentiment_score as number) || (isObject(a.analysis_data) ? (a.analysis_data.market_sentiment_score as number) : undefined);
        const completeness = (a.data_completeness_score as number) || (isObject(a.analysis_data) ? (a.analysis_data.data_completeness_score as number) : undefined);
        const normalized = (a.normalized_scores as Record<string, unknown>) || (isObject(a.analysis_data) ? (a.analysis_data.normalized_scores as Record<string, unknown>) : undefined);
        const hasAny = brand || ops || innov || patents || sentiment || completeness || (normalized && Object.keys(normalized).length);
        if (!hasAny) return null;
        return (
          <SectionCard title="Scores & Indicators">
            {typeof brand === 'number' && <KeyValue label="Brand Strength" value={brand} />}
            {typeof ops === 'number' && <KeyValue label="Operational Efficiency" value={ops} />}
            {typeof innov === 'number' && <KeyValue label="Innovation" value={innov} />}
            {typeof patents === 'number' && <KeyValue label="Patent Count" value={patents} />}
            {typeof sentiment === 'number' && <KeyValue label="Market Sentiment" value={sentiment} />}
            {typeof completeness === 'number' && <KeyValue label="Data Completeness" value={`${Math.round((completeness <= 1 ? completeness*100 : completeness))}%`} />}
            {normalized && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Normalized Scores</div>
                <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(normalized, null, 2)}</pre>
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'public-company-and-news',
      title: 'Public Company & News',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const stock = (a.stock_symbol as string) || (isObject(a.analysis_data) ? (a.analysis_data.stock_symbol as string) : undefined);
        const exchange = (a.exchange as string) || (isObject(a.analysis_data) ? (a.analysis_data.exchange as string) : undefined);
        const isPublic = (a.is_public_company as boolean) || (isObject(a.analysis_data) ? (a.analysis_data.is_public_company as boolean) : undefined);
        const lastNews = (a.last_news_update as string) || (isObject(a.analysis_data) ? (a.analysis_data.last_news_update as string) : undefined);
        const news = (isObject(a.analysis_data) && (a.analysis_data as any).news) || (a as any).news || (isObject(a.analysis_data) && (a.analysis_data as any).recent_news) || [];
        const items: any[] = Array.isArray(news) ? news : [];
        const hasAny = stock || exchange || typeof isPublic === 'boolean' || lastNews || items.length > 0;
        if (!hasAny) return null;
        return (
          <SectionCard title="Public Company & News">
            {stock && <KeyValue label="Stock Symbol" value={stock} />}
            {exchange && <KeyValue label="Exchange" value={exchange} />}
            {typeof isPublic === 'boolean' && <KeyValue label="Is Public" value={isPublic ? 'Yes' : 'No'} />}
            {lastNews && <KeyValue label="Last News Update" value={lastNews} />}
            {items.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Recent News</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {items.map((n, idx) => (
                    <li key={String(idx)}>{typeof n === 'string' ? n : JSON.stringify(n)}</li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>
        );
      }
    },
    {
      id: 'social-media-presence',
      title: 'Social Media Presence',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const social = (a.social_media_presence as Record<string, unknown>) || (isObject(a.analysis_data) ? (a.analysis_data.social_media_presence as Record<string, unknown>) : undefined);
        if (!social || !isObject(social) || Object.keys(social).length === 0) return null;
        return (
          <SectionCard title="Social Media Presence">
            <pre className="text-xs bg-muted rounded p-3 overflow-auto">{JSON.stringify(social, null, 2)}</pre>
          </SectionCard>
        );
      }
    },
    {
      id: 'meta-and-session',
      title: 'Meta & Session',
      render: ({ analysis }) => {
        if (!isObject(analysis)) return null;
        const a = analysis as Record<string, unknown>;
        const sessionId = (a.session_id as string) || (isObject(a.analysis_data) ? (a.analysis_data.session_id as string) : undefined);
        const analysisId = (a.analysis_id as string) || (a.id as string) || (isObject(a.analysis_data) ? (a.analysis_data.analysis_id as string) : undefined);
        const completedAt = (a.completed_at as string) || (isObject(a.analysis_data) ? (a.analysis_data.completed_at as string) : undefined);
        const lastUpdatedSources = (a.last_updated_sources as string) || (isObject(a.analysis_data) ? (a.analysis_data.last_updated_sources as string) : undefined);
        const hasAny = sessionId || analysisId || completedAt || lastUpdatedSources;
        if (!hasAny) return null;
        return (
          <SectionCard title="Meta & Session">
            {analysisId && <KeyValue label="Analysis ID" value={analysisId} />}
            {sessionId && <KeyValue label="Session ID" value={sessionId} />}
            {completedAt && <KeyValue label="Completed At" value={completedAt} />}
            {lastUpdatedSources && <KeyValue label="Sources Updated At" value={lastUpdatedSources} />}
          </SectionCard>
        );
      }
    }
  );

  return modules;
}
