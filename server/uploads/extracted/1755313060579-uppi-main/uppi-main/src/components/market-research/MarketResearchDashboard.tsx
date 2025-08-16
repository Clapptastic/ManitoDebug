import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { marketResearchService, MarketResearch, MarketTrend } from '@/services/marketResearchService';
import { useBusinessAdvisor } from '@/hooks/useBusinessAdvisor';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Search, BarChart3, Target, Lightbulb } from 'lucide-react';

export const MarketResearchDashboard = () => {
  const [businessIdea, setBusinessIdea] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [research, setResearch] = useState<MarketResearch[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { getBusinessAdvice, analyzeCompetitors, isLoading } = useBusinessAdvisor();
  const { toast } = useToast();

  useEffect(() => {
    loadResearch();
    loadTrends();
  }, []);

  const loadResearch = async () => {
    try {
      const { data } = await marketResearchService.getMarketResearch();
      setResearch((data as any) || []);
    } catch (error) {
      console.error('Failed to load research:', error);
    }
  };

  const loadTrends = async () => {
    try {
      const { data } = await marketResearchService.getMarketTrends();
      setTrends((data as any) || []);
    } catch (error) {
      console.error('Failed to load trends:', error);
    }
  };

  const handleAnalyzeMarket = async () => {
    if (!businessIdea.trim() || !targetMarket.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both business idea and target market",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      await marketResearchService.analyzeMarket(businessIdea, targetMarket);
      await loadResearch();
      
      toast({
        title: "Analysis Complete",
        description: "Market research analysis has been completed"
      });
      
      setBusinessIdea('');
      setTargetMarket('');
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze market",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return 'High Potential';
    if (score >= 60) return 'Medium Potential';
    return 'Low Potential';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Research & Validation</h1>
          <p className="text-muted-foreground">
            Analyze market opportunities and validate your business ideas
          </p>
        </div>
      </div>

      <Tabs defaultValue="analyze" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Idea</label>
                <Textarea
                  placeholder="Describe your business idea in detail..."
                  value={businessIdea}
                  onChange={(e) => setBusinessIdea(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Market</label>
                <Input
                  placeholder="e.g., Small businesses, Millennials, Tech startups"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAnalyzeMarket}
                disabled={isAnalyzing || isLoading}
                className="w-full"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Market'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="space-y-6">
          <div className="grid gap-6">
            {research.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Research Available</h3>
                  <p className="text-muted-foreground">
                    Start by analyzing a market opportunity to see your research here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              research.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.business_idea}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Target: {item.target_market}
                        </p>
                      </div>
                      <Badge className={`${getScoreColor(item.validation_score)} text-white`}>
                        {getScoreText(item.validation_score)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Market Size Estimate
                      </h4>
                      <p className="text-2xl font-bold text-primary">
                        ${item.market_size_estimate?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    
                    {item.recommendations && item.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {item.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6">
            {trends.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Trends Available</h3>
                  <p className="text-muted-foreground">
                    Market trend data will appear here as it becomes available.
                  </p>
                </CardContent>
              </Card>
            ) : (
              trends.map((trend) => (
                <Card key={trend.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {trend.industry}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Growth Rate</p>
                        <p className="text-lg font-semibold text-green-600">
                          {trend.growth_rate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Market Size</p>
                        <p className="text-lg font-semibold">
                          ${trend.market_size?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};