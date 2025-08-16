import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Eye, Edit, Trash, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RLSPolicy {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

export const RLSPoliciesViewer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<RLSPolicy[]>([]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const { data, error } = await supabase.functions.invoke('database-schema', {
        body: { action: 'get-policies' },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to fetch RLS policies');
      }

      // Handle the response data
      const policiesData = Array.isArray(data.policies) ? data.policies : [];
      
      // Transform the data to match our interface if needed
      const transformedPolicies = policiesData.map((policy: any) => ({
        schemaname: policy.schemaname || '',
        tablename: policy.tablename || '',
        policyname: policy.policyname || '',
        permissive: policy.permissive || '',
        roles: Array.isArray(policy.roles) ? policy.roles : [],
        cmd: policy.cmd || '',
        qual: policy.qual || '',
        with_check: policy.with_check || ''
      }));
      
      setPolicies(transformedPolicies);
    } catch (error: any) {
      console.error('RLS policies fetch error:', error);
      toast({
        title: 'Policies Load Failed',
        description: error.message || 'Failed to load RLS policies',
        variant: 'destructive'
      });
      // Set empty array on error to show "No policies found" message
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const getCommandIcon = (cmd: string) => {
    switch (cmd) {
      case 'SELECT': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'INSERT': return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'DELETE': return <Trash className="h-4 w-4 text-red-500" />;
      case 'ALL': return <Shield className="h-4 w-4 text-purple-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCommandColor = (cmd: string) => {
    switch (cmd) {
      case 'SELECT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INSERT': return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'ALL': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group policies by table
  const policiesByTable = policies.reduce((acc, policy) => {
    if (!acc[policy.tablename]) {
      acc[policy.tablename] = [];
    }
    acc[policy.tablename].push(policy);
    return acc;
  }, {} as Record<string, RLSPolicy[]>);

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
          <h2 className="text-2xl font-bold">RLS Policies</h2>
          <p className="text-muted-foreground">
            Row Level Security policies for database tables
          </p>
        </div>
        <Button onClick={fetchPolicies} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {Object.keys(policiesByTable).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No RLS policies found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(policiesByTable).map(([tableName, tablePolicies]) => (
            <Card key={tableName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {tableName}
                  <Badge variant="secondary">{tablePolicies.length} policies</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tablePolicies.map((policy, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCommandIcon(policy.cmd)}
                          <span className="font-semibold">{policy.policyname}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getCommandColor(policy.cmd)}>
                            {policy.cmd}
                          </Badge>
                          <Badge variant={policy.permissive === 'PERMISSIVE' ? 'default' : 'destructive'}>
                            {policy.permissive}
                          </Badge>
                        </div>
                      </div>

                      {policy.roles && policy.roles.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Roles:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {policy.roles.map((role, roleIndex) => (
                              <Badge key={roleIndex} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {policy.qual && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Using:</span>
                          <code className="block mt-1 p-2 bg-muted rounded text-sm font-mono">
                            {policy.qual}
                          </code>
                        </div>
                      )}

                      {policy.with_check && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">With Check:</span>
                          <code className="block mt-1 p-2 bg-muted rounded text-sm font-mono">
                            {policy.with_check}
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};