import React, { useState } from 'react';
import { useBusinessIntelligence } from '@/hooks/useBusinessIntelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BarChart3, LineChart, PieChart, Download, Calendar, Settings, TrendingUp, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const AdvancedAnalyticsPage: React.FC = () => {
  const {
    dashboards,
    selectedDashboard,
    setSelectedDashboard,
    visualizations,
    scheduledExports,
    businessMetrics,
    advancedAnalytics,
    createDashboard,
    createVisualization,
    createScheduledExport,
    exportDashboard,
    isLoading
  } = useBusinessIntelligence();

  // Form states
  const [dashboardForm, setDashboardForm] = useState({
    name: '',
    description: '',
    is_public: false,
    tags: ''
  });

  const [vizForm, setVizForm] = useState({
    name: '',
    chart_type: 'line',
    data_source: 'business_metrics',
    chart_config: '{"title": "New Chart", "dataKey": "value"}'
  });

  const [exportForm, setExportForm] = useState({
    name: '',
    export_type: 'csv',
    schedule_cron: '0 9 * * 1'
  });

  // Dialog states
  const [showCreateDashboard, setShowCreateDashboard] = useState(false);
  const [showCreateViz, setShowCreateViz] = useState(false);
  const [showCreateExport, setShowCreateExport] = useState(false);

  // Sample data for charts
  const sampleMetricsData = businessMetrics.slice(0, 10).map((metric, index) => ({
    name: `Day ${index + 1}`,
    value: metric.metric_value,
    date: new Date(metric.created_at).toLocaleDateString()
  }));

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const handleCreateDashboard = async () => {
    if (!dashboardForm.name.trim()) {
      toast.error('Dashboard name is required');
      return;
    }

    const dashboard = await createDashboard({
      name: dashboardForm.name,
      description: dashboardForm.description,
      is_public: dashboardForm.is_public,
      tags: dashboardForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });

    if (dashboard) {
      setDashboardForm({ name: '', description: '', is_public: false, tags: '' });
      setShowCreateDashboard(false);
    }
  };

  const handleCreateVisualization = async () => {
    if (!selectedDashboard) {
      toast.error('Please select a dashboard first');
      return;
    }

    if (!vizForm.name.trim()) {
      toast.error('Visualization name is required');
      return;
    }

    try {
      const viz = await createVisualization({
        dashboard_id: selectedDashboard.id,
        name: vizForm.name,
        chart_type: vizForm.chart_type,
        data_source: vizForm.data_source,
        chart_config: JSON.parse(vizForm.chart_config)
      });

      if (viz) {
        setVizForm({
          name: '',
          chart_type: 'line',
          data_source: 'business_metrics',
          chart_config: '{"title": "New Chart", "dataKey": "value"}'
        });
        setShowCreateViz(false);
      }
    } catch (error) {
      toast.error('Invalid JSON in chart configuration');
    }
  };

  const handleCreateExport = async () => {
    const exportData = await createScheduledExport({
      name: exportForm.name,
      export_type: exportForm.export_type,
      schedule_cron: exportForm.schedule_cron,
      data_query: { dashboard_id: selectedDashboard?.id }
    });

    if (exportData) {
      setExportForm({ name: '', export_type: 'csv', schedule_cron: '0 9 * * 1' });
      setShowCreateExport(false);
    }
  };

  const handleExportDashboard = async (format: 'csv' | 'json' | 'pdf') => {
    if (!selectedDashboard) {
      toast.error('Please select a dashboard to export');
      return;
    }

    await exportDashboard(selectedDashboard.id, format);
  };

  const renderChart = (viz: any) => {
    const config = typeof viz.chart_config === 'string' ? JSON.parse(viz.chart_config) : viz.chart_config;
    
    switch (viz.chart_type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsLineChart data={sampleMetricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sampleMetricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieData = sampleMetricsData.slice(0, 5).map((item, index) => ({
          ...item,
          fill: chartColors[index % chartColors.length]
        }));
        return (
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-2" />
            <p>Chart preview not available</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
        <p className="text-muted-foreground">Create dashboards, visualizations, and manage data exports.</p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dashboards</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboards.length}</div>
            <p className="text-xs text-muted-foreground">
              {dashboards.filter(d => d.is_public).length} public
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizations</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visualizations.length}</div>
            <p className="text-xs text-muted-foreground">
              {visualizations.filter(v => v.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledExports.length}</div>
            <p className="text-xs text-muted-foreground">
              {scheduledExports.filter(e => e.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Metrics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.length}</div>
            <p className="text-xs text-muted-foreground">Data points tracked</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Dashboards Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Dashboards</CardTitle>
                <Dialog open={showCreateDashboard} onOpenChange={setShowCreateDashboard}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Dashboard</DialogTitle>
                      <DialogDescription>Set up a new analytics dashboard</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="dashboard-name">Dashboard Name</Label>
                        <Input
                          id="dashboard-name"
                          value={dashboardForm.name}
                          onChange={(e) => setDashboardForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter dashboard name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dashboard-description">Description</Label>
                        <Textarea
                          id="dashboard-description"
                          value={dashboardForm.description}
                          onChange={(e) => setDashboardForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dashboard-tags">Tags (comma-separated)</Label>
                        <Input
                          id="dashboard-tags"
                          value={dashboardForm.tags}
                          onChange={(e) => setDashboardForm(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="analytics, reports, metrics"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is-public"
                          checked={dashboardForm.is_public}
                          onChange={(e) => setDashboardForm(prev => ({ ...prev, is_public: e.target.checked }))}
                        />
                        <Label htmlFor="is-public">Make public</Label>
                      </div>
                      <Button onClick={handleCreateDashboard} className="w-full">
                        Create Dashboard
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboards.map((dashboard) => (
                  <div
                    key={dashboard.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDashboard?.id === dashboard.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedDashboard(dashboard)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{dashboard.name}</h4>
                      {dashboard.is_public && <Eye className="h-3 w-3" />}
                    </div>
                    {dashboard.description && (
                      <p className="text-xs opacity-75 truncate">{dashboard.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(dashboard.tags as string[]).slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {dashboards.length === 0 && (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    No dashboards yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedDashboard ? (
            <div className="space-y-6">
              {/* Dashboard Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedDashboard.name}
                        {selectedDashboard.is_public && <Badge>Public</Badge>}
                      </CardTitle>
                      <CardDescription>{selectedDashboard.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExportDashboard('csv')}>
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExportDashboard('json')}>
                        JSON
                      </Button>
                      <Dialog open={showCreateViz} onOpenChange={setShowCreateViz}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Chart
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Visualization</DialogTitle>
                            <DialogDescription>Create a new chart for this dashboard</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="viz-name">Chart Name</Label>
                              <Input
                                id="viz-name"
                                value={vizForm.name}
                                onChange={(e) => setVizForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter chart name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="chart-type">Chart Type</Label>
                              <select
                                id="chart-type"
                                value={vizForm.chart_type}
                                onChange={(e) => setVizForm(prev => ({ ...prev, chart_type: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="line">Line Chart</option>
                                <option value="bar">Bar Chart</option>
                                <option value="pie">Pie Chart</option>
                                <option value="area">Area Chart</option>
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="data-source">Data Source</Label>
                              <select
                                id="data-source"
                                value={vizForm.data_source}
                                onChange={(e) => setVizForm(prev => ({ ...prev, data_source: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="business_metrics">Business Metrics</option>
                                <option value="user_activity">User Activity</option>
                                <option value="api_usage">API Usage</option>
                                <option value="custom_query">Custom Query</option>
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="chart-config">Chart Configuration (JSON)</Label>
                              <Textarea
                                id="chart-config"
                                value={vizForm.chart_config}
                                onChange={(e) => setVizForm(prev => ({ ...prev, chart_config: e.target.value }))}
                                placeholder='{"title": "Chart Title", "dataKey": "value"}'
                                rows={3}
                              />
                            </div>
                            <Button onClick={handleCreateVisualization} className="w-full">
                              Add Visualization
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Visualizations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visualizations.map((viz) => (
                  <Card key={viz.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{viz.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{viz.chart_type}</Badge>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderChart(viz)}
                    </CardContent>
                  </Card>
                ))}
                
                {visualizations.length === 0 && (
                  <Card className="md:col-span-2">
                    <CardContent className="flex items-center justify-center h-48">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No visualizations yet</h3>
                        <p className="text-muted-foreground mb-4">Add your first chart to start visualizing data</p>
                        <Button onClick={() => setShowCreateViz(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Visualization
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Scheduled Exports */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Scheduled Exports
                    </CardTitle>
                    <Dialog open={showCreateExport} onOpenChange={setShowCreateExport}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Schedule Export
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Schedule Data Export</DialogTitle>
                          <DialogDescription>Set up automated data exports</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="export-name">Export Name</Label>
                            <Input
                              id="export-name"
                              value={exportForm.name}
                              onChange={(e) => setExportForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Weekly Dashboard Report"
                            />
                          </div>
                          <div>
                            <Label htmlFor="export-type">Export Format</Label>
                            <select
                              id="export-type"
                              value={exportForm.export_type}
                              onChange={(e) => setExportForm(prev => ({ ...prev, export_type: e.target.value }))}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="csv">CSV</option>
                              <option value="json">JSON</option>
                              <option value="pdf">PDF</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="schedule-cron">Schedule (Cron)</Label>
                            <Input
                              id="schedule-cron"
                              value={exportForm.schedule_cron}
                              onChange={(e) => setExportForm(prev => ({ ...prev, schedule_cron: e.target.value }))}
                              placeholder="0 9 * * 1 (Every Monday at 9 AM)"
                            />
                          </div>
                          <Button onClick={handleCreateExport} className="w-full">
                            Schedule Export
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {scheduledExports.length > 0 ? (
                    <div className="space-y-3">
                      {scheduledExports.slice(0, 5).map((export_) => (
                        <div key={export_.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{export_.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {export_.export_type.toUpperCase()} • {export_.schedule_cron}
                            </p>
                          </div>
                          <Badge variant={export_.is_active ? 'default' : 'secondary'}>
                            {export_.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No scheduled exports configured
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">Select a Dashboard</h3>
                  <p className="text-muted-foreground mb-4">Choose a dashboard from the sidebar to view and manage visualizations</p>
                  <Button onClick={() => setShowCreateDashboard(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPage;