import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FlowStatusIndicator } from './FlowStatusIndicator';
import { FlowAssignmentDialog } from './FlowAssignmentDialog';
import { 
  Settings, 
  BarChart3, 
  Users, 
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptFlowStatus } from '@/services/flowManagementService';

interface FlowAssignmentCardProps {
  promptId: string;
  promptName: string;
  flowStatus: PromptFlowStatus;
  onStatusChange?: () => void;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
}

export const FlowAssignmentCard: React.FC<FlowAssignmentCardProps> = ({
  promptId,
  promptName,
  flowStatus,
  onStatusChange,
  isExpanded = false,
  onExpandedChange,
  className
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleToggleExpanded = () => {
    onExpandedChange?.(!isExpanded);
  };

  const handleManageAssignments = () => {
    setDialogOpen(true);
  };

  const handleAssignmentChange = () => {
    onStatusChange?.();
  };

  return (
    <>
      <Card className={cn("transition-all duration-200", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlowStatusIndicator status={flowStatus} variant="icon" />
              <div>
                <CardTitle className="text-base">{promptName}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {flowStatus.total_assignments} flow assignments
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FlowStatusIndicator status={flowStatus} variant="compact" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleExpanded}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageAssignments}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Manage
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Flow Status Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Flows</span>
                  </div>
                  <div className="text-lg font-bold">{flowStatus.total_assignments}</div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {flowStatus.active_assignments}
                  </div>
                </div>
                
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Inactive</span>
                  </div>
                  <div className="text-lg font-bold text-red-600">
                    {flowStatus.total_assignments - flowStatus.active_assignments}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <div className="text-sm font-medium text-blue-600 capitalize">
                    {flowStatus.status}
                  </div>
                </div>
              </div>

              {/* Individual Flow Status */}
              {flowStatus.flows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Flow Assignments</h4>
                  <div className="space-y-2">
                    {flowStatus.flows.map((flow, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            flow.is_active_in_flow ? "bg-green-500" : "bg-red-500"
                          )} />
                          <span className="text-sm font-medium">{flow.flow_name}</span>
                        </div>
                        
                        <Badge 
                          variant={flow.is_active_in_flow ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {flow.is_active_in_flow ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {flowStatus.total_assignments === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No flow assignments</div>
                  <div className="text-xs">This prompt is not assigned to any flows</div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <FlowAssignmentDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        promptId={promptId}
        promptName={promptName}
        onAssignmentChange={handleAssignmentChange}
      />
    </>
  );
};