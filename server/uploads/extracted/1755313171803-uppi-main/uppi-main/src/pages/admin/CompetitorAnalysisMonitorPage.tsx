import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { competitorProgressService } from '@/services/competitorProgressService';
import { 
  Play, 
  Pause, 
  Copy, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  Zap,
  Eye,
  Settings,
  Activity,
  Cpu,
  Globe
} from 'lucide-react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Position,
  Handle
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  stage: string;
  message: string;
  data?: any;
  sessionId?: string;
}

interface AnalysisSession {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  competitors: string[];
  progress: number;
  currentStage: string;
  startTime?: Date;
  endTime?: Date;
  logs: LogEntry[];
}

// Custom Flow Node Components
const StageNode = ({ data }: { data: any }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-primary-foreground" />;
      case 'running': return <Activity className="h-4 w-4 text-primary-foreground animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-primary-foreground" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`px-4 py-2 rounded-lg border-2 border-white shadow-lg min-w-[180px] relative ${getStatusColor(data.status)}`}>
      {/* ReactFlow Handles */}
      <Handle type="target" position={Position.Left} id="left" className="w-3 h-3 bg-white border-2 border-gray-400" />
      <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 bg-white border-2 border-gray-400" />
      <Handle type="target" position={Position.Top} id="top" className="w-3 h-3 bg-white border-2 border-gray-400" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="w-3 h-3 bg-white border-2 border-gray-400" />
      
      <div className="flex items-center justify-between text-primary-foreground">
        <span className="font-medium text-sm">{data.label}</span>
        {getStatusIcon(data.status)}
      </div>
      {data.details && (
        <div className="text-xs text-primary-foreground/80 mt-1">{data.details}</div>
      )}
      {data.duration && (
        <div className="text-xs text-primary-foreground/60 mt-1">{data.duration}ms</div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  stage: StageNode,
};

const CompetitorAnalysisMonitorPage: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<AnalysisSession | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [testCompetitor, setTestCompetitor] = useState('Microsoft');
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize flow nodes
  const initializeFlowNodes = useCallback(() => {
    const initialNodes: Node[] = [
      {
        id: '1',
        type: 'stage',
        position: { x: 50, y: 100 },
        data: { label: 'API Key Validation', status: 'pending', stage: 'validation' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      },
      {
        id: '2',
        type: 'stage',
        position: { x: 300, y: 100 },
        data: { label: 'Initialize Session', status: 'pending', stage: 'initialization' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      },
      {
        id: '3',
        type: 'stage',
        position: { x: 550, y: 100 },
        data: { label: 'AI Analysis', status: 'pending', stage: 'analysis' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      },
      {
        id: '4',
        type: 'stage',
        position: { x: 800, y: 100 },
        data: { label: 'Data Processing', status: 'pending', stage: 'processing' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      },
      {
        id: '5',
        type: 'stage',
        position: { x: 1050, y: 100 },
        data: { label: 'Database Save', status: 'pending', stage: 'saving' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      },
      {
        id: '6',
        type: 'stage',
        position: { x: 550, y: 250 },
        data: { label: 'Real-time Updates', status: 'pending', stage: 'realtime' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      }
    ];

    const initialEdges: Edge[] = [
      { 
        id: 'e1-2', 
        source: '1', 
        target: '2', 
        type: 'smoothstep', 
        animated: false,
        sourceHandle: 'right',
        targetHandle: 'left'
      },
      { 
        id: 'e2-3', 
        source: '2', 
        target: '3', 
        type: 'smoothstep', 
        animated: false,
        sourceHandle: 'right',
        targetHandle: 'left'
      },
      { 
        id: 'e3-4', 
        source: '3', 
        target: '4', 
        type: 'smoothstep', 
        animated: false,
        sourceHandle: 'right',
        targetHandle: 'left'
      },
      { 
        id: 'e4-5', 
        source: '4', 
        target: '5', 
        type: 'smoothstep', 
        animated: false,
        sourceHandle: 'right',
        targetHandle: 'left'
      },
      { 
        id: 'e2-6', 
        source: '2', 
        target: '6', 
        type: 'smoothstep', 
        animated: false,
        sourceHandle: 'bottom',
        targetHandle: 'top'
      },
      { 
        id: 'e3-6', 
        source: '3', 
        target: '6', 
        type: 'smoothstep', 
        animated: false,
        sourceHandle: 'bottom',
        targetHandle: 'top'
      },
      { 
        id: 'e4-6', 
        source: '4', 
        target: '6', 
        type: 'smoothstep', 
        animated: false,
        sourceHandle: 'bottom',
        targetHandle: 'top'
      }
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [setNodes, setEdges]);

  // Update node status
  const updateNodeStatus = useCallback((stage: string, status: string, details?: string, duration?: number) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.data.stage === stage) {
          return {
            ...node,
            data: {
              ...node.data,
              status,
              details,
              duration
            }
          };
        }
        return node;
      })
    );

    // Update edge animation for current stage
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: status === 'running'
      }))
    );
  }, [setNodes, setEdges]);

  // Add log entry
  const addLog = useCallback((level: LogEntry['level'], stage: string, message: string, data?: any) => {
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      stage,
      message,
      data,
      sessionId: currentSession?.id
    };

    setLogs(prev => [logEntry, ...prev].slice(0, 1000)); // Keep last 1000 logs
    
    // Update visual flow
    if (level === 'error') {
      updateNodeStatus(stage, 'failed', message);
    } else if (message.includes('completed') || message.includes('success')) {
      updateNodeStatus(stage, 'completed', message);
    } else if (message.includes('starting') || message.includes('running')) {
      updateNodeStatus(stage, 'running', message);
    }
  }, [currentSession?.id, updateNodeStatus]);

  // Start monitoring session
  const startAnalysisTest = async () => {
    if (!testCompetitor.trim()) {
      toast({
        title: "Error",
        description: "Please enter a competitor name",
        variant: "destructive"
      });
      return;
    }

    setIsMonitoring(true);
    setLogs([]);
    
    const sessionId = crypto.randomUUID();
    const session: AnalysisSession = {
      id: sessionId,
      status: 'running',
      competitors: [testCompetitor],
      progress: 0,
      currentStage: 'validation',
      startTime: new Date(),
      logs: []
    };
    
    setCurrentSession(session);
    addLog('info', 'session', `Starting analysis for: ${testCompetitor}`, { sessionId });

    try {
      // Step 1: API Key Validation
      addLog('info', 'validation', 'Checking API key status...');
      updateNodeStatus('validation', 'running', 'Validating API keys');
      
      const { data: apiKeyData, error: apiKeyError } = await supabase.functions.invoke('check-api-keys');
      
      if (apiKeyError) {
        addLog('error', 'validation', `API validation failed: ${apiKeyError.message}`, apiKeyError);
        throw new Error(`API validation failed: ${apiKeyError.message}`);
      }
      
      if (!apiKeyData?.success) {
        const errorMsg = apiKeyData?.error || 'Unknown API validation error';
        addLog('error', 'validation', `API validation failed: ${errorMsg}`, apiKeyData);
        throw new Error(`API validation failed: ${errorMsg}`);
      }
      
      const workingKeysCount = apiKeyData.workingCount || 0;
      const totalKeysCount = apiKeyData.totalKeys || 0;
      addLog('info', 'validation', `API keys validated successfully: ${workingKeysCount}/${totalKeysCount} working`, {
        workingKeys: apiKeyData.workingKeys || [],
        apiKeys: apiKeyData.apiKeys || {}
      });
      updateNodeStatus('validation', 'completed', `${workingKeysCount}/${totalKeysCount} API keys working`);
      
      // Step 2: Initialize Session
      addLog('info', 'initialization', 'Initializing progress tracking...');
      updateNodeStatus('initialization', 'running', 'Setting up session');
      
      const progressSessionId = await competitorProgressService.initializeProgress(1, [testCompetitor]);
      addLog('info', 'initialization', `Session initialized: ${progressSessionId}`, { progressSessionId });
      updateNodeStatus('initialization', 'completed', `Session: ${progressSessionId.substring(0, 8)}...`);

      // Step 3: AI Analysis
      addLog('info', 'analysis', 'Starting AI competitor analysis...');
      updateNodeStatus('analysis', 'running', 'AI processing competitor data');
      
      const analysisStart = Date.now();
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('competitor-analysis', {
        body: {
          action: 'start', // Fix 400: explicit action with competitors
          competitors: [testCompetitor],
          focusAreas: [],
          sessionId: progressSessionId
        }
      });
      
      const analysisDuration = Date.now() - analysisStart;
      
      if (analysisError) {
        throw new Error(`Analysis failed: ${analysisError.message}`);
      }
      
      addLog('info', 'analysis', `AI analysis completed in ${analysisDuration}ms`, analysisData);
      updateNodeStatus('analysis', 'completed', 'AI analysis complete', analysisDuration);

      // Step 4: Data Processing
      addLog('info', 'processing', 'Processing analysis results...');
      updateNodeStatus('processing', 'running', 'Structuring data');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('info', 'processing', 'Data processing completed');
      updateNodeStatus('processing', 'completed', 'Data structured');

      // Step 5: Database Save
      addLog('info', 'saving', 'Saving to database...');
      updateNodeStatus('saving', 'running', 'Writing to database');
      
      const { data: dbData, error: dbError } = await supabase
        .from('competitor_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (dbError) {
        addLog('error', 'saving', `Database error: ${dbError.message}`, dbError);
        updateNodeStatus('saving', 'failed', dbError.message);
      } else {
        addLog('info', 'saving', 'Successfully saved to database', dbData);
        updateNodeStatus('saving', 'completed', 'Data persisted');
      }

      // Step 6: Real-time Updates
      addLog('info', 'realtime', 'Broadcasting real-time updates...');
      updateNodeStatus('realtime', 'running', 'Sending updates');
      
      await competitorProgressService.completeProgress({
        [testCompetitor]: { success: true, data: analysisData, error: null }
      });
      addLog('info', 'realtime', 'Real-time updates sent');
      updateNodeStatus('realtime', 'completed', 'Updates broadcast');

      // Complete session
      setCurrentSession(prev => prev ? { ...prev, status: 'completed', endTime: new Date() } : null);
      addLog('info', 'session', 'Analysis session completed successfully');
      
      toast({
        title: "✅ Analysis Complete",
        description: `Successfully analyzed ${testCompetitor}`,
      });

    } catch (error: any) {
      addLog('error', 'session', `Analysis failed: ${error.message}`, error);
      setCurrentSession(prev => prev ? { ...prev, status: 'failed', endTime: new Date() } : null);
      
      toast({
        title: "❌ Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsMonitoring(false);
    }
  };

  // Copy logs for AI debugging
  const copyLogsForAI = () => {
    const filteredLogs = selectedLogLevel === 'all' 
      ? logs 
      : logs.filter(log => log.level === selectedLogLevel);

    const logContext = {
      session: currentSession,
      timestamp: new Date().toISOString(),
      totalLogs: filteredLogs.length,
      systemStatus: {
        isMonitoring,
        currentStage: currentSession?.currentStage,
        progress: currentSession?.progress
      },
      logs: filteredLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level.toUpperCase(),
        stage: log.stage,
        message: log.message,
        data: log.data
      }))
    };

    const formattedContext = `# Competitor Analysis Debug Context
    
## Session Information
- Session ID: ${currentSession?.id || 'None'}
- Status: ${currentSession?.status || 'No session'}
- Competitors: ${currentSession?.competitors?.join(', ') || 'None'}
- Current Stage: ${currentSession?.currentStage || 'None'}
- Progress: ${currentSession?.progress || 0}%

## System Status
- Monitoring Active: ${isMonitoring}
- Total Logs: ${filteredLogs.length}
- Log Level Filter: ${selectedLogLevel}

## Detailed Logs
${JSON.stringify(logContext.logs, null, 2)}

## Raw Session Data
${JSON.stringify(currentSession, null, 2)}
`;

    navigator.clipboard.writeText(formattedContext);
    toast({
      title: "📋 Context Copied",
      description: "Debug context copied to clipboard for AI analysis",
    });
  };

  // Download logs
  const downloadLogs = () => {
    const logsData = {
      session: currentSession,
      logs: logs,
      exported: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competitor-analysis-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    setCurrentSession(null);
    initializeFlowNodes();
    toast({
      title: "🧹 Logs Cleared",
      description: "All logs and session data cleared",
    });
  };

  // Initialize on mount
  useEffect(() => {
    initializeFlowNodes();
  }, [initializeFlowNodes]);

  // Filter logs
  const filteredLogs = selectedLogLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === selectedLogLevel);

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-gray-700';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'warn': return <Clock className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      case 'debug': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competitor Analysis Monitor</h1>
          <p className="text-muted-foreground">Real-time visualization and debugging for competitor analysis flow</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={currentSession?.status === 'running' ? 'default' : 'secondary'}>
            {currentSession?.status || 'Idle'}
          </Badge>
          {isMonitoring && <Activity className="h-4 w-4 animate-spin text-blue-500" />}
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Analysis Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testCompetitor">Test Competitor</Label>
              <Input
                id="testCompetitor"
                value={testCompetitor}
                onChange={(e) => setTestCompetitor(e.target.value)}
                placeholder="Enter competitor name..."
                disabled={isMonitoring}
              />
            </div>
            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={startAnalysisTest} 
                  disabled={isMonitoring || !testCompetitor.trim()}
                  size="sm"
                >
                  {isMonitoring ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Test
                    </>
                  )}
                </Button>
                <Button onClick={clearLogs} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Debug Tools</Label>
              <div className="flex gap-2">
                <Button onClick={copyLogsForAI} variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy for AI
                </Button>
                <Button onClick={downloadLogs} variant="outline" size="sm" disabled={logs.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Analysis Flow Visualization
          </CardTitle>
          <CardDescription>
            Real-time visual representation of the competitor analysis pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 border rounded-lg">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Logs Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Real-time Logs & Debugging
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="logLevel">Filter:</Label>
            <select
              id="logLevel"
              value={selectedLogLevel}
              onChange={(e) => setSelectedLogLevel(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors Only</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            <Badge variant="outline">{filteredLogs.length} logs</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full border rounded-lg p-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Eye className="mx-auto h-8 w-8 mb-2" />
                <p>No logs yet. Start an analysis to see real-time logs.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 border rounded hover:bg-muted/50">
                    <div className={`mt-0.5 ${getLogLevelColor(log.level)}`}>
                      {getLogLevelIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.stage}
                        </Badge>
                        <span className={`font-medium ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{log.message}</p>
                      {log.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Show data
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitorAnalysisMonitorPage;