import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Search, Filter, Download, RefreshCw, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Helmet } from 'react-helmet-async';
import { TrendAnalysisForm } from '@/components/trend-analysis/TrendAnalysisForm';

interface TrendData {
  id: string;
  category: string;
  trend: string;
  impact: 'high' | 'medium' | 'low';
  direction: 'up' | 'down' | 'stable';
  confidence: number;
  timeframe: string;
  source: string;
  description: string;
}

export const TrendAnalysisPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/market-research/trend-analysis` : '/market-research/trend-analysis';
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Trend Analysis",
    description: "Analyze emerging market trends and industry shifts with AI.",
    url: canonicalUrl
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiResults, setAiResults] = useState<string | null>(null);

  const [trends, setTrends] = useState<TrendData[]>([
    {
      id: '1',
      category: 'Technology',
      trend: 'AI-Powered Customer Service',
      impact: 'high',
      direction: 'up',
      confidence: 89,
      timeframe: '6-12 months',
      source: 'Industry Reports',
      description: 'Rapid adoption of AI chatbots and automation in customer service across industries'
    },
    {
      id: '2', 
      category: 'Consumer Behavior',
      trend: 'Sustainable Product Preference',
      impact: 'high',
      direction: 'up',
      confidence: 82,
      timeframe: '12-24 months',
      source: 'Market Research',
      description: 'Growing consumer demand for environmentally sustainable products and services'
    },
    {
      id: '3',
      category: 'Business Model',
      trend: 'Subscription-First Pricing',
      impact: 'medium',
      direction: 'up',
      confidence: 75,
      timeframe: '3-6 months',
      source: 'Competitive Analysis',
      description: 'Shift towards subscription and usage-based pricing models across sectors'
    },
    {
      id: '4',
      category: 'Technology',
      trend: 'Remote Work Infrastructure',
      impact: 'medium',
      direction: 'stable',
      confidence: 71,
      timeframe: 'Ongoing',
      source: 'Industry Surveys',
      description: 'Continued investment in remote work tools and infrastructure'
    }
  ]);

  const [trendChartData] = useState([
    { month: 'Jan', aiAdoption: 45, sustainability: 32, subscriptions: 28 },
    { month: 'Feb', aiAdoption: 52, sustainability: 38, subscriptions: 31 },
    { month: 'Mar', aiAdoption: 61, sustainability: 44, subscriptions: 35 },
    { month: 'Apr', aiAdoption: 68, sustainability: 51, subscriptions: 39 },
    { month: 'May', aiAdoption: 76, sustainability: 58, subscriptions: 43 },
    { month: 'Jun', aiAdoption: 82, sustainability: 64, subscriptions: 47 }
  ]);

  const [impactDistribution] = useState([
    { name: 'High Impact', value: 45, color: '#ef4444' },
    { name: 'Medium Impact', value: 35, color: '#f97316' },
    { name: 'Low Impact', value: 20, color: '#10b981' }
  ]);

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
              Please sign in to access trend analysis
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  const filteredTrends = trends.filter(trend => {
    const matchesCategory = selectedCategory === 'all' || trend.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = trend.trend.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trend.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const refreshTrends = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleAiAnalysisComplete = (results: string) => {
    setAiResults(results);
    setActiveTab('ai-analysis');
  };

  return (
    <>
      <Helmet>
        <title>Trend Analysis | Market Research</title>
        <meta name="description" content="Analyze emerging market trends, consumer behavior, and industry shifts." />
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
          
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Trend Analysis</h1>
              <p className="text-muted-foreground">
                Identify and analyze emerging market trends, consumer behaviors, and industry shifts
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Enhanced
              </Badge>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trends.length}</div>
              <p className="text-xs text-muted-foreground">Being monitored</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">High Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trends.filter(t => t.impact === 'high').length}</div>
              <p className="text-xs text-muted-foreground">Critical trends</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(trends.reduce((acc, t) => acc + t.confidence, 0) / trends.length)}%
              </div>
              <p className="text-xs text-muted-foreground">Data reliability</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(trends.map(t => t.category)).size}
              </div>
              <p className="text-xs text-muted-foreground">Trend categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview & Charts</TabsTrigger>
            <TabsTrigger value="ai-analysis">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="trends">Historical Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Trend Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trend Growth Over Time</CardTitle>
                  <CardDescription>
                    Monthly adoption rates for key trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="aiAdoption" stroke="#ef4444" strokeWidth={2} name="AI Adoption" />
                      <Line type="monotone" dataKey="sustainability" stroke="#10b981" strokeWidth={2} name="Sustainability" />
                      <Line type="monotone" dataKey="subscriptions" stroke="#3b82f6" strokeWidth={2} name="Subscriptions" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Impact Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of trends by potential impact level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={impactDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {impactDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-analysis" className="space-y-6">
            <TrendAnalysisForm onAnalysisComplete={handleAiAnalysisComplete} />
            
            {aiResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm">{aiResults}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">

            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Trends</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by trend name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="consumer behavior">Consumer Behavior</SelectItem>
                        <SelectItem value="business model">Business Model</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={refreshTrends} disabled={isAnalyzing}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trends List */}
            <div className="space-y-4">
          {filteredTrends.map((trend) => (
            <Card key={trend.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getDirectionIcon(trend.direction)}
                      <CardTitle className="text-lg">{trend.trend}</CardTitle>
                      <Badge className={getImpactColor(trend.impact)}>
                        {trend.impact} impact
                      </Badge>
                    </div>
                    <CardDescription>{trend.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Confidence</div>
                    <div className="text-lg font-bold">{trend.confidence}%</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-6 text-sm text-muted-foreground">
                    <span><strong>Category:</strong> {trend.category}</span>
                    <span><strong>Timeframe:</strong> {trend.timeframe}</span>
                    <span><strong>Source:</strong> {trend.source}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                <Progress value={trend.confidence} className="mt-3 h-2" />
              </CardContent>
            </Card>
              ))}
            </div>

            {filteredTrends.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Trends Found</h3>
                  <p className="text-muted-foreground">
                    No trends match your current filters. Try adjusting your search or category filter.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
};

export default TrendAnalysisPage;