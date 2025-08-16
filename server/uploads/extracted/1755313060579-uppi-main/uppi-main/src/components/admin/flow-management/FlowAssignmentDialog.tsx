import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { flowManagementService, type FlowDefinition, type FlowAssignmentWithDetails } from '@/services/flowManagementService';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FlowAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
  promptName: string;
  onAssignmentChange?: () => void;
}

interface FlowAssignmentState {
  flow: FlowDefinition;
  assignment?: FlowAssignmentWithDetails;
  isActive: boolean;
  priority: number;
  isNew: boolean;
  isModified: boolean;
}

export const FlowAssignmentDialog: React.FC<FlowAssignmentDialogProps> = ({
  isOpen,
  onClose,
  promptId,
  promptName,
  onAssignmentChange
}) => {
  const [flows, setFlows] = useState<FlowDefinition[]>([]);
  const [assignments, setAssignments] = useState<FlowAssignmentState[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load flows and assignments
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, promptId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [flowsData, assignmentsData] = await Promise.all([
        flowManagementService.getFlowDefinitions(),
        flowManagementService.getPromptFlowAssignments(promptId)
      ]);

      setFlows(flowsData);

      // Create assignment states
      const assignmentStates: FlowAssignmentState[] = flowsData.map(flow => {
        const existingAssignment = assignmentsData.find(a => a.flow_id === flow.id);
        
        return {
          flow,
          assignment: existingAssignment,
          isActive: existingAssignment?.is_active_in_flow ?? false,
          priority: existingAssignment?.priority ?? 0,
          isNew: !existingAssignment,
          isModified: false
        };
      });

      setAssignments(assignmentStates);
    } catch (err) {
      console.error('Error loading flow assignment data:', err);
      setError('Failed to load flow assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentToggle = (flowId: string, isAssigned: boolean) => {
    setAssignments(prev => prev.map(state => {
      if (state.flow.id === flowId) {
        return {
          ...state,
          isActive: isAssigned ? true : state.isActive,
          isModified: true,
          isNew: isAssigned && !state.assignment
        };
      }
      return state;
    }));
  };

  const handleActiveToggle = (flowId: string, isActive: boolean) => {
    setAssignments(prev => prev.map(state => {
      if (state.flow.id === flowId) {
        return {
          ...state,
          isActive,
          isModified: true
        };
      }
      return state;
    }));
  };

  const handlePriorityChange = (flowId: string, priority: number) => {
    setAssignments(prev => prev.map(state => {
      if (state.flow.id === flowId) {
        return {
          ...state,
          priority,
          isModified: true
        };
      }
      return state;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const modifiedAssignments = assignments.filter(state => state.isModified);
      
      for (const state of modifiedAssignments) {
        const isAssigned = state.assignment || state.isNew;

        if (isAssigned) {
          // Assign or update
          await flowManagementService.assignPromptToFlow(
            promptId,
            state.flow.id,
            {
              isActiveInFlow: state.isActive,
              priority: state.priority
            }
          );
        } else {
          // Remove assignment
          if (state.assignment) {
            await flowManagementService.removePromptFromFlow(promptId, state.flow.id);
          }
        }
      }

      toast({
        title: 'Flow assignments updated',
        description: `Successfully updated flow assignments for "${promptName}"`
      });

      onAssignmentChange?.();
      onClose();
    } catch (err) {
      console.error('Error saving flow assignments:', err);
      setError('Failed to save flow assignments');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = assignments.some(state => state.isModified);
  const assignedFlows = assignments.filter(state => state.assignment || state.isNew);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Flow Assignments</DialogTitle>
          <DialogDescription>
            Configure which flows this prompt is assigned to and their activation status.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Prompt Info */}
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="font-medium">{promptName}</div>
            <div className="text-sm text-muted-foreground">Prompt ID: {promptId}</div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading flow assignments...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {assignedFlows.length} / {flows.length} flows assigned
                </Badge>
                <Badge variant="outline">
                  {assignments.filter(s => s.isActive && (s.assignment || s.isNew)).length} active
                </Badge>
              </div>

              <Separator />

              {/* Flow Assignments */}
              <div className="space-y-3">
                {assignments.map((state) => {
                  const isAssigned = state.assignment || state.isNew;
                  
                  return (
                    <div
                      key={state.flow.id}
                      className={cn(
                        "border rounded-lg p-4 space-y-3",
                        state.isModified && "border-primary/50 bg-primary/5"
                      )}
                    >
                      {/* Flow Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {state.flow.name}
                            {!state.flow.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inactive Flow
                              </Badge>
                            )}
                            {state.isModified && (
                              <Badge variant="outline" className="text-xs">
                                Modified
                              </Badge>
                            )}
                          </div>
                          {state.flow.description && (
                            <div className="text-sm text-muted-foreground">
                              {state.flow.description}
                            </div>
                          )}
                        </div>
                        
                        <Switch
                          checked={!!isAssigned}
                          onCheckedChange={(checked) => 
                            handleAssignmentToggle(state.flow.id, checked)
                          }
                          disabled={!state.flow.is_active}
                        />
                      </div>

                      {/* Assignment Details */}
                      {isAssigned && (
                        <div className="pl-4 border-l-2 border-muted space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`active-${state.flow.id}`} className="text-sm">
                                Active in flow
                              </Label>
                              <Switch
                                id={`active-${state.flow.id}`}
                                checked={state.isActive}
                                onCheckedChange={(checked) => 
                                  handleActiveToggle(state.flow.id, checked)
                                }
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`priority-${state.flow.id}`} className="text-sm">
                                Priority
                              </Label>
                              <Input
                                id={`priority-${state.flow.id}`}
                                type="number"
                                value={state.priority}
                                onChange={(e) => 
                                  handlePriorityChange(state.flow.id, parseInt(e.target.value) || 0)
                                }
                                className="w-20"
                                min="0"
                                max="100"
                              />
                            </div>
                          </div>

                          {state.assignment && (
                            <div className="text-xs text-muted-foreground">
                              Assigned on {new Date(state.assignment.assigned_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving || loading}
            className="gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};