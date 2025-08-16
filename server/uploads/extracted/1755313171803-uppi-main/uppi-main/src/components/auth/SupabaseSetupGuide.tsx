
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const SupabaseSetupGuide: React.FC = () => {
  return (
    <Card className="max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Supabase Connection Setup Guide</CardTitle>
        <CardDescription>
          Configure your environment to connect to Supabase for authentication and database features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Authentication errors typically occur when the Supabase connection is not properly configured.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Troubleshooting Steps</h3>
          
          <ol className="list-decimal pl-5 space-y-4">
            <li>
              <strong>Connect to Supabase in Lovable:</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Click the green Supabase button in the top right corner of the Lovable interface.
              </p>
            </li>
            
            <li>
              <strong>Select or Create Supabase Project:</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Either connect to an existing Supabase project or create a new one.
              </p>
            </li>
            
            <li>
              <strong>Refresh the Page:</strong>
              <p className="text-sm text-muted-foreground mt-1">
                After connecting, refresh this page to apply the changes.
              </p>
            </li>
            
            <li>
              <strong>Check Console for Errors:</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Open your browser's developer console (F12) to check for specific error messages.
              </p>
            </li>
          </ol>
        </div>
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">Why This Error Occurs</h3>
          <p className="text-sm">
            This error typically happens when the application cannot find the Supabase URL and API key environment variables.
            These are automatically set when you connect your project to Supabase through Lovable.
          </p>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        If problems persist, try restarting your Lovable development environment.
      </CardFooter>
    </Card>
  );
};

export default SupabaseSetupGuide;
