import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Workflow, 
  Plus, 
  Settings, 
  Activity, 
  BarChart3, 
  TestTube,
  Shuffle,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import { flowManagementService, type FlowDefinition } from '@/services/flowManagementService';
import { usePromptManagement } from '@/hooks/usePromptManagement';
import { useFlowStatus } from '@/hooks/useFlowStatus';
import { FlowDefinitionManager } from '@/components/admin/flow-management/FlowDefinitionManager';
import { FlowAssignmentInterface } from '@/components/admin/flow-management/FlowAssignmentInterface';
import { FlowTestingPanel } from '@/components/admin/flow-management/FlowTestingPanel';
import { FlowPerformanceMonitor } from '@/components/admin/flow-management/FlowPerformanceMonitor';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export const FlowManagementPage: React.FC = () => {
  const [flows, setFlows] = useState<FlowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFlow, setSelectedFlow] = useState<FlowDefinition | null>(null);

  const { templates } = usePromptManagement();
  const { flowStatusMap, refreshStatus } = useFlowStatus(templates.map(t => t.id));

  // Load flows on mount
  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const flowsData = await flowManagementService.getFlowDefinitions();
      setFlows(flowsData);
      if (flowsData.length > 0 && !selectedFlow) {
        setSelectedFlow(flowsData[0]);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
      toast({
        title: 'Error loading flows',
        description: 'Failed to load flow definitions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFlowChange = () => {
    loadFlows();
    refreshStatus();
  };

  // Calculate overview statistics
  const stats = {
    totalFlows: flows.length,
    activeFlows: flows.filter(f => f.is_active).length,
    totalAssignments: Array.from(flowStatusMap.values()).reduce((sum, status) => sum + status.total_assignments, 0),
    activeAssignments: Array.from(flowStatusMap.values()).reduce((sum, status) => sum + status.active_assignments, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Workflow className="h-12 w-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
          <div className="text-lg font-medium">Loading Flow Management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flow Management</h1>
          <p className="text-muted-foreground">
            Manage AI prompt flows, assignments, and performance monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              loadFlows();
              refreshStatus();
            }}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Workflow className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalFlows}</div>
                <div className="text-sm text-muted-foreground">Total Flows</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.activeFlows}</div>
                <div className="text-sm text-muted-foreground">Active Flows</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                <div className="text-sm text-muted-foreground">Total Assignments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.activeAssignments}</div>
                <div className="text-sm text-muted-foreground">Active Assignments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flow Status Alert */}
      {flows.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No flows have been defined yet. Create your first flow to start managing prompt assignments.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="definitions" className="gap-2">
            <Settings className="h-4 w-4" />
            Flow Definitions
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Workflow className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="testing" className="gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Flow List */}
            <Card>
              <CardHeader>
                <CardTitle>Flow Definitions</CardTitle>
                <CardDescription>
                  Overview of all defined flows and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No flows defined yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flows.map((flow) => (
                      <div
                        key={flow.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          selectedFlow?.id === flow.id && "border-primary bg-primary/5"
                        )}
                        onClick={() => setSelectedFlow(flow)}
                      >
                        <div>
                          <div className="font-medium">{flow.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {flow.description || 'No description'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={flow.is_active ? "default" : "secondary"}>
                            {flow.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {flow.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common flow management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('definitions')}
                >
                  <Plus className="h-4 w-4" />
                  Create New Flow
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('assignments')}
                  disabled={flows.length === 0}
                >
                  <Workflow className="h-4 w-4" />
                  Manage Assignments
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('testing')}
                  disabled={flows.length === 0}
                >
                  <TestTube className="h-4 w-4" />
                  Test Flows
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('performance')}
                  disabled={flows.length === 0}
                >
                  <BarChart3 className="h-4 w-4" />
                  View Performance
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="definitions">
          <FlowDefinitionManager
            flows={flows}
            onFlowChange={handleFlowChange}
            selectedFlow={selectedFlow}
            onSelectFlow={setSelectedFlow}
          />
        </TabsContent>

        <TabsContent value="assignments">
          <FlowAssignmentInterface
            flows={flows}
            templates={templates}
            flowStatusMap={flowStatusMap}
            onAssignmentChange={handleFlowChange}
            selectedFlow={selectedFlow}
            onSelectFlow={setSelectedFlow}
          />
        </TabsContent>

        <TabsContent value="testing">
          <FlowTestingPanel
            flows={flows.filter(f => f.is_active)}
            templates={templates}
            selectedFlow={selectedFlow}
            onSelectFlow={setSelectedFlow}
          />
        </TabsContent>

        <TabsContent value="performance">
          <FlowPerformanceMonitor
            flows={flows}
            flowStatusMap={flowStatusMap}
            selectedFlow={selectedFlow}
            onSelectFlow={setSelectedFlow}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FlowManagementPage;