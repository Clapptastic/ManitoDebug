import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Search,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Workflow,
  Users,
  Zap
} from 'lucide-react';
import { flowManagementService, type FlowDefinition, type PromptFlowStatus } from '@/services/flowManagementService';
import { FlowStatusIndicator } from './FlowStatusIndicator';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { PromptTemplate } from '@/types/prompts';

interface FlowAssignmentInterfaceProps {
  flows: FlowDefinition[];
  templates: PromptTemplate[];
  flowStatusMap: Map<string, PromptFlowStatus>;
  onAssignmentChange: () => void;
  selectedFlow: FlowDefinition | null;
  onSelectFlow: (flow: FlowDefinition | null) => void;
}

interface DraggablePromptProps {
  template: PromptTemplate;
  flowStatus?: PromptFlowStatus;
}

interface DroppableFlowProps {
  flow: FlowDefinition;
  onDrop: (templateId: string, flowId: string) => void;
  children: React.ReactNode;
}

const DraggablePrompt: React.FC<DraggablePromptProps> = ({ template, flowStatus }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'prompt',
    item: { id: template.id, name: template.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={cn(
        "p-3 border rounded-lg cursor-move transition-all duration-200",
        "hover:shadow-md hover:border-primary/50",
        isDragging && "opacity-50",
        !template.isActive && "opacity-60 bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{template.name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {template.category.replace('_', ' ')}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {!template.isActive && (
            <Badge variant="secondary" className="text-xs">Inactive</Badge>
          )}
          {flowStatus && (
            <FlowStatusIndicator status={flowStatus} variant="icon" />
          )}
        </div>
      </div>
    </div>
  );
};

const DroppableFlow: React.FC<DroppableFlowProps> = ({ flow, onDrop, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'prompt',
    drop: (item: { id: string; name: string }) => {
      onDrop(item.id, flow.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={cn(
        "min-h-[200px] p-4 border-2 border-dashed rounded-lg transition-colors",
        isOver && canDrop && "border-primary bg-primary/5",
        canDrop && "border-primary/50",
        !flow.is_active && "opacity-60"
      )}
    >
      {children}
    </div>
  );
};

export const FlowAssignmentInterface: React.FC<FlowAssignmentInterfaceProps> = ({
  flows,
  templates,
  flowStatusMap,
  onAssignmentChange,
  selectedFlow,
  onSelectFlow
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!template.name.toLowerCase().includes(query) && 
          !template.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }
    
    if (selectedStatus !== 'all') {
      const flowStatus = flowStatusMap.get(template.id);
      if (!flowStatus || flowStatus.status !== selectedStatus) {
        return false;
      }
    }
    
    return true;
  });

  const handleDrop = useCallback(async (templateId: string, flowId: string) => {
    try {
      await flowManagementService.assignPromptToFlow(templateId, flowId, {
        isActiveInFlow: true,
        priority: 0
      });
      
      const template = templates.find(t => t.id === templateId);
      const flow = flows.find(f => f.id === flowId);
      
      toast({
        title: 'Assignment Created',
        description: `"${template?.name}" assigned to "${flow?.name}"`
      });
      
      onAssignmentChange();
    } catch (error) {
      console.error('Error assigning prompt to flow:', error);
      toast({
        title: 'Assignment Failed',
        description: 'Failed to assign prompt to flow',
        variant: 'destructive'
      });
    }
  }, [templates, flows, onAssignmentChange]);

  const handleBulkAssign = async (flowId: string) => {
    if (selectedTemplates.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select templates to assign',
        variant: 'destructive'
      });
      return;
    }

    try {
      await flowManagementService.bulkAssignPromptsToFlow(
        Array.from(selectedTemplates),
        flowId,
        { isActiveInFlow: true, priority: 0 }
      );
      
      const flow = flows.find(f => f.id === flowId);
      toast({
        title: 'Bulk Assignment Complete',
        description: `${selectedTemplates.size} templates assigned to "${flow?.name}"`
      });
      
      setSelectedTemplates(new Set());
      setBulkMode(false);
      onAssignmentChange();
    } catch (error) {
      console.error('Error bulk assigning prompts:', error);
      toast({
        title: 'Bulk Assignment Failed',
        description: 'Failed to assign templates to flow',
        variant: 'destructive'
      });
    }
  };

  const activeFlows = flows.filter(f => f.is_active);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Flow Assignments</h2>
            <p className="text-muted-foreground">
              Drag and drop prompts to assign them to flows, or use bulk assignment
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={bulkMode ? "default" : "outline"}
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelectedTemplates(new Set());
              }}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              {bulkMode ? 'Exit Bulk Mode' : 'Bulk Mode'}
            </Button>
          </div>
        </div>

        {activeFlows.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active flows found. Create and activate flows in the Flow Definitions tab first.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prompts Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Available Prompts
                {bulkMode && selectedTemplates.size > 0 && (
                  <Badge variant="secondary">
                    {selectedTemplates.size} selected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {bulkMode 
                  ? 'Select multiple prompts for bulk assignment'
                  : 'Drag prompts to flows to create assignments'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="competitor_analysis">Competitor Analysis</SelectItem>
                      <SelectItem value="market_research">Market Research</SelectItem>
                      <SelectItem value="business_planning">Business Planning</SelectItem>
                      <SelectItem value="customer_support">Customer Support</SelectItem>
                      <SelectItem value="content_creation">Content Creation</SelectItem>
                      <SelectItem value="data_analysis">Data Analysis</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Flow Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">🟢 Active</SelectItem>
                      <SelectItem value="partial">🟡 Partial</SelectItem>
                      <SelectItem value="inactive">🔴 Inactive</SelectItem>
                      <SelectItem value="unassigned">⚫ Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions */}
              {bulkMode && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm">
                    {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTemplates(new Set())}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTemplates(new Set(filteredTemplates.map(t => t.id)))}
                    >
                      Select All
                    </Button>
                  </div>
                </div>
              )}

              {/* Prompt List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No prompts match your filters
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <div key={template.id} className="relative">
                      {bulkMode && (
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedTemplates.has(template.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedTemplates);
                              if (e.target.checked) {
                                newSelected.add(template.id);
                              } else {
                                newSelected.delete(template.id);
                              }
                              setSelectedTemplates(newSelected);
                            }}
                            className="w-4 h-4"
                          />
                        </div>
                      )}
                      <div className={cn(bulkMode && "pl-8")}>
                        <DraggablePrompt
                          template={template}
                          flowStatus={flowStatusMap.get(template.id)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Flows Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Active Flows
              </CardTitle>
              <CardDescription>
                Drop prompts here to create assignments
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {activeFlows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div>No active flows available</div>
                  <div className="text-sm">Create flows in the Flow Definitions tab</div>
                </div>
              ) : (
                activeFlows.map((flow) => (
                  <div key={flow.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{flow.name}</h4>
                        <Badge variant="outline">{flow.category}</Badge>
                      </div>
                      {bulkMode && selectedTemplates.size > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleBulkAssign(flow.id)}
                          className="gap-2"
                        >
                          <Zap className="h-3 w-3" />
                          Assign {selectedTemplates.size}
                        </Button>
                      )}
                    </div>
                    
                    <DroppableFlow flow={flow} onDrop={handleDrop}>
                      <div className="text-center text-muted-foreground">
                        {bulkMode 
                          ? `Use "Assign" button to bulk assign ${selectedTemplates.size} selected prompts`
                          : 'Drop prompts here to assign to this flow'
                        }
                      </div>
                    </DroppableFlow>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DndProvider>
  );
};