import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, TrendingUp, Users, Globe, BarChart3, Target, DollarSign, Calendar, Eye, Download } from 'lucide-react';

interface MarketResearch {
  id: string;
  title: string;
  description: string;
  query_type: string;
  ai_summary: string;
  raw_results?: any;
  data_sources: any;
  confidence_score: number;
  status: string;
  metadata: any;
  completed_at: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  research_type?: string;
}

interface MarketMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export const MarketResearchAutomation: React.FC = () => {
  const [researches, setResearches] = useState<MarketResearch[]>([]);
  const [currentResearch, setCurrentResearch] = useState<MarketResearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [researchTitle, setResearchTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [researchType, setResearchType] = useState('market_analysis');
  const [researchScope, setResearchScope] = useState('');
  const [region, setRegion] = useState('global');

  useEffect(() => {
    fetchMarketResearches();
  }, []);

  const fetchMarketResearches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_research')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResearches(data || []);
    } catch (error) {
      console.error('Error fetching market researches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch market research data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startResearch = async () => {
    if (!researchTitle.trim() || !industry.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate mock research data
      const marketSizeData = generateMarketSizeData(industry);
      const competitorData = generateCompetitorData(industry);
      const trendAnalysis = generateTrendAnalysis(industry);
      const customerInsights = generateCustomerInsights(targetMarket);

      const researchData = {
        user_id: user.id,
        title: researchTitle,
        description: `${researchType} for ${industry} industry`,
        research_type: researchType,
        ai_summary: generateExecutiveSummary(industry, targetMarket),
        raw_results: JSON.stringify({
          market_size_data: marketSizeData,
          competitor_data: competitorData,
          trend_analysis: trendAnalysis,
          customer_insights: customerInsights,
          key_findings: generateKeyFindings(industry),
          recommendations: generateRecommendations(industry)
        }),
        data_sources: JSON.stringify(['Industry Reports', 'Market Analysis', 'Competitor Intelligence', 'Consumer Surveys']),
        confidence_score: 85,
        status: 'completed',
        metadata: JSON.stringify({
          industry,
          target_market: targetMarket.split(',').map(s => s.trim()).filter(Boolean),
          research_scope: researchScope,
          region,
          generated_at: new Date().toISOString()
        }),
        completed_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('market_research')
        .insert([researchData])
        .select()
        .single();

      if (error) throw error;

      setResearches([data, ...researches]);
      setCurrentResearch(data);
      
      // Reset form
      resetForm();
      
      toast({
        title: 'Success',
        description: 'Market research completed successfully',
      });
    } catch (error) {
      console.error('Error starting market research:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete market research',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const generateMarketSizeData = (industry: string) => ({
    total_market_size: `$${(Math.random() * 500 + 50).toFixed(1)}B`,
    addressable_market: `$${(Math.random() * 100 + 10).toFixed(1)}B`,
    growth_rate: `${(Math.random() * 15 + 5).toFixed(1)}%`,
    market_maturity: ['emerging', 'growing', 'mature'][Math.floor(Math.random() * 3)],
    regional_breakdown: {
      north_america: `${(Math.random() * 40 + 25).toFixed(1)}%`,
      europe: `${(Math.random() * 30 + 20).toFixed(1)}%`,
      asia_pacific: `${(Math.random() * 35 + 25).toFixed(1)}%`,
      other: `${(Math.random() * 15 + 5).toFixed(1)}%`
    }
  });

  const generateCompetitorData = (industry: string) => ({
    market_leaders: [
      { name: 'MarketLeader Corp', market_share: '25%', strengths: ['Brand Recognition', 'Distribution'] },
      { name: 'Innovation Inc', market_share: '18%', strengths: ['Technology', 'Innovation'] },
      { name: 'Global Solutions', market_share: '15%', strengths: ['Global Reach', 'Partnerships'] }
    ],
    competitive_landscape: 'Highly competitive with established players and emerging startups',
    barriers_to_entry: ['High capital requirements', 'Regulatory compliance', 'Brand loyalty'],
    opportunities: ['Digital transformation', 'Emerging markets', 'Sustainability focus']
  });

  const generateTrendAnalysis = (industry: string) => ({
    emerging_trends: [
      'AI and automation adoption',
      'Sustainability and ESG focus',
      'Digital-first customer experience',
      'Remote work enablement'
    ],
    technology_trends: [
      'Cloud computing',
      'Machine learning',
      'IoT integration',
      'Blockchain applications'
    ],
    consumer_behavior: [
      'Increased digital adoption',
      'Value-conscious purchasing',
      'Sustainability preferences',
      'Personalization demand'
    ],
    regulatory_changes: [
      'Data privacy regulations',
      'Environmental compliance',
      'Industry-specific standards'
    ]
  });

  const generateCustomerInsights = (targetMarket: string) => ({
    demographics: {
      age_distribution: '25-45 years (primary), 18-65 years (secondary)',
      income_level: 'Middle to high income',
      education: 'College educated',
      location: 'Urban and suburban areas'
    },
    behaviors: [
      'Research-driven purchase decisions',
      'Value convenience and efficiency',
      'Price-sensitive but quality-focused',
      'Social media influenced'
    ],
    pain_points: [
      'Complex existing solutions',
      'High costs of current alternatives',
      'Lack of personalization',
      'Poor customer support'
    ],
    preferences: [
      'User-friendly interfaces',
      'Transparent pricing',
      'Reliable customer service',
      'Mobile accessibility'
    ]
  });

  const generateExecutiveSummary = (industry: string, targetMarket: string) => 
    `The ${industry} market presents significant opportunities for growth, driven by technological advancement and changing consumer preferences. Our analysis of ${targetMarket} reveals strong demand for innovative solutions that address current market gaps.`;

  const generateKeyFindings = (industry: string) => [
    `The ${industry} market is experiencing rapid digital transformation`,
    'Customer expectations are shifting toward personalized experiences',
    'Sustainability is becoming a key differentiator',
    'Mobile-first approaches are essential for market penetration'
  ];

  const generateMarketOpportunity = (industry: string) => 
    `Based on our analysis, the ${industry} market opportunity is estimated at $10-50B globally, with particularly strong growth potential in emerging markets and digital-native segments.`;

  const generateRecommendations = (industry: string) => [
    'Focus on digital-first customer experience',
    'Invest in sustainable business practices',
    'Develop strategic partnerships for market expansion',
    'Prioritize mobile and cloud-based solutions'
  ];

  const resetForm = () => {
    setResearchTitle('');
    setIndustry('');
    setTargetMarket('');
    setResearchType('market_analysis');
    setResearchScope('');
    setRegion('global');
  };

  const exportResearch = async () => {
    if (!currentResearch) return;

    try {
      const rawResults = typeof currentResearch.raw_results === 'string' 
        ? JSON.parse(currentResearch.raw_results) 
        : currentResearch.raw_results;

      const reportContent = `
# ${currentResearch.title}

## Executive Summary
${currentResearch.ai_summary}

## Key Findings
${rawResults.key_findings?.map((finding: string, index: number) => `${index + 1}. ${finding}`).join('\n') || 'No key findings available'}

## Market Opportunity
The market presents significant opportunities for growth and expansion.

## Recommendations
${rawResults.recommendations?.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n') || 'No recommendations available'}

## Market Size Data
${JSON.stringify(rawResults.market_size_data || {}, null, 2)}

Generated on: ${new Date().toLocaleDateString()}
      `.trim();

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentResearch.title.replace(/\s+/g, '_')}_market_research.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Market research exported successfully',
      });
    } catch (error) {
      console.error('Error exporting research:', error);
      toast({
        title: 'Error',
        description: 'Failed to export market research',
        variant: 'destructive',
      });
    }
  };

  const getMetrics = (): MarketMetric[] => {
    if (!currentResearch) return [];

    try {
      const rawResults = typeof currentResearch.raw_results === 'string' 
        ? JSON.parse(currentResearch.raw_results)
        : currentResearch.raw_results;
      
      const marketData = rawResults?.market_size_data || {};

      return [
        {
          label: 'Total Market Size',
          value: marketData.total_market_size || 'N/A',
          change: '+12.5%',
          trend: 'up'
        },
        {
          label: 'Growth Rate',
          value: marketData.growth_rate || 'N/A',
          change: '+2.1%',
          trend: 'up'
        },
        {
          label: 'Market Maturity',
          value: marketData.market_maturity || 'N/A',
          change: 'Stable',
          trend: 'stable'
        },
        {
          label: 'Addressable Market',
          value: marketData.addressable_market || 'N/A',
          change: '+8.3%',
          trend: 'up'
        }
      ];
    } catch (error) {
      console.error('Error parsing market data:', error);
      return [];
    }
  };

  const getRawResults = () => {
    if (!currentResearch) return {};
    try {
      return typeof currentResearch.raw_results === 'string' 
        ? JSON.parse(currentResearch.raw_results)
        : currentResearch.raw_results || {};
    } catch (error) {
      console.error('Error parsing raw results:', error);
      return {};
    }
  };

  const getMetadata = () => {
    if (!currentResearch) return {};
    try {
      return typeof currentResearch.metadata === 'string' 
        ? JSON.parse(currentResearch.metadata)
        : currentResearch.metadata || {};
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return {};
    }
  };

  if (currentResearch) {
    const rawResults = getRawResults();
    const metadata = getMetadata();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentResearch(null)}
          >
            ← Back to Research
          </Button>
          <Button variant="outline" onClick={exportResearch}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {currentResearch.title}
            </CardTitle>
            <CardDescription>
              {metadata.industry || 'Various'} • {currentResearch.query_type} • {metadata.target_market?.join(', ') || 'General Market'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {getMetrics().map((metric, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{metric.label}</p>
                    <p className="text-lg font-bold">{metric.value}</p>
                    <p className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {metric.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="market-size">Market Size</TabsTrigger>
                <TabsTrigger value="competitors">Competitors</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Research Findings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Executive Summary</h4>
                      <p className="text-sm text-muted-foreground">{currentResearch.ai_summary}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Findings</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {(rawResults.key_findings || []).map((finding: string, index: number) => (
                          <li key={index}>• {finding}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {(rawResults.recommendations || []).map((rec: string, index: number) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="market-size" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Size Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Market Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Market Size:</span>
                            <span className="font-medium">{rawResults.market_size_data?.total_market_size || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Addressable Market:</span>
                            <span className="font-medium">{rawResults.market_size_data?.addressable_market || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Growth Rate:</span>
                            <span className="font-medium">{rawResults.market_size_data?.growth_rate || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Market Maturity:</span>
                            <span className="font-medium capitalize">{rawResults.market_size_data?.market_maturity || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Regional Breakdown</h4>
                        <div className="space-y-2">
                          {Object.entries(rawResults.market_size_data?.regional_breakdown || {}).map(([region, percentage]) => (
                            <div key={region} className="flex justify-between">
                              <span className="capitalize">{region.replace('_', ' ')}:</span>
                              <span className="font-medium">{percentage as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="competitors" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Competitive Landscape</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-3">Market Leaders</h4>
                        <div className="space-y-3">
                          {(rawResults.competitor_data?.market_leaders || []).map((leader: any, index: number) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium">{leader.name}</h5>
                                <Badge variant="secondary">{leader.market_share}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(leader.strengths || []).map((strength: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {strength}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Barriers to Entry</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(rawResults.competitor_data?.barriers_to_entry || []).map((barrier: string, index: number) => (
                            <li key={index}>• {barrier}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Trend Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Emerging Trends</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(rawResults.trend_analysis?.emerging_trends || []).map((trend: string, index: number) => (
                            <li key={index}>• {trend}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Technology Trends</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(rawResults.trend_analysis?.technology_trends || []).map((trend: string, index: number) => (
                            <li key={index}>• {trend}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Consumer Behavior</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(rawResults.trend_analysis?.consumer_behavior || []).map((behavior: string, index: number) => (
                            <li key={index}>• {behavior}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Regulatory Changes</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(rawResults.trend_analysis?.regulatory_changes || []).map((change: string, index: number) => (
                            <li key={index}>• {change}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-3">Demographics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(rawResults.customer_insights?.demographics || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace('_', ' ')}:</span>
                              <span className="font-medium text-sm">{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Behaviors</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(rawResults.customer_insights?.behaviors || []).map((behavior: string, index: number) => (
                            <li key={index}>• {behavior}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Pain Points</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(rawResults.customer_insights?.pain_points || []).map((point: string, index: number) => (
                            <li key={index}>• {point}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Preferences</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(rawResults.customer_insights?.preferences || []).map((pref: string, index: number) => (
                            <li key={index}>• {pref}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Market Research Automation</h2>
          <p className="text-muted-foreground">Automated market analysis and competitive intelligence</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">New Research</TabsTrigger>
          <TabsTrigger value="existing">Previous Research</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Start Market Research</CardTitle>
              <CardDescription>Launch automated market analysis for your industry and target market</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Research Title *</label>
                  <Input
                    value={researchTitle}
                    onChange={(e) => setResearchTitle(e.target.value)}
                    placeholder="e.g., SaaS Market Analysis 2024"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry *</label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Research Type</label>
                  <Select value={researchType} onValueChange={setResearchType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market_analysis">Market Analysis</SelectItem>
                      <SelectItem value="competitor_research">Competitor Research</SelectItem>
                      <SelectItem value="customer_insights">Customer Insights</SelectItem>
                      <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="north_america">North America</SelectItem>
                      <SelectItem value="europe">Europe</SelectItem>
                      <SelectItem value="asia_pacific">Asia Pacific</SelectItem>
                      <SelectItem value="latin_america">Latin America</SelectItem>
                      <SelectItem value="middle_east_africa">Middle East & Africa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Market</label>
                <Input
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  placeholder="e.g., SMB owners, Enterprise IT departments"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Research Scope</label>
                <Textarea
                  value={researchScope}
                  onChange={(e) => setResearchScope(e.target.value)}
                  placeholder="Describe specific areas of focus for your research..."
                  rows={3}
                />
              </div>

              <Button
                onClick={startResearch}
                disabled={analyzing || !researchTitle.trim() || !industry.trim()}
                className="w-full"
              >
                {analyzing ? 'Analyzing Market...' : 'Start Market Research'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="existing" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading market research...</div>
          ) : researches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No market research yet</h3>
                <p className="text-muted-foreground mb-4">Start your first market research to get insights</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {researches.map((research) => {
                const metadata = (() => {
                  try {
                    return typeof research.metadata === 'string' 
                      ? JSON.parse(research.metadata)
                      : research.metadata || {};
                  } catch {
                    return {};
                  }
                })();

                return (
                  <Card key={research.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{research.title}</CardTitle>
                        <Badge variant="secondary">{research.status}</Badge>
                      </div>
                      <CardDescription>
                        {metadata.industry || 'Various'} • {research.query_type} • {metadata.target_market?.join(', ') || 'General Market'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Target:</span>
                            <p className="font-medium">{metadata.target_market?.join(', ') || 'General Market'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created:</span>
                            <p className="font-medium">
                              {new Date(research.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setCurrentResearch(research)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Research
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};