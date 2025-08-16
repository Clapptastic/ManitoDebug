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
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2, Database, Key, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface ForeignKey {
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

interface DatabaseTable {
  table_name: string;
  table_type: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
}

// Custom table node component
const TableNode = ({ data }: { data: any }) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg min-w-[250px]">
      <div className="bg-blue-600 text-white px-3 py-2 rounded-t-lg flex items-center gap-2">
        <Database className="h-4 w-4" />
        <span className="font-semibold text-sm">{data.tableName}</span>
      </div>
      <div className="p-3 space-y-1">
        {data.columns.slice(0, 6).map((column: Column, index: number) => (
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
            <Badge 
              variant="outline" 
              className="text-xs px-1 py-0"
            >
              {column.data_type}
            </Badge>
          </div>
        ))}
        {data.columns.length > 6 && (
          <div className="text-xs text-gray-500 text-center py-1">
            +{data.columns.length - 6} more columns
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
};

export const SchemaVisualizer: React.FC = () => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const fetchSchema = async () => {
    try {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const { data, error } = await supabase.functions.invoke('database-schema', {
        body: { action: 'get-tables' },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch database schema');
      }

      setTables(data.tables || []);
      generateGraph(data.tables || []);
    } catch (error: any) {
      console.error('Schema fetch error:', error);
      toast({
        title: 'Schema Load Failed',
        description: error.message || 'Failed to load database schema',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateGraph = (tablesData: DatabaseTable[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Calculate positions in a grid layout
    const cols = Math.ceil(Math.sqrt(tablesData.length));
    const spacing = 350;

    tablesData.forEach((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
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
          foreignKeys: table.foreignKeys
        },
      };
      
      newNodes.push(node);

      // Create edges for foreign key relationships
      if (table.foreignKeys) {
        table.foreignKeys.forEach((fk, fkIndex) => {
          const targetTable = tablesData.find(t => t.table_name === fk.foreign_table_name);
          if (targetTable) {
            const edge: Edge = {
              id: `${table.table_name}-${fk.foreign_table_name}-${fkIndex}`,
              source: table.table_name,
              target: fk.foreign_table_name,
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#6366f1', strokeWidth: 2 },
              markerEnd: {
                type: 'arrowclosed' as any,
                color: '#6366f1',
              },
              label: `${fk.column_name} → ${fk.foreign_column_name}`,
              labelStyle: { 
                fontSize: 10, 
                fill: '#6366f1',
                fontWeight: 600,
              },
              labelBgStyle: { 
                fill: 'white', 
                fillOpacity: 0.8,
                stroke: '#6366f1',
                strokeWidth: 1
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

  useEffect(() => {
    fetchSchema();
  }, []);

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
            Database Schema Visualization
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {tables.length} tables
            </Badge>
            <Button onClick={fetchSchema} disabled={loading} variant="outline" size="sm">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] border border-gray-200 rounded-lg">
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
            style={{ backgroundColor: '#f8fafc' }}
          >
            <Controls />
            <MiniMap 
              zoomable 
              pannable 
              className="bg-white border border-gray-200 rounded"
              nodeColor={(node) => {
                return '#3b82f6';
              }}
            />
            <Background variant={'dots' as any} gap={12} size={1} />
          </ReactFlow>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-blue-600" />
            <span>Primary Key</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-yellow-600" />
            <span>Foreign Key</span>
          </div>
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-indigo-600" />
            <span>Relationship</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};