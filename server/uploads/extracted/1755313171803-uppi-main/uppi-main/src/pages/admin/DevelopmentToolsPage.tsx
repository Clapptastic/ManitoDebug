
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Bug, Code, Database, Workflow } from 'lucide-react';
import { errorTracker } from '@/utils/errorTracker';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { Button } from '@/components/ui/button';

/**
 * Development Tools Page for Admin
 * 
 * This page provides access to development tools and debugging capabilities
 */
const DevelopmentToolsPage: React.FC = () => {
  const [errors, setErrors] = React.useState(errorTracker.getErrors());
  const [performanceMeasurements, setPerformanceMeasurements] = React.useState(performanceMonitor.getMeasurements());
  const [activeTab, setActiveTab] = React.useState('overview');

  // Subscribe to error updates
  React.useEffect(() => {
    const unsubscribe = errorTracker.subscribe(updatedErrors => {
      setErrors(updatedErrors);
    });
    
    const unsubscribePerf = performanceMonitor.subscribe(measurements => {
      setPerformanceMeasurements(measurements);
    });
    
    return () => {
      unsubscribe();
      unsubscribePerf();
    };
  }, []);

  const simulateError = () => {
    try {
      // Generate a test error
      throw new Error('This is a test error from the Development Tools page');
    } catch (error) {
      if (error instanceof Error) {
        errorTracker.trackError(error, 'DevelopmentToolsPage');
      }
    }
  };

  const simulatePerformanceEntry = () => {
    const perfMark = performanceMonitor.startMeasurement('Test Measurement');
    
    // Simulate some work
    setTimeout(() => {
      performanceMonitor.endMeasurement(perfMark);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Development Tools"
        description="Debug and monitor your application's performance"
        icon={<Bug className="h-6 w-6" />}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Errors ({errors.length})</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  Error Tracking
                </CardTitle>
                <CardDescription>
                  Track and debug application errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errors.length}</div>
                <p className="text-sm text-muted-foreground">Active errors</p>
                <Button 
                  onClick={simulateError} 
                  size="sm" 
                  variant="outline" 
                  className="mt-4"
                >
                  Simulate Error
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Workflow className="h-4 w-4 mr-2" />
                  Performance
                </CardTitle>
                <CardDescription>
                  Monitor application performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMeasurements.length}</div>
                <p className="text-sm text-muted-foreground">Tracked measurements</p>
                <Button 
                  onClick={simulatePerformanceEntry} 
                  size="sm" 
                  variant="outline" 
                  className="mt-4"
                >
                  Simulate Activity
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Database
                </CardTitle>
                <CardDescription>
                  Monitor database performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Database monitoring tools help track query performance and connection status.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>About Development Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Development tools help you debug and monitor your application in real-time. 
                These tools are only available in development mode and won't be included in production builds.
              </p>
              
              <h3 className="font-medium mt-4">Available Features:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Error tracking and inspection</li>
                <li>Performance monitoring</li>
                <li>Database query monitoring</li>
                <li>Component debugging</li>
                <li>Network request tracking</li>
              </ul>
              
              <div className="bg-muted p-4 rounded-md mt-4">
                <p className="text-sm">
                  <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-background rounded border">Ctrl+Shift+D</kbd> to 
                  toggle the development tools overlay from anywhere in the application.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="errors" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Error Log</span>
                <Button 
                  onClick={() => errorTracker.clearErrors()}
                  size="sm"
                  variant="outline"
                  disabled={errors.length === 0}
                >
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No errors have been logged
                </div>
              ) : (
                <div className="space-y-3">
                  {errors.map(error => (
                    <div key={error.id} className="border border-border rounded-md p-3">
                      <div className="font-medium text-destructive">{error.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Source: {error.source} • {new Date(error.timestamp).toLocaleTimeString()}
                      </div>
                      
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground">Stack trace</summary>
                          <pre className="text-xs mt-1 whitespace-pre-wrap bg-muted p-2 rounded">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Performance Measurements</span>
                <Button 
                  onClick={() => performanceMonitor.clearMeasurements()}
                  size="sm"
                  variant="outline"
                  disabled={performanceMeasurements.length === 0}
                >
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceMeasurements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No performance measurements recorded
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Name</th>
                        <th className="py-2 px-4 text-right">Duration</th>
                        <th className="py-2 px-4 text-right">Duration</th>
                        <th className="py-2 px-4 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceMeasurements.map(m => (
                        <tr key={m.id} className="border-b border-border">
                          <td className="py-2 px-4">{m.name}</td>
                          <td className="py-2 px-4 text-right">
                            {m.duration ? 
                              (m.duration > 1000 
                                ? `${(m.duration / 1000).toFixed(2)}s` 
                                : `${m.duration.toFixed(1)}ms`) 
                              : '—'}
                          </td>
                          <td className="py-2 px-4 text-right text-muted-foreground text-xs">
                            {new Date(m.startTime).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Database monitoring tools will be displayed here when data is available.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevelopmentToolsPage;
