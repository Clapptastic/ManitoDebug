
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const MarketValidationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Market Validation</h1>
      <p className="text-muted-foreground">
        Tools to help validate your market and understand your competition.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/market-validation/competitor-analysis">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Research and analyze your competitors to understand their strengths and weaknesses.</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/market-research">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Market Research</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Conduct market research to validate your business ideas.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default MarketValidationPage;
