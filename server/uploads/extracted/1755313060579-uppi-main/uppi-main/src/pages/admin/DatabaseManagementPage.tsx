import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DatabaseManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Database className="h-8 w-8" />
          Database Management
        </h1>
        <p className="text-muted-foreground">Monitor and manage database operations</p>
      </div>
      
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Database management features are being developed. This page will provide 
          comprehensive database monitoring, optimization, and schema management tools.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tables Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">43</div>
            <p className="text-muted-foreground text-sm">Total tables</p>
            <Badge variant="default" className="mt-2">Active</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">RLS Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-muted-foreground text-sm">Security policies</p>
            <Badge variant="default" className="mt-2">Enabled</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-muted-foreground text-sm">Database functions</p>
            <Badge variant="default" className="mt-2">Operational</Badge>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Connection Status</span>
              <Badge variant="default">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Schema Version</span>
              <Badge variant="outline">Latest</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Backup Status</span>
              <Badge variant="default">Automated</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseManagementPage;