
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DocumentationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Documentation</h2>
        <p className="text-muted-foreground">
          Platform documentation and guides
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Documentation system coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentationPage;
