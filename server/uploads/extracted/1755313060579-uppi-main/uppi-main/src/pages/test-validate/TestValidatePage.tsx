
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestValidatePage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Test & Validate</h1>
        <p className="text-muted-foreground">
          Test your ideas and validate your business hypotheses.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Test & Validate Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">
            Test and validation tools coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestValidatePage;
