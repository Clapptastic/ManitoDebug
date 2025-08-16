
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart, ActivitySquare, ChartPieIcon } from 'lucide-react';

const TestMeasureLearnPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Test • Measure • Learn</h1>
        <p className="text-muted-foreground">
          Tools and insights to experiment, measure results, and optimize your business.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <BarChart3 className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Web Analytics Dashboard</CardTitle>
            <CardDescription>
              Track and analyze website traffic across multiple domains with roll-up reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor page views, visitor behavior, and engagement metrics with a robust analytics platform
              that integrates directly with your websites.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/test-measure-learn/web-analytics">View Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <LineChart className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>A/B Testing</CardTitle>
            <CardDescription>
              Run experiments and compare results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and manage A/B tests for web pages, emails, or product features.
              Analyze conversion rates and optimize your business based on real data.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" disabled>Coming Soon</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <ActivitySquare className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>User Testing</CardTitle>
            <CardDescription>
              Get feedback on your product or service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set up user testing sessions, track feedback, and identify usability issues.
              Understand how users interact with your product and what improvements to make.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" disabled>Coming Soon</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <ChartPieIcon className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Market Validation</CardTitle>
            <CardDescription>
              Validate your business ideas with real data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get insights into market size, competition, and demand for your product.
              Use data to make informed decisions about your business direction.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/market-research">View Tools</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TestMeasureLearnPage;
