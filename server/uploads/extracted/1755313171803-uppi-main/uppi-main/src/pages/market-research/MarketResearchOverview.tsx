import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MarketResearchOverview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* SEO: Title, description, canonical for Market Research page */}
      <Helmet>
        <title>Market Research & Competitor Analysis</title>
        <meta name="description" content="AI-powered market research and competitor analysis tools for entrepreneurs." />
        <link rel="canonical" href={`${typeof window !== 'undefined' ? window.location.origin : ''}/market-research`} />
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Market Research</h1>
        <p className="text-muted-foreground">
          Comprehensive market research and competitor analysis tools
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Competitor Analysis</CardTitle>
          <CardDescription>
            AI-powered competitive intelligence and market insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              onClick={() => navigate('/market-research/competitor-analysis')}
              className="h-20"
            >
              Start New Analysis
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/market-research/saved-analyses')}
              className="h-20"
            >
              View Saved Analyses
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default MarketResearchOverview;