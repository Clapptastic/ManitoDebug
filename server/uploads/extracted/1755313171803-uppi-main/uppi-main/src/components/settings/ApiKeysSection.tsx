
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
// API Key Management is now handled at /api-keys route

export const ApiKeysSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys Management</CardTitle>
          <CardDescription>
            Configure your API keys for various AI providers to enable competitor analysis and other features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              API key management has been moved to a dedicated page for better security and functionality.
              Use the API Keys menu item to manage your keys.
            </AlertDescription>
          </Alert>
          
          <div className="text-center py-8 text-muted-foreground">
            <p>API key management is now available at <strong>/api-keys</strong></p>
            <p className="text-sm mt-2">Navigate to API Keys from the main menu to configure your AI provider keys.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
