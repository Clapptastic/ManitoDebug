
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCodeWikiService } from '@/hooks/admin/useCodeWikiService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileCode, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OutboundLink } from '@/components/shared/OutboundLink';
import WikiServiceManager from '@/components/admin/microservices/WikiServiceManager';

const CodeWikiPage: React.FC = () => {
  const { service, isLoading, error, isAvailable, refreshService, documentation } = useCodeWikiService();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Code Wiki System</h1>
          <p className="text-muted-foreground">
            Manage and access code documentation and guides
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshService}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load Code Wiki service: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className="font-medium">
                    {isAvailable ? 'Available' : 'Not Connected'}
                  </span>
                </div>
                
                {service && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Service</p>
                        <p className="font-medium">{service.service_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Version</p>
                        <p className="font-medium">{service.version}</p>
                      </div>
                    </div>
                    
                    {service.documentation_url && (
                      <OutboundLink href={service.documentation_url} target="_blank" rel="noopener noreferrer">
                        View Documentation <ExternalLink className="ml-2 h-4 w-4" />
                      </OutboundLink>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {isAvailable && documentation && (
            <Tabs defaultValue="docs">
              <TabsList>
                <TabsTrigger value="docs">Documentation</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="docs" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{documentation.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{documentation.content}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                {/* Integrate the Wiki Service Manager for Code Wiki settings */}
                <WikiServiceManager />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
};

export default CodeWikiPage;
