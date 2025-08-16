import React, { useState } from 'react';
import { useCustomReports } from '@/hooks/useCustomReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Play, Share, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const reportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  query_config: z.string().min(1, 'Query configuration is required'),
  is_shared: z.boolean().default(false)
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function CustomReportsPage() {
  const { reports, sharedReports, isLoading, createReport, updateReport, deleteReport, runReport } = useCustomReports();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [runningReports, setRunningReports] = useState<Set<string>>(new Set());

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: '',
      description: '',
      query_config: '',
      is_shared: false
    }
  });

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSharedReports = sharedReports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateReport = async (data: ReportFormData) => {
    try {
      const queryConfig = JSON.parse(data.query_config);
      
      const newReport = await createReport({
        name: data.name,
        description: data.description,
        query_config: queryConfig,
        is_shared: data.is_shared
      });

      if (newReport) {
        setIsCreateDialogOpen(false);
        form.reset();
      }
    } catch (error) {
      toast.error('Invalid JSON in query configuration');
    }
  };

  const handleRunReport = async (reportId: string) => {
    setRunningReports(prev => new Set(prev).add(reportId));
    
    try {
      const result = await runReport(reportId);
      
      if (result.success) {
        // In a real app, you might navigate to a results page or show results inline
        console.log('Report results:', result.data);
      }
    } finally {
      setRunningReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      await deleteReport(reportId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Reports</h1>
          <p className="text-muted-foreground">
            Create and manage custom business intelligence reports
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Custom Report</DialogTitle>
              <DialogDescription>
                Build a custom report with your own query configuration
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateReport)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Custom Report" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this report shows..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="query_config"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Query Configuration (JSON)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{"table": "users", "metrics": ["count"], "filters": {}}'
                          className="font-mono text-sm min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_shared"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Share Report</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Make this report visible to other users
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Report</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="my-reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-reports">
            My Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="shared-reports">
            Shared Reports ({sharedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-reports" className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first custom report to get started
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        {report.description && (
                          <CardDescription>{report.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {report.is_shared && (
                          <Badge variant="secondary">
                            <Share className="mr-1 h-3 w-3" />
                            Shared
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {report.last_run_at ? (
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Last run: {new Date(report.last_run_at).toLocaleDateString()}
                        </div>
                      ) : (
                        'Never run'
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRunReport(report.id)}
                        disabled={runningReports.has(report.id)}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        {runningReports.has(report.id) ? 'Running...' : 'Run'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared-reports" className="space-y-4">
          {filteredSharedReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Share className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No shared reports</h3>
                <p className="text-muted-foreground">
                  No reports have been shared by other users yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSharedReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    {report.description && (
                      <CardDescription>{report.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {report.last_run_at ? (
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Last run: {new Date(report.last_run_at).toLocaleDateString()}
                        </div>
                      ) : (
                        'Never run'
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleRunReport(report.id)}
                      disabled={runningReports.has(report.id)}
                      className="w-full"
                    >
                      <Play className="mr-1 h-3 w-3" />
                      {runningReports.has(report.id) ? 'Running...' : 'Run Report'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}