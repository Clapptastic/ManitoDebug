
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold">Welcome to Uppi.ai</h1>
        <p className="text-xl text-muted-foreground">
          AI-powered SaaS platform for entrepreneurs
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/market-research/competitor-analysis">Competitor Analysis</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
