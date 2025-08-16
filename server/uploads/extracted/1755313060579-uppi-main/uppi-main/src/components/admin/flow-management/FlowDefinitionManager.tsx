import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Workflow,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { flowManagementService, type FlowDefinition } from '@/services/flowManagementService';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FlowDefinitionManagerProps {
  flows: FlowDefinition[];
  onFlowChange: () => void;
  selectedFlow: FlowDefinition | null;
  onSelectFlow: (flow: FlowDefinition | null) => void;
}

interface FlowFormData {
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

const FLOW_CATEGORIES = [
  'competitor_analysis',
  'market_research',
  'business_planning',
  'customer_support',
  'content_creation',
  'data_analysis',
  'general',
  'system'
];

export const FlowDefinitionManager: React.FC<FlowDefinitionManagerProps> = ({
  flows,
  onFlowChange,
  selectedFlow,
  onSelectFlow
}) => {
  const [editingFlow, setEditingFlow] = useState<FlowDefinition | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FlowFormData>({
    name: '',
    description: '',
    category: 'general',
    is_active: true,
    metadata: {}
  });

  // Reset form when editing changes
  useEffect(() => {
    if (editingFlow) {
      setFormData({
        name: editingFlow.name,
        description: editingFlow.description || '',
        category: editingFlow.category,
        is_active: editingFlow.is_active,
        metadata: (editingFlow.metadata as Record<string, unknown>) || {}
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'general',
        is_active: true,
        metadata: {}
      });
    }
  }, [editingFlow]);

  const handleCreateFlow = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Flow name is required',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // For now, we'll use the Supabase client directly since we don't have create methods in the service yet
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('flow_definitions')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          is_active: formData.is_active,
          metadata: formData.metadata as any
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Flow Created',
        description: `Successfully created flow "${formData.name}"`
      });

      setShowCreateDialog(false);
      onFlowChange();
    } catch (error) {
      console.error('Error creating flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to create flow',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFlow = async () => {
    if (!editingFlow || !formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Flow name is required',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('flow_definitions')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category,
          is_active: formData.is_active,
          metadata: formData.metadata as any
        })
        .eq('id', editingFlow.id);

      if (error) throw error;

      toast({
        title: 'Flow Updated',
        description: `Successfully updated flow "${formData.name}"`
      });

      setEditingFlow(null);
      onFlowChange();
    } catch (error) {
      console.error('Error updating flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flow',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFlow = async (flow: FlowDefinition) => {
    if (!confirm(`Are you sure you want to delete the flow "${flow.name}"? This will remove all prompt assignments for this flow.`)) {
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from('flow_definitions')
        .delete()
        .eq('id', flow.id);

      if (error) throw error;

      toast({
        title: 'Flow Deleted',
        description: `Successfully deleted flow "${flow.name}"`
      });

      if (selectedFlow?.id === flow.id) {
        onSelectFlow(null);
      }
      onFlowChange();
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete flow',
        variant: 'destructive'
      });
    }
  };

  const FlowForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="flow-name">Flow Name *</Label>
        <Input
          id="flow-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter flow name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="flow-description">Description</Label>
        <Textarea
          id="flow-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the purpose of this flow"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="flow-category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {FLOW_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="flow-active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="flow-active">Active</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flow Definitions</h2>
          <p className="text-muted-foreground">
            Create and manage flow definitions for prompt assignment
          </p>
        </div>
        
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Flow
        </Button>
      </div>

      {/* Flow List */}
      {flows.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Workflow className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Flow Definitions</h3>
              <p className="text-muted-foreground mb-4">
                Create your first flow definition to start organizing prompts
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Flow
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {flows.map((flow) => (
            <Card
              key={flow.id}
              className={cn(
                "cursor-pointer transition-all duration-200",
                selectedFlow?.id === flow.id && "ring-2 ring-primary ring-offset-2",
                editingFlow?.id === flow.id && "border-primary"
              )}
              onClick={() => !editingFlow && onSelectFlow(flow)}
            >
              {editingFlow?.id === flow.id ? (
                <CardContent className="p-6">
                  <FlowForm />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditingFlow(null)}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateFlow}
                      disabled={saving}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{flow.name}</h3>
                        <Badge variant={flow.is_active ? "default" : "secondary"}>
                          {flow.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {flow.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {flow.description && (
                        <p className="text-muted-foreground mb-3">
                          {flow.description}
                        </p>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(flow.created_at).toLocaleDateString()}
                        {flow.updated_at !== flow.created_at && (
                          <span className="ml-4">
                            Updated: {new Date(flow.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFlow(flow);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFlow(flow);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Flow Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Flow</DialogTitle>
            <DialogDescription>
              Define a new flow for organizing prompt assignments
            </DialogDescription>
          </DialogHeader>
          
          <FlowForm />
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFlow}
              disabled={saving || !formData.name.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {saving ? 'Creating...' : 'Create Flow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};