import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Settings,
  Zap,
  Mail,
  Database,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WorkflowAction {
  id: string;
  type: 'email' | 'webhook' | 'database' | 'delay';
  config: Record<string, any>;
  name: string;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: string;
  triggerConfig: Record<string, any>;
  actions: WorkflowAction[];
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
}

export const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([
    {
      id: '1',
      name: 'Welcome New Users',
      trigger: 'user_signup',
      triggerConfig: {},
      actions: [
        {
          id: 'a1',
          type: 'email',
          name: 'Send Welcome Email',
          config: { template: 'welcome', delay: 0 }
        }
      ],
      isActive: true,
      executionCount: 142,
      lastExecuted: '2024-01-20T10:30:00Z'
    },
    {
      id: '2',
      name: 'Analysis Complete Notification',
      trigger: 'analysis_complete',
      triggerConfig: {},
      actions: [
        {
          id: 'a2',
          type: 'email',
          name: 'Send Results Email',
          config: { template: 'analysis_complete' }
        },
        {
          id: 'a3',
          type: 'webhook',
          name: 'Update CRM',
          config: { url: 'https://api.crm.com/update' }
        }
      ],
      isActive: true,
      executionCount: 89,
      lastExecuted: '2024-01-19T15:45:00Z'
    }
  ]);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    trigger: '',
    triggerConfig: {}
  });

  const [showBuilder, setShowBuilder] = useState(false);

  const triggerTypes = [
    { value: 'user_signup', label: 'User Signup' },
    { value: 'analysis_complete', label: 'Analysis Complete' },
    { value: 'payment_success', label: 'Payment Success' },
    { value: 'api_key_added', label: 'API Key Added' },
    { value: 'schedule', label: 'Scheduled' }
  ];

  const actionTypes = [
    { value: 'email', label: 'Send Email', icon: Mail },
    { value: 'webhook', label: 'Webhook Call', icon: Zap },
    { value: 'database', label: 'Database Update', icon: Database },
    { value: 'delay', label: 'Delay', icon: Clock }
  ];

  const toggleWorkflow = (id: string) => {
    setWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === id 
          ? { ...workflow, isActive: !workflow.isActive }
          : workflow
      )
    );

    const workflow = workflows.find(w => w.id === id);
    toast({
      title: workflow?.isActive ? 'Workflow Paused' : 'Workflow Activated',
      description: `${workflow?.name} has been ${workflow?.isActive ? 'paused' : 'activated'}`,
    });
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    toast({
      title: 'Workflow Deleted',
      description: 'The workflow has been removed',
    });
  };

  const createWorkflow = () => {
    if (!newWorkflow.name || !newWorkflow.trigger) {
      toast({
        title: 'Missing Information',
        description: 'Please provide workflow name and trigger',
        variant: 'destructive'
      });
      return;
    }

    const workflow: AutomationWorkflow = {
      id: Date.now().toString(),
      name: newWorkflow.name,
      trigger: newWorkflow.trigger,
      triggerConfig: newWorkflow.triggerConfig,
      actions: [],
      isActive: false,
      executionCount: 0
    };

    setWorkflows(prev => [...prev, workflow]);
    setNewWorkflow({ name: '', trigger: '', triggerConfig: {} });
    setShowBuilder(false);

    toast({
      title: 'Workflow Created',
      description: 'New automation workflow has been created',
    });
  };

  const getActionIcon = (type: string) => {
    const actionType = actionTypes.find(a => a.value === type);
    return actionType?.icon || Zap;
  };

  const getTriggerLabel = (trigger: string) => {
    const triggerType = triggerTypes.find(t => t.value === trigger);
    return triggerType?.label || trigger;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Automation</h2>
          <p className="text-muted-foreground">Automate business processes and integrations</p>
        </div>
        <Button onClick={() => setShowBuilder(!showBuilder)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {showBuilder && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workflowName">Workflow Name</Label>
                <Input
                  id="workflowName"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter workflow name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger Event</Label>
                <Select 
                  value={newWorkflow.trigger} 
                  onValueChange={(value) => setNewWorkflow(prev => ({ ...prev, trigger: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(trigger => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createWorkflow}>Create Workflow</Button>
              <Button variant="outline" onClick={() => setShowBuilder(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Workflow className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {getTriggerLabel(workflow.trigger)}
                      </Badge>
                      <Badge variant={workflow.isActive ? "default" : "secondary"}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={workflow.isActive}
                    onCheckedChange={() => toggleWorkflow(workflow.id)}
                  />
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteWorkflow(workflow.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-sm">
                    <div className="font-medium">Executions</div>
                    <div className="text-2xl font-bold">{workflow.executionCount}</div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium">Actions</div>
                    <div className="text-2xl font-bold">{workflow.actions.length}</div>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium">Last Executed</div>
                    <div className="text-sm text-muted-foreground">
                      {workflow.lastExecuted 
                        ? new Date(workflow.lastExecuted).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </div>
                </div>

                {workflow.actions.length > 0 && (
                  <div>
                    <div className="font-medium text-sm mb-2">Actions:</div>
                    <div className="flex flex-wrap gap-2">
                      {workflow.actions.map((action) => {
                        const ActionIcon = getActionIcon(action.type);
                        return (
                          <Badge key={action.id} variant="outline" className="flex items-center gap-1">
                            <ActionIcon className="h-3 w-3" />
                            {action.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Workflows Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first automation workflow to streamline your business processes
            </p>
            <Button onClick={() => setShowBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Workflow
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};