import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  AlertTriangle, 
  Users, 
  Globe, 
  Building2, 
  Calendar, 
  DollarSign, 
  Zap, 
  Award, 
  BarChart3, 
  PieChart, 
  Activity,
  Eye,
  ExternalLink,
  Download,
  Share2,
  Sparkles,
  MapPin,
  Factory,
  Briefcase,
  Heart,
  Brain,
  ChevronRight,
  Info
} from 'lucide-react';
import { CompetitorAnalysis } from '@/types/competitor/unified-types';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface CompetitorInsightsHubProps {
  analysis: CompetitorAnalysis;
}

export const CompetitorInsightsHub: React.FC<CompetitorInsightsHubProps> = ({ analysis }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getThreatLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value}`;
  };

  const getScoreCalculationExplanation = (scoreType: string) => {
    const lowerType = scoreType.toLowerCase();
    
    if (lowerType.includes('innovation')) {
      return "Innovation Score: Calculated based on R&D investment, patent filings, technology adoption speed, product launch frequency, and industry recognition. Scores 80-100: High innovation, 60-79: Moderate innovation, <60: Low innovation.";
    }
    if (lowerType.includes('brand strength')) {
      return "Brand Strength Score: Evaluated using market share, customer loyalty metrics, brand recognition surveys, social media presence, and market positioning. Weighted by industry reputation and competitive differentiation.";
    }
    if (lowerType.includes('operational efficiency')) {
      return "Operational Efficiency Score: Calculated from revenue per employee, process automation level, cost structure optimization, and resource utilization metrics compared to industry benchmarks.";
    }
    if (lowerType.includes('market sentiment')) {
      return "Market Sentiment Score: Aggregated from customer reviews, analyst ratings, social media sentiment, press coverage tone, and investor confidence indicators. Reflects overall market perception.";
    }
    if (lowerType.includes('data quality')) {
      return "Data Quality Score: Measures the reliability and completeness of analysis data. Based on source credibility, data freshness, cross-validation across multiple sources, and confidence levels from AI providers.";
    }
    return null;
  };

  const exportReport = () => {
    // Implement export functionality
    console.log('Exporting report for:', analysis.name);
  };

  const shareReport = () => {
    // Implement sharing functionality
    console.log('Sharing report for:', analysis.name);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-border/50 p-8">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-2 w-2 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {analysis.name}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {analysis.industry} • {analysis.headquarters}
                  </p>
                </div>
              </div>
              
              <p className="text-muted-foreground max-w-2xl">
                {analysis.description || `Comprehensive competitive analysis of ${analysis.name}`}
              </p>
              
              {analysis.website_url && (
                <Button variant="outline" size="sm" asChild className="w-fit">
                  <a href={analysis.website_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={shareReport} className="hover-scale">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={exportReport} className="hover-scale">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {analysis.overall_threat_level && (
              <div className="text-center p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30">
                <Badge variant={getThreatLevelColor(analysis.overall_threat_level)} className="mb-2">
                  <Shield className="h-3 w-3 mr-1" />
                  {analysis.overall_threat_level} Threat
                </Badge>
                <p className="text-xs text-muted-foreground">Competitive Threat</p>
              </div>
            )}
            
            {analysis.market_share_estimate && (
              <div className="text-center p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30">
                <p className="text-2xl font-bold text-primary">{analysis.market_share_estimate}%</p>
                <p className="text-xs text-muted-foreground">Market Share</p>
              </div>
            )}
            
            {analysis.employee_count && (
              <div className="text-center p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30">
                <p className="text-2xl font-bold text-primary">{analysis.employee_count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Employees</p>
              </div>
            )}
            
            {analysis.data_quality_score && (
              <div className="text-center p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30">
                <p className={`text-2xl font-bold ${getScoreColor(analysis.data_quality_score)}`}>
                  {analysis.data_quality_score}/100
                </p>
                <p className="text-xs text-muted-foreground">Data Quality</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full translate-x-16 -translate-y-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 h-24 w-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full -translate-x-12 translate-y-12 blur-xl"></div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-8 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Eye className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="swot" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Target className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">SWOT</span>
          </TabsTrigger>
          <TabsTrigger value="competitive" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Shield className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Competitive</span>
          </TabsTrigger>
          <TabsTrigger value="market" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Globe className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Market</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <DollarSign className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Financial</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Briefcase className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="scores" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <BarChart3 className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Scores</span>
          </TabsTrigger>
          <TabsTrigger value="metadata" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Info className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Meta</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Details */}
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary" />
                  Company Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {analysis.founded_year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Founded:</span>
                      <span>{analysis.founded_year}</span>
                    </div>
                  )}
                  {analysis.headquarters && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">HQ:</span>
                      <span>{analysis.headquarters}</span>
                    </div>
                  )}
                  {analysis.industry && (
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Industry:</span>
                      <span>{analysis.industry}</span>
                    </div>
                  )}
                  {analysis.business_model && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Model:</span>
                      <span>{analysis.business_model}</span>
                    </div>
                  )}
                </div>
                
                {analysis.description && (
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.revenue_estimate && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Revenue</span>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatCurrency(analysis.revenue_estimate)}
                      </span>
                    </div>
                  )}
                  
                  {analysis.market_position && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Position</span>
                      </div>
                      <Badge variant="outline">{analysis.market_position}</Badge>
                    </div>
                  )}
                  
                  {analysis.patent_count && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Patents</span>
                      </div>
                      <span className="font-bold">{analysis.patent_count}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SWOT Analysis Tab */}
        <TabsContent value="swot" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            {analysis.strengths && analysis.strengths.length > 0 && (
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-50/30 hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Strengths
                    <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                      {analysis.strengths.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {analysis.strengths.map((strength, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                          <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></div>
                          <p className="text-sm text-green-800 font-medium leading-relaxed">{strength}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Weaknesses */}
            {analysis.weaknesses && analysis.weaknesses.length > 0 && (
              <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-50/30 hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-700">
                    <TrendingDown className="h-5 w-5 mr-2" />
                    Weaknesses
                    <Badge variant="secondary" className="ml-auto bg-red-100 text-red-700">
                      {analysis.weaknesses.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {analysis.weaknesses.map((weakness, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                          <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500 flex-shrink-0"></div>
                          <p className="text-sm text-red-800 font-medium leading-relaxed">{weakness}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Opportunities */}
            {analysis.opportunities && analysis.opportunities.length > 0 && (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/30 hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700">
                    <Zap className="h-5 w-5 mr-2" />
                    Opportunities
                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                      {analysis.opportunities.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {analysis.opportunities.map((opportunity, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                          <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <p className="text-sm text-blue-800 font-medium leading-relaxed">{opportunity}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Threats */}
            {analysis.threats && analysis.threats.length > 0 && (
              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-50/30 hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Threats
                    <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-700">
                      {analysis.threats.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {analysis.threats.map((threat, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                          <div className="mt-0.5 h-2 w-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                          <p className="text-sm text-orange-800 font-medium leading-relaxed">{threat}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Competitive Analysis Tab */}
        <TabsContent value="competitive" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.competitive_advantages && analysis.competitive_advantages.length > 0 && (
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/30 hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center text-emerald-700">
                    <Award className="h-5 w-5 mr-2" />
                    Competitive Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.competitive_advantages.map((advantage, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
                        <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <ChevronRight className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <p className="text-sm font-medium text-emerald-800">{advantage}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.competitive_disadvantages && analysis.competitive_disadvantages.length > 0 && (
              <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-50/30 hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-700">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Competitive Disadvantages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.competitive_disadvantages.map((disadvantage, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
                        <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <p className="text-sm font-medium text-red-800">{disadvantage}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="market" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.target_market && analysis.target_market.length > 0 && (
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary" />
                    Target Markets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.target_market.map((market, i) => (
                      <Badge key={i} variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                        {market}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.customer_segments && analysis.customer_segments.length > 0 && (
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Customer Segments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.customer_segments.map((segment, i) => (
                      <Badge key={i} variant="secondary" className="hover:bg-secondary/80 transition-colors">
                        {segment}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.geographic_presence && analysis.geographic_presence.length > 0 && (
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-primary" />
                    Geographic Presence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {analysis.geographic_presence.map((location, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{location}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.partnerships && analysis.partnerships.length > 0 && (
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-primary" />
                    Key Partnerships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.partnerships.map((partnership, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                        <p className="text-sm font-medium">{partnership}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(analysis.revenue_estimate || analysis.market_share_estimate) && (
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-primary" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.revenue_estimate && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-700">Estimated Revenue</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(analysis.revenue_estimate)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {analysis.market_share_estimate && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Market Share</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {analysis.market_share_estimate}%
                        </span>
                      </div>
                      <Progress 
                        value={analysis.market_share_estimate} 
                        className="mt-2 h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {analysis.funding_info && typeof analysis.funding_info === 'object' && (
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-primary" />
                    Funding Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap overflow-auto">
                      {JSON.stringify(analysis.funding_info, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-6">
            {analysis.product_portfolio && typeof analysis.product_portfolio === 'object' && (
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-primary" />
                    Product Portfolio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.product_portfolio.primary_products && analysis.product_portfolio.primary_products.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Primary Products</h4>
                      <div className="grid gap-3">
                        {analysis.product_portfolio.primary_products.map((product: any, index: number) => (
                          <div key={index} className="border border-border rounded-lg p-3 bg-background">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-medium text-sm">{product.name}</h5>
                              {product.category && (
                                <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                              )}
                            </div>
                            {product.description && (
                              <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {product.pricing && (
                                <Badge variant="outline" className="text-xs">💰 {product.pricing}</Badge>
                              )}
                              {product.launch_date && (
                                <Badge variant="outline" className="text-xs">📅 {product.launch_date}</Badge>
                              )}
                              {product.url && (
                                <button
                                  onClick={() => window.open(product.url, '_blank')}
                                  className="text-xs text-primary hover:underline"
                                >
                                  View Product →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.product_portfolio.services && analysis.product_portfolio.services.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Services</h4>
                      <div className="grid gap-2">
                        {analysis.product_portfolio.services.map((service: any, index: number) => (
                          <div key={index} className="border border-border rounded-lg p-3 bg-background">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-medium text-sm">{service.name}</h5>
                              {service.pricing && (
                                <Badge variant="outline" className="text-xs">💰 {service.pricing}</Badge>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.product_portfolio.apis && analysis.product_portfolio.apis.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3">APIs</h4>
                      <div className="grid gap-2">
                        {analysis.product_portfolio.apis.map((api: any, index: number) => (
                          <div key={index} className="border border-border rounded-lg p-3 bg-background">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-medium text-sm">{api.name}</h5>
                              {api.pricing && (
                                <Badge variant="outline" className="text-xs">💰 {api.pricing}</Badge>
                              )}
                            </div>
                            {api.description && (
                              <p className="text-sm text-muted-foreground mt-1">{api.description}</p>
                            )}
                            {api.url && (
                              <button
                                onClick={() => window.open(api.url, '_blank')}
                                className="text-xs text-primary hover:underline mt-2"
                              >
                                View API Docs →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!analysis.product_portfolio.primary_products || analysis.product_portfolio.primary_products.length === 0) &&
                   (!analysis.product_portfolio.services || analysis.product_portfolio.services.length === 0) &&
                   (!analysis.product_portfolio.apis || analysis.product_portfolio.apis.length === 0) && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap overflow-auto max-h-96">
                        {JSON.stringify(analysis.product_portfolio, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {analysis.technology_analysis && typeof analysis.technology_analysis === 'object' && (
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-primary" />
                    Technology Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap overflow-auto max-h-96">
                      {JSON.stringify(analysis.technology_analysis, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.pricing_strategy && typeof analysis.pricing_strategy === 'object' && (
              <Card className="hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-primary" />
                    Pricing Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.pricing_strategy.model && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Pricing Model</h4>
                      <Badge variant="secondary">{analysis.pricing_strategy.model}</Badge>
                    </div>
                  )}

                  {analysis.pricing_strategy.tiers && analysis.pricing_strategy.tiers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Pricing Tiers</h4>
                      <div className="grid gap-3">
                        {analysis.pricing_strategy.tiers.map((tier: any, index: number) => (
                          <div key={index} className="border border-border rounded-lg p-3 bg-background">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-medium text-sm">{tier.name}</h5>
                              <Badge variant="outline" className="text-xs font-mono">{tier.price}</Badge>
                            </div>
                            {tier.features && tier.features.length > 0 && (
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {tier.features.map((feature: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.pricing_strategy.details && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Details</h4>
                      <p className="text-sm text-muted-foreground">{analysis.pricing_strategy.details}</p>
                    </div>
                  )}

                  {analysis.pricing_strategy.competitive_positioning && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Competitive Positioning</h4>
                      <p className="text-sm text-muted-foreground">{analysis.pricing_strategy.competitive_positioning}</p>
                    </div>
                  )}

                  {(!analysis.pricing_strategy.model && !analysis.pricing_strategy.tiers && !analysis.pricing_strategy.details) && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap overflow-auto max-h-96">
                        {JSON.stringify(analysis.pricing_strategy, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Performance Scores Tab */}
        <TabsContent value="scores" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {analysis.innovation_score && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">Innovation Score</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground hover:text-primary cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{getScoreCalculationExplanation('innovation')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className={`font-bold ${getScoreColor(analysis.innovation_score)}`}>
                        {analysis.innovation_score}/100
                      </span>
                    </div>
                    <Progress value={analysis.innovation_score} className="h-2" />
                  </div>
                )}
                
                {analysis.brand_strength_score && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">Brand Strength</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground hover:text-primary cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{getScoreCalculationExplanation('brand strength')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className={`font-bold ${getScoreColor(analysis.brand_strength_score)}`}>
                        {analysis.brand_strength_score}/100
                      </span>
                    </div>
                    <Progress value={analysis.brand_strength_score} className="h-2" />
                  </div>
                )}
                
                {analysis.operational_efficiency_score && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">Operational Efficiency</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground hover:text-primary cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{getScoreCalculationExplanation('operational efficiency')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className={`font-bold ${getScoreColor(analysis.operational_efficiency_score)}`}>
                        {analysis.operational_efficiency_score}/100
                      </span>
                    </div>
                    <Progress value={analysis.operational_efficiency_score} className="h-2" />
                  </div>
                )}
                
                {analysis.market_sentiment_score && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">Market Sentiment</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground hover:text-primary cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{getScoreCalculationExplanation('market sentiment')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className={`font-bold ${getScoreColor(analysis.market_sentiment_score)}`}>
                        {analysis.market_sentiment_score}/100
                      </span>
                    </div>
                    <Progress value={analysis.market_sentiment_score} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Data Quality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {analysis.data_quality_score && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Data Quality</span>
                      <span className={`font-bold ${getScoreColor(analysis.data_quality_score)}`}>
                        {analysis.data_quality_score}/100
                      </span>
                    </div>
                    <Progress value={analysis.data_quality_score} className="h-2" />
                  </div>
                )}
                
                {analysis.data_completeness_score && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Data Completeness</span>
                      <span className={`font-bold ${getScoreColor(analysis.data_completeness_score)}`}>
                        {analysis.data_completeness_score}/100
                      </span>
                    </div>
                    <Progress value={analysis.data_completeness_score} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-6 mt-6">
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                Analysis Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={analysis.status === 'completed' ? 'default' : 'secondary'}>
                      {analysis.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">Created</span>
                    <span className="text-sm text-muted-foreground">
                      {analysis.created_at ? new Date(analysis.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">Last Updated</span>
                    <span className="text-sm text-muted-foreground">
                      {analysis.updated_at ? new Date(analysis.updated_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {analysis.completed_at && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">Completed</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(analysis.completed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {analysis.website_verified !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">Website Verified</span>
                      <Badge variant={analysis.website_verified ? 'default' : 'secondary'}>
                        {analysis.website_verified ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                  
                  {analysis.employee_count_verified !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm font-medium">Employee Count Verified</span>
                      <Badge variant={analysis.employee_count_verified ? 'default' : 'secondary'}>
                        {analysis.employee_count_verified ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};