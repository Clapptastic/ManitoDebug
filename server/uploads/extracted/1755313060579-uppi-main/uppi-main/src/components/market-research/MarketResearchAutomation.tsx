import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Search, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Globe, 
  Target,
  BarChart3,
  Download
} from 'lucide-react';

interface MarketResearchData {
  industry: string;
  marketSize: {
    global: string;
    regional: string;
    growth_rate: string;
  };
  targetAudience: {
    demographics: string[];
    psychographics: string[];
    painPoints: string[];
  };
  competitorLandscape: {
    directCompetitors: string[];
    indirectCompetitors: string[];
    marketShare: { [key: string]: string };
  };
  trends: {
    emerging: string[];
    declining: string[];
    technologies: string[];
  };
  opportunities: {
    gaps: string[];
    niches: string[];
    underserved: string[];
  };
  pricing: {
    models: string[];
    ranges: string[];
    strategies: string[];
  };
  insights: string[];
  recommendations: string[];
}

export const MarketResearchAutomation: React.FC = () => {
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('Global');
  const [targetMarket, setTargetMarket] = useState('');
  const [researchData, setResearchData] = useState<MarketResearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const { toast } = useToast();

  const conductResearch = async () => {
    if (!industry) {
      toast({
        title: 'Missing Information',
        description: 'Please specify the industry for research',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setCurrentPhase('Initializing market research...');

    try {
      const { data, error } = await supabase.functions.invoke('market-research-automation', {
        body: {
          industry,
          region,
          targetMarket
        }
      });

      if (error) throw error;

      // Simulate research phases
      const phases = [
        'Analyzing market size and growth...',
        'Identifying target demographics...',
        'Mapping competitor landscape...',
        'Detecting market trends...',
        'Finding market opportunities...',
        'Analyzing pricing strategies...',
        'Generating insights and recommendations...'
      ];

      for (let i = 0; i < phases.length; i++) {
        setCurrentPhase(phases[i]);
        setProgress((i + 1) * (100 / phases.length));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setResearchData(data.research);
      setCurrentPhase('Market research completed!');
      setProgress(100);

      toast({
        title: 'Research Complete',
        description: 'Comprehensive market research has been generated',
      });
    } catch (error) {
      console.error('Error conducting market research:', error);
      toast({
        title: 'Research Failed',
        description: 'Failed to conduct market research. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportResearch = () => {
    if (!researchData) return;

    const content = `
# Market Research Report: ${industry}

## Executive Summary
Comprehensive market research analysis for the ${industry} industry in ${region}.

## Market Size & Growth
- **Global Market Size:** ${researchData.marketSize.global}
- **Regional Market Size:** ${researchData.marketSize.regional}
- **Growth Rate:** ${researchData.marketSize.growth_rate}

## Target Audience Analysis

### Demographics
${researchData.targetAudience.demographics.map(demo => `- ${demo}`).join('\n')}

### Psychographics
${researchData.targetAudience.psychographics.map(psycho => `- ${psycho}`).join('\n')}

### Pain Points
${researchData.targetAudience.painPoints.map(pain => `- ${pain}`).join('\n')}

## Competitor Landscape

### Direct Competitors
${researchData.competitorLandscape.directCompetitors.map(comp => `- ${comp}`).join('\n')}

### Indirect Competitors
${researchData.competitorLandscape.indirectCompetitors.map(comp => `- ${comp}`).join('\n')}

### Market Share
${Object.entries(researchData.competitorLandscape.marketShare).map(([comp, share]) => `- ${comp}: ${share}`).join('\n')}

## Market Trends

### Emerging Trends
${researchData.trends.emerging.map(trend => `- ${trend}`).join('\n')}

### Declining Trends
${researchData.trends.declining.map(trend => `- ${trend}`).join('\n')}

### Key Technologies
${researchData.trends.technologies.map(tech => `- ${tech}`).join('\n')}

## Market Opportunities

### Market Gaps
${researchData.opportunities.gaps.map(gap => `- ${gap}`).join('\n')}

### Niche Markets
${researchData.opportunities.niches.map(niche => `- ${niche}`).join('\n')}

### Underserved Segments
${researchData.opportunities.underserved.map(segment => `- ${segment}`).join('\n')}

## Pricing Analysis

### Pricing Models
${researchData.pricing.models.map(model => `- ${model}`).join('\n')}

### Price Ranges
${researchData.pricing.ranges.map(range => `- ${range}`).join('\n')}

### Pricing Strategies
${researchData.pricing.strategies.map(strategy => `- ${strategy}`).join('\n')}

## Key Insights
${researchData.insights.map(insight => `- ${insight}`).join('\n')}

## Recommendations
${researchData.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by AI Market Research Automation*
    `.trim();

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${industry.replace(/\s+/g, '_')}_Market_Research.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            AI Market Research Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry *</label>
              <Input
                placeholder="e.g., SaaS, Healthcare, Fintech"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Input
                placeholder="e.g., Global, North America, Europe"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Market</label>
              <Input
                placeholder="e.g., SMBs, Enterprise, Consumers"
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={conductResearch} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Conducting Research...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Start AI Market Research
              </>
            )}
          </Button>

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">{currentPhase}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {researchData && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Market Research Results</h2>
            <Button onClick={exportResearch} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Market Size
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Global:</span>
                    <span className="font-semibold">{researchData.marketSize.global}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Regional:</span>
                    <span className="font-semibold">{researchData.marketSize.regional}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Growth Rate:</span>
                    <Badge variant="secondary">{researchData.marketSize.growth_rate}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Demographics</h4>
                  <div className="flex flex-wrap gap-1">
                    {researchData.targetAudience.demographics.slice(0, 3).map((demo, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{demo}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Pain Points</h4>
                  <ul className="text-sm space-y-1">
                    {researchData.targetAudience.painPoints.slice(0, 3).map((pain, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-destructive">•</span>
                        {pain}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Competitors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Direct Competitors</h4>
                  <ul className="text-sm space-y-1">
                    {researchData.competitorLandscape.directCompetitors.slice(0, 3).map((comp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {comp}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Market Share</h4>
                  <div className="space-y-1">
                    {Object.entries(researchData.competitorLandscape.marketShare).slice(0, 2).map(([comp, share], idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{comp}:</span>
                        <span className="font-semibold">{share}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Emerging Trends</h4>
                  <div className="flex flex-wrap gap-1">
                    {researchData.trends.emerging.slice(0, 3).map((trend, idx) => (
                      <Badge key={idx} variant="default" className="text-xs">{trend}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Key Technologies</h4>
                  <div className="flex flex-wrap gap-1">
                    {researchData.trends.technologies.slice(0, 3).map((tech, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{tech}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Pricing Models</h4>
                  <ul className="text-sm space-y-1">
                    {researchData.pricing.models.slice(0, 3).map((model, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        {model}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Price Ranges</h4>
                  <div className="space-y-1">
                    {researchData.pricing.ranges.slice(0, 2).map((range, idx) => (
                      <div key={idx} className="text-sm font-semibold">{range}</div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Market Gaps</h4>
                  <ul className="text-sm space-y-1">
                    {researchData.opportunities.gaps.slice(0, 3).map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Underserved Segments</h4>
                  <ul className="text-sm space-y-1">
                    {researchData.opportunities.underserved.slice(0, 2).map((segment, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {segment}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {researchData.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary font-bold">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {researchData.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 font-bold">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};