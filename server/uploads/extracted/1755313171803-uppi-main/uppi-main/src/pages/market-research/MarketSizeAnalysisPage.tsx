import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Globe, Calculator, Download, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

export const MarketSizeAnalysisPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  // SEO: canonical URL and structured data for Market Size Analysis
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/market-research/market-size` : '/market-research/market-size';
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Market Size Analysis",
    description: "Calculate TAM, SAM, SOM with AI-powered market insights.",
    url: canonicalUrl
  };

  const [analysisForm, setAnalysisForm] = useState({
    industry: '',
    targetMarket: '',
    geography: 'global',
    businessModel: '',
    customerSegment: '',
    pricePoint: '',
    customData: ''
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access market size analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAnalysis = async () => {
    if (!analysisForm.industry || !analysisForm.targetMarket) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in industry and target market fields',
        variant: 'destructive'
      });
      return;
    }

    setAnalyzing(true);
    
    // Simulate analysis with mock data
    setTimeout(() => {
      setResults({
        tam: '50.2B',
        sam: '8.7B', 
        som: '432M',
        cagr: '12.4%',
        keyMetrics: {
          marketPenetration: '2.3%',
          competitorCount: 142,
          avgDealSize: '$25,000',
          customerAcquisitionCost: '$1,200'
        },
        segments: [
          { name: 'Enterprise', size: '65%', growth: '8.2%' },
          { name: 'SMB', size: '25%', growth: '15.6%' },
          { name: 'Startup', size: '10%', growth: '22.1%' }
        ],
        geography: [
          { region: 'North America', share: '45%', growth: '8.5%' },
          { region: 'Europe', share: '28%', growth: '11.2%' },
          { region: 'Asia Pacific', share: '22%', growth: '18.7%' },
          { region: 'Other', share: '5%', growth: '15.3%' }
        ]
      });
      setAnalyzing(false);
      
      toast({
        title: 'Analysis Complete',
        description: 'Market size analysis has been generated successfully'
      });
    }, 3000);
  };

  return (
    <>
      <Helmet>
        <title>Market Size Analysis (TAM/SAM/SOM) | AI</title>
        <meta name="description" content="Calculate TAM, SAM, and SOM with AI-powered market analysis." />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/market-research')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Market Research
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Market Size Analysis</h1>
            <p className="text-muted-foreground">
              Calculate Total Addressable Market (TAM), Serviceable Available Market (SAM), and Serviceable Obtainable Market (SOM)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Analysis Parameters
                </CardTitle>
                <CardDescription>
                  Provide details about your market and business model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Input
                    id="industry"
                    value={analysisForm.industry}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., SaaS, Healthcare, E-commerce"
                  />
                </div>

                <div>
                  <Label htmlFor="targetMarket">Target Market *</Label>
                  <Textarea
                    id="targetMarket"
                    value={analysisForm.targetMarket}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, targetMarket: e.target.value }))}
                    placeholder="Describe your ideal customer and market segment"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="geography">Geographic Scope</Label>
                  <Select value={analysisForm.geography} onValueChange={(value) => setAnalysisForm(prev => ({ ...prev, geography: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="north-america">North America</SelectItem>
                      <SelectItem value="europe">Europe</SelectItem>
                      <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                      <SelectItem value="specific-country">Specific Country</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="businessModel">Business Model</Label>
                  <Input
                    id="businessModel"
                    value={analysisForm.businessModel}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, businessModel: e.target.value }))}
                    placeholder="e.g., Subscription, Marketplace, B2B SaaS"
                  />
                </div>

                <div>
                  <Label htmlFor="pricePoint">Average Price Point</Label>
                  <Input
                    id="pricePoint"
                    value={analysisForm.pricePoint}
                    onChange={(e) => setAnalysisForm(prev => ({ ...prev, pricePoint: e.target.value }))}
                    placeholder="e.g., $99/month, $10,000 one-time"
                  />
                </div>

                <Button 
                  onClick={handleAnalysis} 
                  disabled={analyzing || !analysisForm.industry || !analysisForm.targetMarket}
                  className="w-full"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing Market...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {analyzing && (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <h3 className="text-lg font-semibold">Analyzing Market Data</h3>
                    <p className="text-muted-foreground">
                      Our AI is processing industry data, market trends, and competitive landscape...
                    </p>
                    <Progress value={33} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {results && !analyzing && (
              <div className="space-y-6">
                {/* TAM/SAM/SOM Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">TAM</CardTitle>
                      <CardDescription>Total Addressable Market</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">${results.tam}</div>
                      <p className="text-xs text-muted-foreground">Global market size</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">SAM</CardTitle>
                      <CardDescription>Serviceable Available Market</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">${results.sam}</div>
                      <p className="text-xs text-muted-foreground">Addressable by your solution</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">SOM</CardTitle>
                      <CardDescription>Serviceable Obtainable Market</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">${results.som}</div>
                      <p className="text-xs text-muted-foreground">Realistically obtainable</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Market Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{results.cagr}</div>
                        <p className="text-sm text-muted-foreground">Market CAGR</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{results.keyMetrics.competitorCount}</div>
                        <p className="text-sm text-muted-foreground">Competitors</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{results.keyMetrics.avgDealSize}</div>
                        <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{results.keyMetrics.customerAcquisitionCost}</div>
                        <p className="text-sm text-muted-foreground">Customer CAC</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Export Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Export Analysis</CardTitle>
                    <CardDescription>
                      Download your market size analysis in different formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        PDF Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Excel Data
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        PowerPoint
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!results && !analyzing && (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Analyze Your Market</h3>
                  <p className="text-muted-foreground">
                    Fill in the form on the left to generate a comprehensive market size analysis with TAM, SAM, and SOM calculations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default MarketSizeAnalysisPage;