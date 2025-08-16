
import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Schema visualizer temporarily unavailable - consolidated components removed
import { RLSPoliciesViewer } from '@/components/admin/schema/RLSPoliciesViewer';
import { DatabaseFunctionsViewer } from '@/components/admin/schema/DatabaseFunctionsViewer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { Helmet } from 'react-helmet-async'; // SEO: managed via react-helmet-async

const SchemaViewerPage: React.FC = () => {
  const { isAuthenticated, isAdmin, isSuperAdmin, loading } = useAdminAuth();

  // Only super admins can access schema viewer
  const hasAccess = isAuthenticated && isSuperAdmin;

  // SEO: canonical URL for this admin page; avoid indexing
  const canonicalUrl = (typeof window !== 'undefined' ? `${window.location.origin}/admin/schema-viewer` : '/admin/schema-viewer');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <Helmet>
          <title>Database Schema Viewer · Admin</title>
          <meta name="description" content="Admin database schema viewer for tables, RLS policies, and functions." />
          <meta name="robots" content="noindex,nofollow" />
          <link rel="canonical" href={canonicalUrl} />
        </Helmet>
        <main className="space-y-6">
          <AdminPageHeader
            title="Database Schema Viewer"
            description="Explore and manage database tables, relationships, and policies"
            icon={<Database className="h-6 w-6" />}
          />
          <Alert className="mb-4">
            <AlertDescription>
              Access denied. This tool requires super admin privileges to view database schema details.
            </AlertDescription>
          </Alert>
        </main>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Database Schema Viewer"
        description="Explore and manage database tables, relationships, and policies"
        icon={<Database className="h-6 w-6" />}
      />
      
      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">Tables & Schema</TabsTrigger>
          <TabsTrigger value="policies">RLS Policies</TabsTrigger>
          <TabsTrigger value="functions">Database Functions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tables">
          {/* Schema visualizer temporarily disabled during consolidation */}
          <p className="text-muted-foreground">Schema visualization is being consolidated. Check back soon.</p>
        </TabsContent>
        
        <TabsContent value="policies">
          <RLSPoliciesViewer />
        </TabsContent>
        
        <TabsContent value="functions">
          <DatabaseFunctionsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchemaViewerPage;
