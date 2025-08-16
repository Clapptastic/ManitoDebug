/**
 * ARCHIVED LEGACY FILE
 * This CompetitorDetailsPage belongs to the old Market Validation flow.
 * It has been superseded by:
 * - Page: src/pages/AnalysisDetailPage.tsx
 * - Component: src/components/competitor-analysis/enhanced/EnhancedAnalysisDetailView.tsx
 * Route: /market-research/competitor-analysis/details/:analysisId
 *
 * Kept here for reference only. Do not import this file in production code.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Calendar,
  Globe,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Award,
  BarChart3,
  DollarSign,
  Lightbulb,
  Network,
  FileText,
  RefreshCw,
  Download,
  ExternalLink,
  Star,
  Clock,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MarketSentimentAnalyzer } from '@/components/competitor-analysis/market-sentiment/MarketSentimentAnalyzer';

interface CompetitorAnalysis {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Company Information
  website_url?: string;
  industry?: string;
  headquarters?: string;
  founded_year?: number;
  employee_count?: number;
  business_model?: string;
  
  // SWOT Analysis
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  
  // Market & Strategy
  market_position?: string;
  target_market?: string[];
  customer_segments?: string[];
  geographic_presence?: string[];
  market_share_estimate?: number;
  market_trends?: string[];
  
  // Competitive Analysis
  competitive_advantages?: string[];
  competitive_disadvantages?: string[];
  overall_threat_level?: string;
  
  // Financial & Business Data
  revenue_estimate?: number;
  pricing_strategy?: any;
  funding_info?: any;
  financial_metrics?: any;
  product_portfolio?: any;
  
  // Technology & Innovation
  technology_analysis?: any;
  patent_count?: number;
  certification_standards?: string[];
  innovation_score?: number;
  
  // Social & Governance
  environmental_social_governance?: any;
  social_media_presence?: any;
  key_personnel?: any;
  partnerships?: string[];
  
  // Scores & Analytics
  data_quality_score?: number;
  data_completeness_score?: number;
  brand_strength_score?: number;
  operational_efficiency_score?: number;
  market_sentiment_score?: number;
  confidence_scores?: any;
  source_citations?: any;
  analysis_data?: any;
}

const CompetitorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching analysis:', error);
        toast({
          title: 'Error',
          description: 'Failed to load competitor analysis',
          variant: 'destructive'
        });
        return;
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!analysis) return;
    
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('competitor-analysis', {
        body: {
          action: 'start', // Explicit action to avoid 400s
          competitors: [analysis.name],
          sessionId: `refresh-${Date.now()}`,
          analysisId: analysis.id
        }
      });

      if (error) throw error;

      toast({
        title: 'Analysis Refreshed',
        description: 'Competitor data has been updated with the latest information',
      });

      // Refetch the updated data
      await fetchAnalysis();
    } catch (error: any) {
      toast({
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh analysis',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact'
    }).format(amount);
  };

  const formatEmployeeCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'analyzing': 'bg-blue-100 text-blue-800',
      'failed': 'bg-red-100 text-red-800',
      'error': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getThreatLevelColor = (level: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading competitor analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Analysis Not Found</h1>
          <p className="text-muted-foreground">The requested competitor analysis could not be found.</p>
          <Button onClick={() => navigate('/competitor-analysis')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analysis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/competitor-analysis')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                {analysis.name}
              </h1>
              <p className="text-muted-foreground">
                {analysis.description || 'Detailed competitor analysis'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(analysis.status)}>
            {analysis.status}
          </Badge>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analysis.data_quality_score && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Data Quality</p>
                  <p className="text-2xl font-bold">{Math.round(analysis.data_quality_score)}%</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        )}
        
        {analysis.market_share_estimate !== undefined && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Market Share</p>
                  <p className="text-2xl font-bold">{analysis.market_share_estimate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        )}
        
        {analysis.employee_count && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="text-2xl font-bold">{formatEmployeeCount(analysis.employee_count)}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        )}
        
        {analysis.revenue_estimate && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Est.</p>
                  <p className="text-2xl font-bold">{formatCurrency(analysis.revenue_estimate)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
          <TabsTrigger value="market">Market Position</TabsTrigger>
          <TabsTrigger value="sentiment">Market Sentiment</TabsTrigger>
          <TabsTrigger value="business">Business Data</TabsTrigger>
          <TabsTrigger value="scores">Scores & Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.industry && (
                  <div>
                    <p className="text-sm font-medium">Industry</p>
                    <p className="text-muted-foreground">{analysis.industry}</p>
                  </div>
                )}
                
                {analysis.headquarters && (
                  <div>
                    <p className="text-sm font-medium">Headquarters</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {analysis.headquarters}
                    </p>
                  </div>
                )}
                
                {analysis.founded_year && (
                  <div>
                    <p className="text-sm font-medium">Founded</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {analysis.founded_year}
                    </p>
                  </div>
                )}
                
                {analysis.website_url && (
                  <div>
                    <p className="text-sm font-medium">Website</p>
                    <a 
                      href={analysis.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      {analysis.website_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                
                {analysis.business_model && (
                  <div>
                    <p className="text-sm font-medium">Business Model</p>
                    <p className="text-muted-foreground">{analysis.business_model}</p>
                  </div>
                )}
                
                {analysis.market_position && (
                  <div>
                    <p className="text-sm font-medium">Market Position</p>
                    <Badge variant="outline">{analysis.market_position}</Badge>
                  </div>
                )}
                
                {analysis.overall_threat_level && (
                  <div>
                    <p className="text-sm font-medium">Threat Level</p>
                    <Badge className={getThreatLevelColor(analysis.overall_threat_level)}>
                      {analysis.overall_threat_level}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick SWOT Summary */}
            <Card>
              <CardHeader>
                <CardTitle>SWOT Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Top Strengths
                    </p>
                    <ul className="space-y-1">
                      {analysis.strengths.slice(0, 3).map((strength, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Key Weaknesses
                    </p>
                    <ul className="space-y-1">
                      {analysis.weaknesses.slice(0, 3).map((weakness, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Geographic Presence & Target Markets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.geographic_presence && analysis.geographic_presence.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Geographic Presence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.geographic_presence.map((location, index) => (
                      <Badge key={index} variant="secondary">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {analysis.target_market && analysis.target_market.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Target Markets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.target_market.map((market, index) => (
                      <Badge key={index} variant="outline">
                        {market}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* SWOT Analysis Tab */}
        <TabsContent value="swot" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No strengths data available</p>
                )}
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No weaknesses data available</p>
                )}
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.opportunities && analysis.opportunities.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.opportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-sm">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No opportunities data available</p>
                )}
              </CardContent>
            </Card>

            {/* Threats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.threats && analysis.threats.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.threats.map((threat, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span className="text-sm">{threat}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No threats data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Market Position Tab */}
        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competitive Advantages */}
            {analysis.competitive_advantages && analysis.competitive_advantages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Competitive Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.competitive_advantages.map((advantage, index) => (
                      <Badge key={index} variant="default">
                        {advantage}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Segments */}
            {analysis.customer_segments && analysis.customer_segments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer Segments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.customer_segments.map((segment, index) => (
                      <Badge key={index} variant="secondary">
                        {segment}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Trends */}
            {analysis.market_trends && analysis.market_trends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.market_trends.map((trend, index) => (
                      <li key={index} className="text-sm">
                        • {trend}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Partnerships */}
            {analysis.partnerships && analysis.partnerships.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Key Partnerships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.partnerships.map((partner, index) => (
                      <Badge key={index} variant="outline">
                        {partner}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Market Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          <MarketSentimentAnalyzer
            competitorId={analysis.id}
            competitorName={analysis.name}
            currentScore={analysis.market_sentiment_score}
            onSentimentUpdate={(newScore) => {
              setAnalysis(prev => prev ? { ...prev, market_sentiment_score: newScore } : null);
            }}
          />
        </TabsContent>

        {/* Business Data Tab */}
        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Information */}
            {(analysis.revenue_estimate || analysis.funding_info || analysis.financial_metrics) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.revenue_estimate && (
                    <div>
                      <p className="text-sm font-medium">Revenue Estimate</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(analysis.revenue_estimate)}
                      </p>
                    </div>
                  )}
                  
                  {analysis.funding_info && typeof analysis.funding_info === 'object' && (
                    <div>
                      <p className="text-sm font-medium">Funding Information</p>
                      <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                        {JSON.stringify(analysis.funding_info, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {analysis.financial_metrics && typeof analysis.financial_metrics === 'object' && (
                    <div>
                      <p className="text-sm font-medium">Financial Metrics</p>
                      <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                        {JSON.stringify(analysis.financial_metrics, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Technology & Innovation */}
            {(analysis.technology_analysis || analysis.patent_count || analysis.innovation_score) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Technology & Innovation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.innovation_score && (
                    <div>
                      <p className="text-sm font-medium">Innovation Score</p>
                      <p className="text-lg font-semibold">{analysis.innovation_score}/100</p>
                    </div>
                  )}
                  
                  {analysis.patent_count && (
                    <div>
                      <p className="text-sm font-medium">Patent Count</p>
                      <p className="text-lg font-semibold">{analysis.patent_count}</p>
                    </div>
                  )}
                  
                  {analysis.certification_standards && analysis.certification_standards.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Certifications</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.certification_standards.map((cert, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.technology_analysis && typeof analysis.technology_analysis === 'object' && (
                    <div>
                      <p className="text-sm font-medium">Technology Analysis</p>
                      <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                        {JSON.stringify(analysis.technology_analysis, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Product Portfolio */}
            {analysis.product_portfolio && typeof analysis.product_portfolio === 'object' && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                    {JSON.stringify(analysis.product_portfolio, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Key Personnel */}
            {analysis.key_personnel && typeof analysis.key_personnel === 'object' && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Personnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                    {JSON.stringify(analysis.key_personnel, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Scores & Metrics Tab */}
        <TabsContent value="scores" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analysis.data_quality_score && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Quality Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(analysis.data_quality_score)}%
                  </div>
                </CardContent>
              </Card>
            )}
            
            {analysis.data_completeness_score && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Completeness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(analysis.data_completeness_score)}%
                  </div>
                </CardContent>
              </Card>
            )}
            
            {analysis.brand_strength_score && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Brand Strength</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(analysis.brand_strength_score)}%
                  </div>
                </CardContent>
              </Card>
            )}
            
            {analysis.operational_efficiency_score && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Operational Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(analysis.operational_efficiency_score)}%
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Market Sentiment - Enhanced with full analyzer */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Market Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-4">
                  {Math.round(analysis.market_sentiment_score || 0)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Overall market perception and sentiment score
                </p>
              </CardContent>
            </Card>

            {/* Confidence Scores */}
            {analysis.confidence_scores && typeof analysis.confidence_scores === 'object' && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Confidence Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                    {JSON.stringify(analysis.confidence_scores, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Source Citations */}
          {analysis.source_citations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Data Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                  {JSON.stringify(analysis.source_citations, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Analysis Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Analysis Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">
                    {new Date(analysis.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">
                    {new Date(analysis.updated_at).toLocaleString()}
                  </p>
                </div>
                {analysis.completed_at && (
                  <div>
                    <p className="font-medium">Completed</p>
                    <p className="text-muted-foreground">
                      {new Date(analysis.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitorDetailsPage;