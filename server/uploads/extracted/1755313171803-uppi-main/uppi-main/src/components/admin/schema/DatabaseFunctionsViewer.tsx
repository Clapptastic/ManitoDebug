import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Database, RefreshCw, Loader2, Code, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DatabaseFunction {
  routine_name: string;
  routine_type: string;
  routine_schema: string;
  arguments?: string;
  return_type?: string;
  language?: string;
  volatility?: string;
  security?: string;
}

export const DatabaseFunctionsViewer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [functions, setFunctions] = useState<DatabaseFunction[]>([]);

  const fetchFunctions = async () => {
    try {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const { data, error } = await supabase.functions.invoke('database-schema', {
        body: { action: 'get-functions' },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error) throw error;
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to fetch database functions');
      }

      // Ensure functions is always an array
      const functionsData = Array.isArray(data.functions) ? data.functions : [];
      setFunctions(functionsData);
    } catch (error: any) {
      console.error('Database functions fetch error:', error);
      toast({
        title: 'Functions Load Failed',
        description: error.message || 'Failed to load database functions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunctions();
  }, []);

  const getLanguageColor = (language?: string) => {
    if (!language) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (language.toLowerCase()) {
      case 'plpgsql': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sql': return 'bg-green-100 text-green-800 border-green-200';
      case 'python': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'javascript': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVolatilityColor = (volatility?: string) => {
    if (!volatility) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (volatility) {
      case 'IMMUTABLE': return 'bg-green-100 text-green-800 border-green-200';
      case 'STABLE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'VOLATILE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSecurityColor = (security?: string) => {
    if (!security) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (security) {
      case 'DEFINER': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'INVOKER': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Functions</h2>
          <p className="text-muted-foreground">
            Custom functions and stored procedures in the database
          </p>
        </div>
        <Button onClick={fetchFunctions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {functions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No database functions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {Array.isArray(functions) && functions.map((func, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {func.routine_name}
                  <div className="flex items-center gap-2 ml-auto">
                    <Badge className={getLanguageColor(func.language)}>
                      {func.language?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                    <Badge className={getVolatilityColor(func.volatility)}>
                      {func.volatility || 'UNKNOWN'}
                    </Badge>
                    <Badge className={getSecurityColor(func.security)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {func.security || 'UNKNOWN'}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Signature:</span>
                  </div>
                  <code className="block p-3 bg-muted rounded-lg text-sm font-mono">
                    {func.routine_name}({func.arguments || 'no arguments'}) → {func.return_type || 'void'}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <p className="mt-1">{func.routine_type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Schema:</span>
                    <p className="mt-1">{func.routine_schema}</p>
                  </div>
                  {func.language && (
                    <div>
                      <span className="font-medium text-muted-foreground">Language:</span>
                      <p className="mt-1">{func.language}</p>
                    </div>
                  )}
                  {func.return_type && (
                    <div>
                      <span className="font-medium text-muted-foreground">Return Type:</span>
                      <p className="mt-1">{func.return_type}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};