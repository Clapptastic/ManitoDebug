import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Loader2, 
  Database, 
  Key, 
  Link, 
  Activity,
  Zap,
  Clock,
  Users,
  BarChart3,
  Eye,
  Server,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TableMetrics {
  table_name: string;
  row_count: number;
  size_mb: number;
  avg_query_time: number;
  queries_per_minute: number;
  last_accessed: string;
}

interface ConnectionStatus {
  id: string;
  type: 'database' | 'api' | 'edge_function' | 'realtime';
  name: string;
  status: 'healthy' | 'warning' | 'error';
  response_time: number;
  last_check: string;
  details: any;
}

interface DataFlow {
  from: string;
  to: string;
  type: 'read' | 'write' | 'update' | 'delete';
  frequency: number;
  avg_response_time: number;
}

// Enhanced Table Node with metrics
const TableNode = ({ data }: { data: any }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'border-green-500 bg-green-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={`border rounded-lg shadow-lg min-w-[280px] ${getStatusColor(data.status)}`}>
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span className="font-semibold text-sm">{data.tableName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          <span className="text-xs">{data.metrics?.queries_per_minute || 0}/min</span>
        </div>
      </div>
      
      <div className="p-3 space-y-2">
        {/* Metrics Bar */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-blue-500" />
            <span>{data.metrics?.row_count || 0} rows</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-green-500" />
            <span>{data.metrics?.size_mb || 0}MB</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-orange-500" />
            <span>{data.metrics?.avg_query_time || 0}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-purple-500" />
            <span className="capitalize">{data.status}</span>
          </div>
        </div>

        {/* Column Preview */}
        <div className="border-t pt-2 space-y-1">
          {data.columns?.slice(0, 4).map((column: any, index: number) => (
            <div key={column.column_name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {column.column_name?.includes('id') && column.column_name?.endsWith('_id') ? (
                  <Key className="h-3 w-3 text-yellow-600" />
                ) : column.column_name === 'id' ? (
                  <Key className="h-3 w-3 text-blue-600" />
                ) : (
                  <div className="w-3 h-3" />
                )}
                <span className="font-mono">{column.column_name || 'unknown'}</span>
              </div>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {column.data_type}
              </Badge>
            </div>
          ))}
          {data.columns?.length > 4 && (
            <div className="text-xs text-muted-foreground text-center py-1">
              +{data.columns.length - 4} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Connection Status Node
const ConnectionNode = ({ data }: { data: any }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'api': return <Globe className="h-4 w-4" />;
      case 'edge_function': return <Zap className="h-4 w-4" />;
      case 'realtime': return <Activity className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'border-green-500 bg-green-50 text-green-700';
      case 'warning': return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'error': return 'border-red-500 bg-red-50 text-red-700';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={`border rounded-lg shadow-md min-w-[200px] ${getStatusColor(data.status)}`}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getIcon(data.type)}
            <span className="font-semibold text-sm">{data.name}</span>
          </div>
          <Badge 
            variant={data.status === 'healthy' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {data.status}
          </Badge>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{data.response_time}ms</span>
          </div>
          <div className="text-muted-foreground">
            Last: {new Date(data.last_check).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
  connection: ConnectionNode,
};

export const EnhancedSchemaVisualizer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schema');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [tableMetrics, setTableMetrics] = useState<TableMetrics[]>([]);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [dataFlows, setDataFlows] = useState<DataFlow[]>([]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const fetchSchemaData = async () => {
    try {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const { data, error } = await supabase.functions.invoke('database-schema', {
        body: { action: 'get-enhanced-schema' },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch enhanced schema');
      }

      generateSchemaVisualization(data.tables || []);
      setTableMetrics(data.metrics || []);
    } catch (error: any) {
      console.error('Enhanced schema fetch error:', error);
      toast({
        title: 'Schema Load Failed',
        description: error.message || 'Failed to load enhanced schema',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionStatus = async () => {
    try {
      // Mock data for now - replace with actual API calls
      const mockConnections: ConnectionStatus[] = [
        {
          id: 'db-main',
          type: 'database',
          name: 'Main Database',
          status: 'healthy',
          response_time: 12,
          last_check: new Date().toISOString(),
          details: { connections: 15, max_connections: 100 }
        },
        {
          id: 'api-supabase',
          type: 'api',
          name: 'Supabase API',
          status: 'healthy',
          response_time: 45,
          last_check: new Date().toISOString(),
          details: { requests_per_minute: 120 }
        },
        {
          id: 'edge-competitor-analysis',
          type: 'edge_function',
          name: 'Competitor Analysis',
          status: 'warning',
          response_time: 850,
          last_check: new Date().toISOString(),
          details: { errors_per_hour: 2 }
        },
        {
          id: 'realtime-channel',
          type: 'realtime',
          name: 'Realtime Updates',
          status: 'healthy',
          response_time: 8,
          last_check: new Date().toISOString(),
          details: { active_channels: 5 }
        }
      ];

      setConnections(mockConnections);
      generateConnectionVisualization(mockConnections);
    } catch (error: any) {
      console.error('Connection status fetch error:', error);
    }
  };

  const fetchDataFlows = async () => {
    try {
      // Mock data flows
      const mockFlows: DataFlow[] = [
        {
          from: 'competitor_analyses',
          to: 'api_usage_costs',
          type: 'write',
          frequency: 15,
          avg_response_time: 120
        },
        {
          from: 'users',
          to: 'profiles',
          type: 'read',
          frequency: 45,
          avg_response_time: 25
        },
        {
          from: 'edge_function_metrics',
          to: 'admin_dashboard',
          type: 'read',
          frequency: 60,
          avg_response_time: 35
        }
      ];

      setDataFlows(mockFlows);
      generateDataFlowVisualization(mockFlows);
    } catch (error: any) {
      console.error('Data flow fetch error:', error);
    }
  };

  const generateSchemaVisualization = (tablesData: any[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const cols = Math.ceil(Math.sqrt(tablesData.length));
    const spacing = 350;

    tablesData.forEach((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const metrics = tableMetrics.find(m => m.table_name === table.table_name);
      const status = metrics ? 
        (metrics.avg_query_time > 1000 ? 'warning' : 'healthy') : 'healthy';
      
      const node: Node = {
        id: table.table_name,
        type: 'table',
        position: { 
          x: col * spacing + 50, 
          y: row * spacing + 50 
        },
        data: {
          tableName: table.table_name,
          columns: table.columns,
          foreignKeys: table.foreignKeys,
          metrics,
          status
        },
      };
      
      newNodes.push(node);

      // Create edges for foreign key relationships
      if (table.foreignKeys) {
        table.foreignKeys.forEach((fk: any, fkIndex: number) => {
          const targetTable = tablesData.find(t => t.table_name === fk.foreign_table_name);
          if (targetTable) {
            const edge: Edge = {
              id: `${table.table_name}-${fk.foreign_table_name}-${fkIndex}`,
              source: table.table_name,
              target: fk.foreign_table_name,
              type: 'smoothstep',
              animated: true,
              style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
              markerEnd: {
                type: 'arrowclosed' as any,
                color: 'hsl(var(--primary))',
              },
              label: `${fk.column_name} → ${fk.foreign_column_name}`,
              labelStyle: { 
                fontSize: 10, 
                fill: 'hsl(var(--primary))',
                fontWeight: 600,
              },
            };
            
            newEdges.push(edge);
          }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const generateConnectionVisualization = (connectionsData: ConnectionStatus[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    connectionsData.forEach((connection, index) => {
      const node: Node = {
        id: connection.id,
        type: 'connection',
        position: { 
          x: (index % 3) * 250 + 50, 
          y: Math.floor(index / 3) * 200 + 50 
        },
        data: { ...connection },
      };
      
      newNodes.push(node);
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const generateDataFlowVisualization = (flowsData: DataFlow[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create nodes for data sources and destinations
    const entities = new Set<string>();
    flowsData.forEach(flow => {
      entities.add(flow.from);
      entities.add(flow.to);
    });

    // Add API and service nodes
    entities.add('Frontend UI');
    entities.add('Edge Functions');
    entities.add('External APIs');
    entities.add('Storage Buckets');

    const entityArray = Array.from(entities);
    const cols = Math.ceil(Math.sqrt(entityArray.length));
    const spacing = 300;

    entityArray.forEach((entity, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const getNodeType = (name: string) => {
        if (name.includes('_')) return 'table';
        return 'connection';
      };

      const getNodeData = (name: string) => {
        if (name.includes('_')) {
          // Table node
          return {
            tableName: name,
            columns: [],
            status: 'healthy',
            metrics: {
              queries_per_minute: Math.floor(Math.random() * 50),
              row_count: Math.floor(Math.random() * 10000),
              size_mb: Math.floor(Math.random() * 100),
              avg_query_time: Math.floor(Math.random() * 200)
            }
          };
        } else {
          // Service node
          return {
            name,
            type: name.includes('API') ? 'api' : name.includes('Edge') ? 'edge_function' : 'realtime',
            status: 'healthy',
            response_time: Math.floor(Math.random() * 100),
            last_check: new Date().toISOString()
          };
        }
      };

      const node: Node = {
        id: entity,
        type: getNodeType(entity),
        position: { 
          x: col * spacing + 50, 
          y: row * spacing + 50 
        },
        data: getNodeData(entity),
      };
      
      newNodes.push(node);
    });

    // Create edges for data flows
    flowsData.forEach((flow, index) => {
      const getEdgeStyle = (type: string) => {
        switch (type) {
          case 'read': return { stroke: '#10b981', strokeWidth: 3 };
          case 'write': return { stroke: '#f59e0b', strokeWidth: 3 };
          case 'update': return { stroke: '#3b82f6', strokeWidth: 3 };
          case 'delete': return { stroke: '#ef4444', strokeWidth: 3 };
          default: return { stroke: '#6b7280', strokeWidth: 2 };
        }
      };

      const edge: Edge = {
        id: `flow-${index}`,
        source: flow.from,
        target: flow.to,
        type: 'smoothstep',
        animated: true,
        style: getEdgeStyle(flow.type),
        markerEnd: {
          type: 'arrowclosed' as any,
          color: getEdgeStyle(flow.type).stroke,
        },
        label: `${flow.type.toUpperCase()} (${flow.frequency}/min)`,
        labelStyle: { 
          fontSize: 10, 
          fill: getEdgeStyle(flow.type).stroke,
          fontWeight: 600,
        },
      };
      
      newEdges.push(edge);
    });

    // Add additional realistic flows
    const additionalFlows = [
      { from: 'Frontend UI', to: 'api_keys', type: 'read' },
      { from: 'Frontend UI', to: 'competitor_analyses', type: 'write' },
      { from: 'Edge Functions', to: 'api_usage_costs', type: 'write' },
      { from: 'Edge Functions', to: 'External APIs', type: 'read' },
      { from: 'profiles', to: 'Storage Buckets', type: 'read' },
      { from: 'documents', to: 'Storage Buckets', type: 'write' },
    ];

    additionalFlows.forEach((flow, index) => {
      if (entities.has(flow.from) && entities.has(flow.to)) {
        const getEdgeStyle = (type: string) => {
          switch (type) {
            case 'read': return { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5,5' };
            case 'write': return { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' };
            default: return { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5,5' };
          }
        };

        const edge: Edge = {
          id: `additional-flow-${index}`,
          source: flow.from,
          target: flow.to,
          type: 'smoothstep',
          animated: false,
          style: getEdgeStyle(flow.type),
          markerEnd: {
            type: 'arrowclosed' as any,
            color: getEdgeStyle(flow.type).stroke,
          },
          label: flow.type.toUpperCase(),
          labelStyle: { 
            fontSize: 9, 
            fill: getEdgeStyle(flow.type).stroke,
            fontWeight: 500,
          },
        };
        
        newEdges.push(edge);
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  useEffect(() => {
    if (activeTab === 'schema') {
      fetchSchemaData();
    } else if (activeTab === 'connections') {
      fetchConnectionStatus();
    } else if (activeTab === 'data-flow') {
      fetchDataFlows();
    }
  }, [activeTab]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'connections') {
        fetchConnectionStatus();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database & Data Flow Visualization
          </CardTitle>
          <Button 
            onClick={() => {
              if (activeTab === 'schema') fetchSchemaData();
              else if (activeTab === 'connections') fetchConnectionStatus();
              else if (activeTab === 'data-flow') fetchDataFlows();
            }} 
            disabled={loading} 
            variant="outline" 
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schema">Enhanced Schema</TabsTrigger>
            <TabsTrigger value="connections">Live Connections</TabsTrigger>
            <TabsTrigger value="data-flow">Data Flow</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schema" className="mt-4">
            <div className="h-[600px] border border-border rounded-lg">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                attributionPosition="top-right"
                style={{ backgroundColor: 'hsl(var(--background))' }}
              >
                <Controls />
                <MiniMap 
                  zoomable 
                  pannable 
                  className="bg-background border border-border rounded"
                />
                <Background variant={'dots' as any} gap={12} size={1} />
              </ReactFlow>
            </div>
          </TabsContent>

          <TabsContent value="connections" className="mt-4">
            <div className="h-[600px] border border-border rounded-lg">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                style={{ backgroundColor: 'hsl(var(--background))' }}
              >
                <Controls />
                <MiniMap 
                  zoomable 
                  pannable 
                  className="bg-background border border-border rounded"
                />
                <Background variant={'dots' as any} gap={12} size={1} />
              </ReactFlow>
            </div>
          </TabsContent>

          <TabsContent value="data-flow" className="mt-4">
            <div className="h-[600px] border border-border rounded-lg">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                style={{ backgroundColor: 'hsl(var(--background))' }}
              >
                <Controls />
                <MiniMap 
                  zoomable 
                  pannable 
                  className="bg-background border border-border rounded"
                />
                <Background variant={'dots' as any} gap={12} size={1} />
              </ReactFlow>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-blue-600" />
            <span>Primary Key</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-yellow-600" />
            <span>Foreign Key</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-600" />
            <span>Active Connection</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span>Performance Metric</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};