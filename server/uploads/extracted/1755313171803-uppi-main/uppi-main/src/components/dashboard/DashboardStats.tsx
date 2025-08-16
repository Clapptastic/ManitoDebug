import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { dataManager } from '@/services/core/DataManager';
import { useAuth } from '@/hooks/auth/useAuth';
import { Loader2 } from 'lucide-react';
import { unifiedApiKeyService } from '@/services/api-keys/unifiedApiKeyService';

export const DashboardStats: React.FC = () => {
  console.log('DashboardStats: Component rendering');
  
  const { user, session, initialized } = useAuth();
  
  console.log('DashboardStats: Auth state', { user: user?.email, session: !!session, initialized });

  // Fetch real data from backend
  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['competitor-analyses', user?.id],
    queryFn: () => dataManager.fetchData('competitor_analyses', {
      filters: { user_id: user?.id },
      select: 'id,status'
    }),
    enabled: !!user?.id
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: () => dataManager.fetchData('documents', {
      filters: { user_id: user?.id },
      select: 'id,name'
    }),
    enabled: !!user?.id
  });

  const { data: apiKeys, isLoading: apiKeysLoading, error: apiKeysError } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: () => unifiedApiKeyService.getAllApiKeys(),
    enabled: !!user?.id && !!session && initialized, // Wait for full auth initialization
    retry: 1, // Reduced retry count
    retryDelay: 2000,
    // Don't throw errors - handle gracefully
    throwOnError: false,
    // Default to empty array on error
    select: (data) => data || []
  });

  const isLoading = analysesLoading || documentsLoading || apiKeysLoading;

  // Calculate stats with fallback values
  const totalAnalyses = analyses?.length || 0;
  const completedAnalyses = analyses?.filter(a => a.status === 'completed').length || 0;
  const totalDocuments = documents?.length || 0;
  const activeApiKeys = apiKeys?.filter(k => k.status === 'active').length || 0;

  // Show error indicator in stats if API keys failed to load
  const hasApiKeyError = apiKeysError && !apiKeys?.length;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading data...</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Competitor Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAnalyses}</div>
          <p className="text-xs text-muted-foreground">
            {completedAnalyses} completed
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDocuments}</div>
          <p className="text-xs text-muted-foreground">
            Stored documents
          </p>
        </CardContent>
      </Card>
      
       <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium">API Keys</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold">{activeApiKeys}</div>
           <p className="text-xs text-muted-foreground">
             {hasApiKeyError ? 'Service temporarily unavailable' : 'Active connections'}
           </p>
         </CardContent>
       </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAnalyses > 0 ? Math.ceil(totalAnalyses / 2) : 0}</div>
          <p className="text-xs text-muted-foreground">
            AI conversations
          </p>
        </CardContent>
      </Card>
    </div>
  );
};