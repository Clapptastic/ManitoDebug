import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  DollarSign, 
  Users, 
  Star, 
  Headphones,
  TrendingUp,
  Target,
  BarChart3,
  Brain,
  Shield,
  ThumbsUp,
  Award,
  Cpu,
  Navigation
} from 'lucide-react';
import { CompetitorAnalysisEntity } from '@/types/competitor';
import { MarketPositionPerformanceView } from './MarketPositionPerformanceView';
import { TechnologyInnovationView } from './TechnologyInnovationView';
import { CustomerJourneyView } from './CustomerJourneyView';

interface ComprehensiveAnalysisViewProps {
  analysis: CompetitorAnalysisEntity;
}

export const ComprehensiveAnalysisView: React.FC<ComprehensiveAnalysisViewProps> = ({ analysis }) => {
  const base = (analysis as any)?.analysis_data || {};
  const analysisData = Array.isArray(base?.results) && base.results[0] ? { ...base, ...base.results[0] } : base;
  const ensureProductsAndServices = () => {
    // Use actual data from analysis_data or return empty structure if not available
    const products = analysisData.products_and_services || {};
    
    // Only provide real data - no mock fallbacks
    if (!products.product_features && !products.pricing_analysis && !products.customer_service) {
      // Extract real data from other analysis fields if available
      const realData = {
        product_features: {
          core_features: analysisData.competitive_advantages || [],
          user_experience_quality: analysisData.technology_analysis ? "good" : null,
          design_quality: null,
          feature_depth: analysisData.technology_analysis || null,
          innovation_level: null
        },
        pricing_analysis: {
          pricing_model: typeof analysisData.pricing_strategy === 'object' 
            ? analysisData.pricing_strategy?.model || analysisData.pricing_strategy?.pricing_model
            : analysisData.pricing_strategy,
          competitive_pricing_position: analysisData.pricing_strategy?.competitive_pricing_position || null,
          base_prices: analysisData.pricing_strategy?.base_prices || null,
          pricing_transparency: analysisData.pricing_strategy?.transparency || null,
          value_proposition: analysisData.pricing_strategy?.value_proposition || null
        },
        customer_service: {
          support_channels: null,
          response_times: null,
          service_quality_rating: null,
          availability: null,
          support_quality: null
        }
      };
      
      return realData;
    }
    
    return products;
  };

  const renderProductsServices = () => {
    const products = ensureProductsAndServices();
    
    return (
      <div className="space-y-6">
        {/* Product Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Features & Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {products.product_features && products.product_features.core_features && products.product_features.core_features.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Core Features</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {products.product_features.core_features.map((feature: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{feature}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Quality Assessment</h4>
                  <div className="space-y-2">
                    {products.product_features.user_experience_quality && (
                      <div className="flex justify-between">
                        <span>UX Quality:</span>
                        <Badge variant="secondary">{products.product_features.user_experience_quality}</Badge>
                      </div>
                    )}
                    {products.product_features.design_quality && (
                      <div className="flex justify-between">
                        <span>Design Quality:</span>
                        <Badge variant="secondary">{products.product_features.design_quality}</Badge>
                      </div>
                    )}
                    {products.product_features.feature_depth && (
                      <div className="text-sm text-muted-foreground mt-2">
                        {products.product_features.feature_depth}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Product features data not available</div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing & Packaging
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.pricing_analysis && (products.pricing_analysis.pricing_model || products.pricing_analysis.base_prices) ? (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Pricing Model</h4>
                  {products.pricing_analysis.pricing_model && (
                    <Badge variant="outline">{products.pricing_analysis.pricing_model}</Badge>
                  )}
                  {products.pricing_analysis.competitive_pricing_position && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Position: </span>
                      <Badge>{products.pricing_analysis.competitive_pricing_position}</Badge>
                    </div>
                  )}
                  {products.pricing_analysis.value_proposition && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {products.pricing_analysis.value_proposition}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Pricing Details</h4>
                  {products.pricing_analysis.base_prices && Object.keys(products.pricing_analysis.base_prices).length > 0 ? (
                    <div className="space-y-1">
                      {Object.entries(products.pricing_analysis.base_prices).map(([plan, price]) => (
                        <div key={plan} className="flex justify-between text-sm">
                          <span>{plan}:</span>
                          <span className="font-medium">{price as string}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Pricing details not available</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Pricing analysis not available</div>
            )}
          </CardContent>
        </Card>

        {/* Customer Service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Customer Service Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.customer_service && (products.customer_service.support_channels || products.customer_service.service_quality_rating) ? (
              <div className="grid md:grid-cols-3 gap-4">
                {products.customer_service.support_channels && products.customer_service.support_channels.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Support Channels</h4>
                    <div className="flex flex-wrap gap-1">
                      {products.customer_service.support_channels.map((channel: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{channel}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {products.customer_service.response_times && Object.keys(products.customer_service.response_times).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Response Times</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(products.customer_service.response_times).map(([channel, time]) => (
                        <div key={channel} className="flex justify-between">
                          <span>{channel}:</span>
                          <span>{time as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {products.customer_service.service_quality_rating && (
                  <div>
                    <h4 className="font-semibold mb-2">Service Quality</h4>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{products.customer_service.service_quality_rating}/10</span>
                    </div>
                    {products.customer_service.availability && (
                      <Badge variant="outline" className="mt-1">
                        {products.customer_service.availability}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Customer service analysis not available</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMarketingSales = () => {
    const marketing = analysisData.marketing_and_sales || {};
    
    return (
      <div className="space-y-6">
        {/* Marketing Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Marketing Channels & Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketing.marketing_channels && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Primary Channels</h4>
                  <div className="flex flex-wrap gap-1">
                    {marketing.marketing_channels.primary_channels?.map((channel: string, idx: number) => (
                      <Badge key={idx} variant="outline">{channel}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Channel Effectiveness</h4>
                  {marketing.marketing_channels.channel_effectiveness && (
                    <div className="space-y-2">
                      {Object.entries(marketing.marketing_channels.channel_effectiveness).map(([channel, effectiveness]) => (
                        <div key={channel} className="flex justify-between items-center">
                          <span className="text-sm">{channel}:</span>
                          <Badge variant={effectiveness === 'high' ? 'default' : effectiveness === 'medium' ? 'secondary' : 'outline'}>
                            {effectiveness as string}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media Presence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Social Media Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketing.social_media_presence && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Platform Presence</h4>
                  <div className="flex flex-wrap gap-1">
                    {marketing.social_media_presence.platforms?.map((platform: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{platform}</Badge>
                    ))}
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Overall Strength: </span>
                    <Badge>{marketing.social_media_presence.social_media_strength}</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Engagement Metrics</h4>
                  {marketing.social_media_presence.engagement_rates && (
                    <div className="space-y-1 text-sm">
                      {Object.entries(marketing.social_media_presence.engagement_rates).map(([platform, rate]) => (
                        <div key={platform} className="flex justify-between">
                          <span>{platform}:</span>
                          <span>{rate as string}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Tactics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sales Strategy & Tactics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketing.sales_tactics && (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Lead Generation</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {marketing.sales_tactics.lead_generation_methods?.map((method: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{method}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Sales Approach</h4>
                  <Badge variant="outline">{marketing.sales_tactics.sales_approach}</Badge>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Cycle Length: </span>
                    <span>{marketing.sales_tactics.sales_cycle_length}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Conversion Strategies</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {marketing.sales_tactics.conversion_strategies?.map((strategy: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{strategy}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBusinessOperations = () => {
    const operations = analysisData.business_operations || {};
    
    return (
      <div className="space-y-6">
        {/* Market Share & Position */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Market Position & Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {operations.market_share && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Market Position</h4>
                  <Badge variant="default" className="mb-2">{operations.market_share.competitive_position}</Badge>
                  <div className="text-sm space-y-1">
                    <div>Market Share: <span className="font-medium">{operations.market_share.estimated_market_share}</span></div>
                    <div>Market Ranking: <span className="font-medium">{operations.market_share.market_ranking}</span></div>
                    <div>Growth Rate: <span className="font-medium">{operations.market_share.market_growth_rate}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Financial Health</h4>
                  {operations.financial_performance && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="secondary">{operations.financial_performance.funding_status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Profitability:</span>
                        <Badge variant="outline">{operations.financial_performance.profitability}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Health:</span>
                        <Badge>{operations.financial_performance.financial_health}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Technology & Innovation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {operations.technology_stack && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Core Technologies</h4>
                  <div className="flex flex-wrap gap-1">
                    {operations.technology_stack.core_technologies?.map((tech: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Infrastructure: </span>
                    <Badge variant="outline">{operations.technology_stack.infrastructure}</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Technology Advantages</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {operations.technology_stack.technology_advantages?.map((advantage: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground">{advantage}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Journey */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Journey Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {operations.customer_journey && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Awareness Stage</h4>
                    <p className="text-sm text-muted-foreground">{operations.customer_journey.awareness_stage}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Purchase Process</h4>
                    <p className="text-sm text-muted-foreground">{operations.customer_journey.purchase_process}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Retention Strategies</h4>
                  <div className="flex flex-wrap gap-1">
                    {operations.customer_journey.retention_strategies?.map((strategy: string, idx: number) => (
                      <Badge key={idx} variant="outline">{strategy}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCustomerSentiment = () => {
    const sentiment = analysisData.customer_sentiment || {};
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5" />
              Customer Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-4">Overall Sentiment</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Sentiment Score</span>
                      <span className="font-bold">{sentiment.sentiment_score}/100</span>
                    </div>
                    <Progress value={parseInt(sentiment.sentiment_score || '0')} className="h-2" />
                  </div>
                  
                  {sentiment.review_analysis && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Average Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{sentiment.review_analysis.average_rating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Reviews:</span>
                        <span>{sentiment.review_analysis.total_reviews}</span>
                      </div>
                      {sentiment.net_promoter_score && (
                        <div className="flex justify-between">
                          <span>NPS Score:</span>
                          <Badge variant="secondary">{sentiment.net_promoter_score}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Review Analysis</h4>
                {sentiment.review_analysis && (
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-green-600">Positive Themes</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {sentiment.review_analysis.positive_themes?.map((theme: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground">{theme}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-red-600">Negative Themes</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {sentiment.review_analysis.negative_themes?.map((theme: string, idx: number) => (
                          <li key={idx} className="text-sm text-muted-foreground">{theme}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">Review Sources</h5>
                      <div className="flex flex-wrap gap-1">
                        {sentiment.review_analysis.review_sources?.map((source: string, idx: number) => (
                          <Badge key={idx} variant="outline">{source}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCompetitiveLandscape = () => {
    const landscape = analysisData.competitive_landscape || {};
    
    return (
      <div className="space-y-6">
        {/* Competitor Identification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Competitive Landscape
            </CardTitle>
          </CardHeader>
          <CardContent>
            {landscape.competitor_identification && (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Direct Competitors</h4>
                  <div className="space-y-1">
                    {landscape.competitor_identification.direct_competitors?.map((comp: string, idx: number) => (
                      <Badge key={idx} variant="destructive">{comp}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Indirect Competitors</h4>
                  <div className="space-y-1">
                    {landscape.competitor_identification.indirect_competitors?.map((comp: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{comp}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Emerging Threats</h4>
                  <div className="space-y-1">
                    {landscape.competitor_identification.emerging_threats?.map((threat: string, idx: number) => (
                      <Badge key={idx} variant="outline">{threat}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Value Proposition */}
        <Card>
          <CardHeader>
            <CardTitle>Value Proposition Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {landscape.value_proposition && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Core Value Proposition</h4>
                  <p className="text-sm text-muted-foreground">{landscape.value_proposition.core_value_prop}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Unique Selling Points</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {landscape.value_proposition.unique_selling_points?.map((usp: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">{usp}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Target Pain Points</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {landscape.value_proposition.target_customer_pain_points?.map((pain: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">{pain}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Market Trends & Future Outlook</CardTitle>
          </CardHeader>
          <CardContent>
            {landscape.market_trends && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Relevant Market Trends</h4>
                  <div className="flex flex-wrap gap-1">
                    {landscape.market_trends.relevant_trends?.map((trend: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{trend}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Trend Impact</h4>
                    <Badge variant={
                      landscape.market_trends.trend_impact_on_competitor === 'positive' ? 'default' :
                      landscape.market_trends.trend_impact_on_competitor === 'negative' ? 'destructive' : 'secondary'
                    }>
                      {landscape.market_trends.trend_impact_on_competitor}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Adaptation Strategy</h4>
                    <p className="text-sm text-muted-foreground">{landscape.market_trends.competitor_trend_adaptation}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
        <Tabs defaultValue="products-services" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="products-services">Products & Services</TabsTrigger>
            <TabsTrigger value="marketing-sales">Marketing & Sales</TabsTrigger>
            <TabsTrigger value="business-ops">Business Operations</TabsTrigger>
            <TabsTrigger value="market-position">Market Position</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="customer-journey">Customer Journey</TabsTrigger>
          </TabsList>
        
        <TabsContent value="products-services" className="mt-6">
          {renderProductsServices()}
        </TabsContent>
        
        <TabsContent value="marketing-sales" className="mt-6">
          {renderMarketingSales()}
        </TabsContent>
        
        <TabsContent value="business-ops" className="mt-6">
          {renderBusinessOperations()}
        </TabsContent>

        <TabsContent value="market-position" className="mt-6">
          <MarketPositionPerformanceView analysis={analysis} />
        </TabsContent>

        <TabsContent value="technology" className="mt-6">
          <TechnologyInnovationView analysis={analysis} />
        </TabsContent>

        <TabsContent value="customer-journey" className="mt-6">
          <CustomerJourneyView analysis={analysis} />
        </TabsContent>
      </Tabs>
    </div>
  );
};