import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { marketResearchItems } from '@/components/navigation/nav-items/marketResearchItems';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, BarChart3, Users, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const MarketResearchPage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

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
              Please sign in to access market research tools
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

  const featuredTools = marketResearchItems.slice(0, 4);
  const additionalTools = marketResearchItems.slice(4);
  // SEO: canonical URL and structured data for Market Research Hub
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/market-research` : '/market-research';
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Market Research Hub",
    description: "AI market research and competitive intelligence tools.",
    url: canonicalUrl
  };

  return (
    <>
      <Helmet>
        <title>Market Research Hub | AI Insights</title>
        <meta name="description" content="AI market research and competitive intelligence tools." />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Market Research Hub</h1>
            <p className="text-muted-foreground">
              Comprehensive market research and competitive intelligence tools powered by AI
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Competitor Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">AI-powered insights</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Market Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">TAM/SAM</div>
              <p className="text-xs text-muted-foreground">Market analysis</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Real-time</div>
              <p className="text-xs text-muted-foreground">Market trends</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Saved Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ready</div>
              <p className="text-xs text-muted-foreground">Export available</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Tools */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Core Research Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Card key={tool.path} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tool.label}</CardTitle>
                          <CardDescription>{tool.description}</CardDescription>
                        </div>
                      </div>
                      {tool.path.includes('competitor-analysis') && (
                        <Badge variant="default">Popular</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate(tool.path)}
                    >
                      Launch Tool
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Additional Tools */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Advanced Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {additionalTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Card key={tool.path} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{tool.label}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(tool.path)}
                    >
                      Access
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Getting Started Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Getting Started with Market Research</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Analyze Competitors</h3>
                <p className="text-sm text-muted-foreground">
                  Start with competitor analysis to understand your market landscape
                </p>
              </div>
              <div className="text-center p-4">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Size Your Market</h3>
                <p className="text-sm text-muted-foreground">
                  Calculate TAM, SAM, and SOM to understand opportunity size
                </p>
              </div>
              <div className="text-center p-4">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Track Trends</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor market trends and identify emerging opportunities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default MarketResearchPage;