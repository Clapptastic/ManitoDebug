
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

export const SupabaseConfigCheck: React.FC = () => {
  const isConfigured = typeof process !== 'undefined' && !!(process as any).env?.REACT_APP_SUPABASE_URL;

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
      <CardContent>
        <Badge variant={isConfigured ? "default" : "destructive"}>
          {isConfigured ? "Configured" : "Not Configured"}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default SupabaseConfigCheck;
