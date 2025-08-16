/**
 * Component to check if Supabase is properly configured
 * Shows configuration status and helpful links
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SupabaseConfigured: React.FC = () => {
  // Check if Supabase environment variables are present
  const supabaseUrl = 'https://jqbdjttdaihidoyalqvs.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxYmRqdHRkYWloaWRveWFscXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODAzNzYsImV4cCI6MjA2MjA1NjM3Nn0.FJTBD9b9DLtFZKdj4hQiJXTx4Avg8Kxv_MA-q3egbBo';
  
  const isConfigured = !!(supabaseUrl && supabaseAnonKey);

  const handleTestConnection = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'authorization': `Bearer ${supabaseAnonKey}`,
        },
      });
      
      if (response.ok) {
        alert('✅ Supabase connection successful!');
      } else {
        alert('❌ Supabase connection failed. Check your configuration.');
      }
    } catch (error) {
      alert('❌ Network error. Check your internet connection.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          Supabase Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={isConfigured ? "default" : "destructive"}>
            {isConfigured ? "Configured" : "Not Configured"}
          </Badge>
          {isConfigured && (
            <Button variant="outline" size="sm" onClick={handleTestConnection}>
              Test Connection
            </Button>
          )}
        </div>

        {isConfigured ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Supabase is properly configured and ready to use. The app can connect to your database and handle authentication.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Supabase configuration is missing. The app may not function correctly without proper database connection.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Links:</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                Dashboard <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/auth/users" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                Users <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://supabase.com/dashboard/project/jqbdjttdaihidoyalqvs/sql/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                SQL Editor <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        {isConfigured && (
          <div className="text-xs text-muted-foreground">
            <p>Project ID: jqbdjttdaihidoyalqvs</p>
            <p>URL: {supabaseUrl}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseConfigured;