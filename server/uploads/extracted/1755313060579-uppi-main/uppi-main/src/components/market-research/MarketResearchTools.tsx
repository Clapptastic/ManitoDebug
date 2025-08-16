import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Search, TrendingUp, Users, Target, BarChart3, 
  Calculator, DollarSign, Globe, Lightbulb, 
  PieChart as PieChartIcon, LineChart as LineChartIcon, Brain, Zap, RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MarketSizeData {
  segment: string;
  size: number;
  growth: number;
  color: string;
}

interface CompetitorData {
  name: string;
  marketShare: number;
  revenue: number;
  strengths: string[];
  weaknesses: string[];
}

interface PricingStrategy {
  tier: string;
  price: number;
  features: string[];
  target: string;
}

interface ValidationResult {
  aspect: string;
  score: number;
  feedback: string;
  recommendations: string[];
}

const MarketResearchTools: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('market-size');
  const [loading, setLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { toast } = useToast();

  // Form states
  const [marketSizeForm, setMarketSizeForm] = useState({
    industry: '',
    region: 'global',
    targetSegment: ''
  });

  const [validationForm, setValidationForm] = useState({
    businessIdea: '',
    targetMarket: '',
    valueProposition: '',
    competitors: ''
  });

  const [pricingForm, setPricingForm] = useState({
    productType: '',
    targetMarket: '',
    costStructure: '',
    competitorPricing: ''
  });

  // Data states
  const [marketSizeData, setMarketSizeData] = useState<MarketSizeData[]>([]);
  const [competitorData, setCompetitorData] = useState<CompetitorData[]>([]);
  const [pricingStrategies, setPricingStrategies] = useState<PricingStrategy[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

  const analyzeMarketSize = async () => {
    if (!marketSizeForm.industry) {
      toast({
        title: 'Missing Information',
        description: 'Please enter an industry to analyze',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Simulate API call to market research services
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate market size data based on industry
      const segments = generateMarketSegments(marketSizeForm.industry);
      setMarketSizeData(segments);

      setAnalysisProgress(100);
      toast({
        title: 'Analysis Complete',
        description: `Market size analysis completed for ${marketSizeForm.industry}`
      });
    } catch (error) {
      console.error('Error analyzing market size:', error);
      toast({
        title: 'Analysis Error',
        description: 'Failed to complete market size analysis',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
    }
  };

  const validateBusinessIdea = async () => {
    if (!validationForm.businessIdea) {
      toast({
        title: 'Missing Information',
        description: 'Please describe your business idea',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setAnalysisProgress(0);

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 8, 90));
    }, 150);

    try {
      await new Promise(resolve => setTimeout(resolve, 2500));

      const validation = generateValidationResults(validationForm);
      setValidationResults(validation);

      setAnalysisProgress(100);
      toast({
        title: 'Validation Complete',
        description: 'Business idea validation analysis completed'
      });
    } catch (error) {
      console.error('Error validating business idea:', error);
      toast({
        title: 'Validation Error',
        description: 'Failed to validate business idea',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
    }
  };

  const analyzePricingStrategy = async () => {
    if (!pricingForm.productType) {
      toast({
        title: 'Missing Information',
        description: 'Please specify your product type',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setAnalysisProgress(0);

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 12, 90));
    }, 180);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const strategies = generatePricingStrategies(pricingForm);
      setPricingStrategies(strategies);

      setAnalysisProgress(100);
      toast({
        title: 'Analysis Complete',
        description: 'Pricing strategy analysis completed'
      });
    } catch (error) {
      console.error('Error analyzing pricing strategy:', error);
      toast({
        title: 'Analysis Error',
        description: 'Failed to analyze pricing strategy',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      clearInterval(progressInterval);
    }
  };

  const generateMarketSegments = (industry: string): MarketSizeData[] => {
    const baseSize = industry.toLowerCase().includes('ai') ? 50000 : 
                    industry.toLowerCase().includes('health') ? 80000 :
                    industry.toLowerCase().includes('fintech') ? 60000 : 30000;

    return [
      { segment: 'Primary Market', size: baseSize, growth: 15, color: '#3b82f6' },
      { segment: 'Secondary Market', size: baseSize * 0.7, growth: 12, color: '#22c55e' },
      { segment: 'Adjacent Markets', size: baseSize * 0.4, growth: 8, color: '#f59e0b' },
      { segment: 'Emerging Segments', size: baseSize * 0.2, growth: 25, color: '#ef4444' }
    ];
  };

  const generateValidationResults = (form: any): ValidationResult[] => {
    return [
      {
        aspect: 'Market Demand',
        score: 85,
        feedback: 'Strong demand indicators identified',
        recommendations: [
          'Conduct customer interviews to validate assumptions',
          'Create an MVP to test market response',
          'Analyze search volume trends for key terms'
        ]
      },
      {
        aspect: 'Competitive Landscape',
        score: 72,
        feedback: 'Moderate competition with differentiation opportunities',
        recommendations: [
          'Identify unique value propositions',
          'Analyze competitor weaknesses',
          'Focus on underserved market segments'
        ]
      },
      {
        aspect: 'Technical Feasibility',
        score: 90,
        feedback: 'Highly feasible with current technology',
        recommendations: [
          'Prototype core features quickly',
          'Identify potential technical partnerships',
          'Plan for scalability from the start'
        ]
      },
      {
        aspect: 'Business Model Viability',
        score: 78,
        feedback: 'Solid foundation with room for optimization',
        recommendations: [
          'Test multiple revenue streams',
          'Validate pricing assumptions',
          'Model unit economics carefully'
        ]
      }
    ];
  };

  const generatePricingStrategies = (form: any): PricingStrategy[] => {
    return [
      {
        tier: 'Freemium',
        price: 0,
        features: ['Basic features', 'Limited usage', 'Community support'],
        target: 'Individual users, trial customers'
      },
      {
        tier: 'Professional',
        price: 29,
        features: ['Full feature access', 'Priority support', 'Advanced analytics'],
        target: 'Small businesses, power users'
      },
      {
        tier: 'Enterprise',
        price: 99,
        features: ['Custom integrations', 'Dedicated support', 'White-label options'],
        target: 'Large organizations, resellers'
      }
    ];
  };

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Market Research Tools</h2>
          <p className="text-muted-foreground">Validate your business ideas with data-driven insights</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Analysis
        </Button>
      </div>

      {/* Progress Indicator */}
      {loading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Brain className="h-5 w-5 animate-pulse text-blue-500" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>Analyzing market data...</span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Tools Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="market-size">Market Size</TabsTrigger>
          <TabsTrigger value="validation">Idea Validation</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Strategy</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
        </TabsList>

        {/* Market Size Analysis */}
        <TabsContent value="market-size" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Market Size Calculator</CardTitle>
                <CardDescription>Analyze total addressable market (TAM) for your industry</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={marketSizeForm.industry}
                    onChange={(e) => setMarketSizeForm({ ...marketSizeForm, industry: e.target.value })}
                    placeholder="e.g., AI-powered SaaS, HealthTech, FinTech"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select 
                    value={marketSizeForm.region} 
                    onValueChange={(value) => setMarketSizeForm({ ...marketSizeForm, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="north-america">North America</SelectItem>
                      <SelectItem value="europe">Europe</SelectItem>
                      <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target-segment">Target Segment</Label>
                  <Input
                    id="target-segment"
                    value={marketSizeForm.targetSegment}
                    onChange={(e) => setMarketSizeForm({ ...marketSizeForm, targetSegment: e.target.value })}
                    placeholder="Specific customer segment or use case"
                  />
                </div>
                <Button onClick={analyzeMarketSize} disabled={loading} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Market Size
                </Button>
              </CardContent>
            </Card>

            {marketSizeData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Market Segments</CardTitle>
                  <CardDescription>Total Addressable Market breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={marketSizeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="size"
                        nameKey="segment"
                      >
                        {marketSizeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`$${value}M`, 'Market Size']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {marketSizeData.map((segment) => (
                      <div key={segment.segment} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: segment.color }}
                          />
                          <span className="text-sm">{segment.segment}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">${segment.size}M</div>
                          <div className="text-xs text-green-600">+{segment.growth}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Idea Validation */}
        <TabsContent value="validation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Business Idea Validation</CardTitle>
                <CardDescription>Get AI-powered feedback on your business concept</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="business-idea">Business Idea</Label>
                  <Textarea
                    id="business-idea"
                    value={validationForm.businessIdea}
                    onChange={(e) => setValidationForm({ ...validationForm, businessIdea: e.target.value })}
                    placeholder="Describe your business idea in detail..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="target-market">Target Market</Label>
                  <Input
                    id="target-market"
                    value={validationForm.targetMarket}
                    onChange={(e) => setValidationForm({ ...validationForm, targetMarket: e.target.value })}
                    placeholder="Who are your ideal customers?"
                  />
                </div>
                <div>
                  <Label htmlFor="value-proposition">Value Proposition</Label>
                  <Input
                    id="value-proposition"
                    value={validationForm.valueProposition}
                    onChange={(e) => setValidationForm({ ...validationForm, valueProposition: e.target.value })}
                    placeholder="What unique value do you provide?"
                  />
                </div>
                <Button onClick={validateBusinessIdea} disabled={loading} className="w-full">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Validate Idea
                </Button>
              </CardContent>
            </Card>

            {validationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Validation Results</CardTitle>
                  <CardDescription>AI-powered assessment of your business idea</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {validationResults.map((result) => (
                      <div key={result.aspect} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.aspect}</span>
                          <Badge 
                            variant={result.score > 80 ? 'default' : result.score > 60 ? 'secondary' : 'destructive'}
                          >
                            {result.score}/100
                          </Badge>
                        </div>
                        <Progress value={result.score} className="h-2" />
                        <p className="text-sm text-muted-foreground">{result.feedback}</p>
                        <div className="ml-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Recommendations:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {result.recommendations.map((rec, index) => (
                              <li key={index}>• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Pricing Strategy */}
        <TabsContent value="pricing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Strategy Analyzer</CardTitle>
                <CardDescription>Optimize your pricing for maximum revenue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-type">Product Type</Label>
                  <Select 
                    value={pricingForm.productType} 
                    onValueChange={(value) => setPricingForm({ ...pricingForm, productType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saas">SaaS Platform</SelectItem>
                      <SelectItem value="mobile-app">Mobile App</SelectItem>
                      <SelectItem value="consulting">Consulting Service</SelectItem>
                      <SelectItem value="physical-product">Physical Product</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target-market-pricing">Target Market</Label>
                  <Input
                    id="target-market-pricing"
                    value={pricingForm.targetMarket}
                    onChange={(e) => setPricingForm({ ...pricingForm, targetMarket: e.target.value })}
                    placeholder="B2B, B2C, Enterprise, SMB, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="cost-structure">Cost Structure</Label>
                  <Input
                    id="cost-structure"
                    value={pricingForm.costStructure}
                    onChange={(e) => setPricingForm({ ...pricingForm, costStructure: e.target.value })}
                    placeholder="Fixed costs, variable costs, etc."
                  />
                </div>
                <Button onClick={analyzePricingStrategy} disabled={loading} className="w-full">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Analyze Pricing
                </Button>
              </CardContent>
            </Card>

            {pricingStrategies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Pricing Tiers</CardTitle>
                  <CardDescription>Optimized pricing strategy for your market</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pricingStrategies.map((strategy) => (
                      <div key={strategy.tier} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{strategy.tier}</h4>
                          <div className="text-lg font-bold">
                            {strategy.price === 0 ? 'Free' : `$${strategy.price}/mo`}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{strategy.target}</p>
                        <ul className="text-sm space-y-1">
                          {strategy.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1 h-1 bg-blue-500 rounded-full mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Competitive Analysis */}
        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Landscape</CardTitle>
              <CardDescription>Analyze your competition and find market opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Competitive Analysis</h3>
                <p className="text-muted-foreground mb-4">
                  This feature integrates with the existing competitor analysis system
                </p>
                <Button onClick={() => navigate('/market-research/competitor-analysis')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Go to Competitor Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketResearchTools;