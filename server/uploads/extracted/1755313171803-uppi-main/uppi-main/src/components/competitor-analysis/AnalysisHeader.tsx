import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Search, Shield, BarChart3 } from 'lucide-react';

export const AnalysisHeader: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Competitor Analysis
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Get comprehensive insights into your competitors with AI-powered analysis. 
          Understand market positioning, strengths, weaknesses, and opportunities to stay ahead.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Real-time Research</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Leverage multiple AI providers for current market data and comprehensive competitor insights.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">SWOT Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Detailed analysis of strengths, weaknesses, opportunities, and threats for strategic planning.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Your analysis data is encrypted and stored securely with role-based access controls.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};