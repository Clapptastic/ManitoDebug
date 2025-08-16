
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const SupabaseNotConfigured: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/10">
      <Card className="max-w-lg w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Supabase Not Configured</CardTitle>
          <CardDescription>
            The connection to Supabase could not be established.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Connection Error</AlertTitle>
            <AlertDescription>
              Could not connect to Supabase. This may be due to incorrect configuration or network issues.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h3 className="text-base font-medium">Possible solutions:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Verify your Supabase URL and API keys in the environment variables</li>
              <li>Check that your Supabase project is running and accessible</li>
              <li>Ensure your IP address is allowed in Supabase's security settings</li>
              <li>Check your network connection</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
          <Button onClick={() => window.open('https://docs.lovable.dev/integrations/supabase/', '_blank')}>
            View Documentation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SupabaseNotConfigured;
