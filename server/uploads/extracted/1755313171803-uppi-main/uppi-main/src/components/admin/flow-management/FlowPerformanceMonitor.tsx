import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3,
  TrendingUp,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Users
} from 'lucide-react';
import { flowManagementService, type FlowDefinition, type PromptFlowStatus } from '@/services/flowManagementService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface FlowPerformanceMonitorProps {
  flows: FlowDefinition[];
  flowStatusMap: Map<string, PromptFlowStatus>;
  selectedFlow: FlowDefinition | null;
  onSelectFlow: (flow: FlowDefinition | null) => void;
}

interface PerformanceMetrics {
  totalAssignments: number;
  activeAssignments: number;
  assignmentRate: number;
  activationRate: number;
  flowEfficiency: number;
}

interface FlowStatusData {
  name: string;
  value: number;
  color: string;
}

export const FlowPerformanceMonitor: React.FC<FlowPerformanceMonitorProps> = ({
  flows,
  flowStatusMap,
  selectedFlow,
  onSelectFlow
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);

  // Calculate performance metrics
  useEffect(() => {
    const totalAssignments = Array.from(flowStatusMap.values()).reduce(
      (sum, status) => sum + status.total_assignments, 0
    );
    
    const activeAssignments = Array.from(flowStatusMap.values()).reduce(
      (sum, status) => sum + status.active_assignments, 0
    );
    
    const totalPrompts = flowStatusMap.size;
    const assignedPrompts = Array.from(flowStatusMap.values()).filter(
      status => status.total_assignments > 0
    ).length;
    
    const assignmentRate = totalPrompts > 0 ? (assignedPrompts / totalPrompts) * 100 : 0;
    const activationRate = totalAssignments > 0 ? (activeAssignments / totalAssignments) * 100 : 0;
    const flowEfficiency = (assignmentRate + activationRate) / 2;

    setPerformanceData({
      totalAssignments,
      activeAssignments,
      assignmentRate,
      activationRate,
      flowEfficiency
    });
  }, [flowStatusMap]);

  // Prepare flow status distribution data
  const statusDistribution: FlowStatusData[] = [
    {
      name: 'Active',
      value: Array.from(flowStatusMap.values()).filter(s => s.status === 'active').length,
      color: '#22c55e'
    },
    {
      name: 'Partial',
      value: Array.from(flowStatusMap.values()).filter(s => s.status === 'partial').length,
      color: '#eab308'
    },
    {
      name: 'Inactive',
      value: Array.from(flowStatusMap.values()).filter(s => s.status === 'inactive').length,
      color: '#ef4444'
    },
    {
      name: 'Unassigned',
      value: Array.from(flowStatusMap.values()).filter(s => s.status === 'unassigned').length,
      color: '#6b7280'
    }
  ].filter(item => item.value > 0);

  // Mock time series data for demonstration
  const timeSeriesData = [
    { date: '2025-01-01', assignments: 45, active: 38 },
    { date: '2025-01-02', assignments: 52, active: 45 },
    { date: '2025-01-03', assignments: 48, active: 42 },
    { date: '2025-01-04', assignments: 61, active: 55 },
    { date: '2025-01-05', assignments: 58, active: 52 },
    { date: '2025-01-06', assignments: 65, active: 58 },
    { date: '2025-01-07', assignments: 70, active: 63 },
  ];

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600';
    if (efficiency >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (efficiency >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (efficiency >= 40) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flow Performance Monitor</h2>
          <p className="text-muted-foreground">
            Monitor flow assignment performance and efficiency metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{performanceData.totalAssignments}</div>
                  <div className="text-sm text-muted-foreground">Total Assignments</div>
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
                  <div className="text-2xl font-bold text-green-600">{performanceData.activeAssignments}</div>
                  <div className="text-sm text-muted-foreground">Active Assignments</div>
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
                  <div className="text-2xl font-bold">{performanceData.assignmentRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Assignment Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <div className={cn("text-2xl font-bold", getEfficiencyColor(performanceData.flowEfficiency))}>
                      {performanceData.flowEfficiency.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Flow Efficiency</div>
                  </div>
                  {getEfficiencyBadge(performanceData.flowEfficiency)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Flow Status Distribution</CardTitle>
            <CardDescription>
              Distribution of prompt flow assignment statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <div>No assignment data available</div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assignment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Trends</CardTitle>
            <CardDescription>
              Historical view of flow assignments over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="assignments" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Total Assignments"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Active Assignments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flow Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Flow Performance</CardTitle>
          <CardDescription>
            Detailed performance metrics for each flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No flows available for analysis
            </div>
          ) : (
            <div className="space-y-4">
              {flows.map((flow) => {
                const flowAssignments = Array.from(flowStatusMap.values()).filter(status =>
                  status.flows.some(f => f.flow_name === flow.name)
                );
                
                const totalAssignments = flowAssignments.reduce((sum, status) => 
                  sum + status.flows.filter(f => f.flow_name === flow.name).length, 0
                );
                
                const activeAssignments = flowAssignments.reduce((sum, status) => 
                  sum + status.flows.filter(f => f.flow_name === flow.name && f.is_active_in_flow).length, 0
                );
                
                const activationRate = totalAssignments > 0 ? (activeAssignments / totalAssignments) * 100 : 0;

                return (
                  <div
                    key={flow.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      selectedFlow?.id === flow.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => onSelectFlow(flow)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{flow.name}</h4>
                          <Badge variant={flow.is_active ? "default" : "secondary"}>
                            {flow.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{flow.category}</Badge>
                        </div>
                        
                        {flow.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {flow.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {activeAssignments}/{totalAssignments}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activationRate.toFixed(1)}% active
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${activationRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Automated recommendations for improving flow efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceData && performanceData.assignmentRate < 50 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Low Assignment Rate:</strong> Only {performanceData.assignmentRate.toFixed(1)}% of prompts are assigned to flows. 
                  Consider creating more flow assignments to improve coverage.
                </AlertDescription>
              </Alert>
            )}
            
            {performanceData && performanceData.activationRate < 70 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Low Activation Rate:</strong> Only {performanceData.activationRate.toFixed(1)}% of assignments are active. 
                  Review inactive assignments and activate relevant ones.
                </AlertDescription>
              </Alert>
            )}
            
            {flows.filter(f => !f.is_active).length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Inactive Flows:</strong> {flows.filter(f => !f.is_active).length} flow(s) are inactive. 
                  Consider activating them or removing unnecessary flows to reduce clutter.
                </AlertDescription>
              </Alert>
            )}
            
            {performanceData && performanceData.flowEfficiency >= 80 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Excellent Performance:</strong> Your flow management system is operating at {performanceData.flowEfficiency.toFixed(1)}% efficiency. 
                  Great job maintaining well-organized prompt assignments!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};