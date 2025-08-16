import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptTemplate, PromptVariable, PromptCategory, PromptValidationResult } from '@/types/prompts';
import { usePromptManagement } from '@/hooks/usePromptManagement';
import { 
  Save, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Copy,
  Download,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

interface PromptEditorProps {
  template?: PromptTemplate | null;
  onSave?: (template: PromptTemplate) => void;
  onCancel?: () => void;
  className?: string;
}

const PROMPT_CATEGORIES: { value: PromptCategory; label: string; description: string }[] = [
  { value: 'system', label: 'System', description: 'Core system prompts' },
  { value: 'competitor_analysis', label: 'Competitor Analysis', description: 'Competitive intelligence prompts' },
  { value: 'market_research', label: 'Market Research', description: 'Market analysis and research prompts' },
  { value: 'business_planning', label: 'Business Planning', description: 'Strategic planning and business model prompts' },
  { value: 'customer_support', label: 'Customer Support', description: 'Customer service and support prompts' },
  { value: 'content_creation', label: 'Content Creation', description: 'Marketing and content generation prompts' },
  { value: 'data_analysis', label: 'Data Analysis', description: 'Data processing and analysis prompts' },
  { value: 'general', label: 'General', description: 'General purpose prompts' },
];

export const PromptEditor: React.FC<PromptEditorProps> = ({ 
  template, 
  onSave, 
  onCancel,
  className 
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<PromptTemplate>>({
    name: '',
    description: '',
    category: 'general',
    template: '',
    variables: [],
    isSystem: false,
    isActive: true,
    tags: []
  });

  const [validation, setValidation] = useState<PromptValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  const [showVariableForm, setShowVariableForm] = useState(false);
  const [editingVariable, setEditingVariable] = useState<PromptVariable | null>(null);

  const { 
    saving, 
    previewing, 
    validating,
    createTemplate, 
    updateTemplate, 
    previewPrompt, 
    validatePrompt 
  } = usePromptManagement();

  const { isSuperAdmin } = useUserRole();

  // Initialize form with template data
  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        tags: template.tags || []
      });
    }
  }, [template]);

  // Handle form field changes
  const handleFieldChange = (field: keyof PromptTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation when template changes
    if (field === 'template') {
      setValidation(null);
    }
  };

  // Handle variable management
  const addVariable = (variable: PromptVariable) => {
    const variables = formData.variables || [];
    
    if (editingVariable) {
      // Update existing
      const index = variables.findIndex(v => v.name === editingVariable.name);
      variables[index] = variable;
    } else {
      // Add new
      variables.push(variable);
    }
    
    setFormData(prev => ({ ...prev, variables }));
    setEditingVariable(null);
    setShowVariableForm(false);
  };

  const removeVariable = (variableName: string) => {
    const variables = (formData.variables || []).filter(v => v.name !== variableName);
    setFormData(prev => ({ ...prev, variables }));
  };

  // Handle tags
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    const tags = formData.tags || [];
    if (!tags.includes(tagInput.trim())) {
      tags.push(tagInput.trim());
      setFormData(prev => ({ ...prev, tags }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const tags = (formData.tags || []).filter(t => t !== tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  // Validation
  const handleValidate = async () => {
    if (!formData.template || !formData.variables) return;
    
    const result = await validatePrompt(formData.template, formData.variables);
    setValidation(result);
  };

  // Preview
  const handlePreview = async () => {
    if (!formData.template) return;
    
    const mockVariables: Record<string, any> = {};
    (formData.variables || []).forEach(variable => {
      mockVariables[variable.name] = variable.example || variable.defaultValue || '';
    });
    
    const result = await previewPrompt({
      template: formData.template,
      variables: mockVariables
    });
    
    setPreviewData(result);
  };

  // Save
  const handleSave = async () => {
    if (!formData.name || !formData.template) return;
    
    if (template?.id && isSuperAdmin) {
      const confirmed = window.confirm('Super Admin: Confirm changes to this prompt? A version snapshot will be saved and can be restored.');
      if (!confirmed) return;
    }
    
    const templateData = {
      ...formData,
      variables: formData.variables || [],
      tags: formData.tags || []
    } as Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>;

    let success = false;
    
    if (template?.id) {
      success = await updateTemplate(template.id, templateData);
    } else {
      success = await createTemplate(templateData);
    }
    
    if (success && onSave) {
      onSave(templateData as PromptTemplate);
    }
  };

  // Get validation icon and color
  const getValidationStatus = () => {
    if (!validation) return null;
    
    if (validation.score >= 80) {
      return { icon: CheckCircle, color: 'text-green-500', label: 'Excellent' };
    } else if (validation.score >= 60) {
      return { icon: AlertTriangle, color: 'text-yellow-500', label: 'Good' };
    } else {
      return { icon: AlertTriangle, color: 'text-red-500', label: 'Needs Improvement' };
    }
  };

  const validationStatus = getValidationStatus();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {template ? 'Edit Prompt Template' : 'Create Prompt Template'}
          </h2>
          <p className="text-muted-foreground">
            Design and configure AI prompt templates for your applications
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {validation && validationStatus && (
            <Badge variant="outline" className={cn("gap-1", validationStatus.color)}>
              <validationStatus.icon className="h-3 w-3" />
              {validationStatus.label} ({validation.score}%)
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Variables
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic settings for your prompt template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name*</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Competitor Analysis Expert"
                    value={formData.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category*</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleFieldChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROMPT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div>
                            <div className="font-medium">{cat.label}</div>
                            <div className="text-xs text-muted-foreground">{cat.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this prompt template does and when to use it..."
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive || false}
                    onCheckedChange={(checked) => handleFieldChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isSystem"
                    checked={formData.isSystem || false}
                    onCheckedChange={(checked) => handleFieldChange('isSystem', checked)}
                  />
                  <Label htmlFor="isSystem">System Template</Label>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 flex-wrap">
                  {(formData.tags || []).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Content */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Template*</CardTitle>
              <CardDescription>
                Write your prompt template using variables like {"{variable_name}"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="You are an expert AI assistant specializing in {{category}}.

Your task is to {{task_description}}.

Please provide a {{output_format}} response that includes:
1. {{requirement_1}}
2. {{requirement_2}}
3. {{requirement_3}}

{{#if additional_context}}
Additional Context: {{additional_context}}
{{/if}}"
                value={formData.template || ''}
                onChange={(e) => handleFieldChange('template', e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleValidate}
                  disabled={validating || !formData.template}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {validating ? 'Validating...' : 'Validate'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handlePreview}
                  disabled={previewing || !formData.template}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {previewing ? 'Generating...' : 'Preview'}
                </Button>
              </div>

              {validation && (
                <Alert className={cn(
                  validation.score >= 80 ? "border-green-200 bg-green-50" :
                  validation.score >= 60 ? "border-yellow-200 bg-yellow-50" :
                  "border-red-200 bg-red-50"
                )}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        Validation Score: {validation.score}%
                      </div>
                      
                      {validation.errors.length > 0 && (
                        <div>
                          <strong className="text-red-600">Errors:</strong>
                          <ul className="list-disc list-inside ml-2 text-sm">
                            {validation.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validation.warnings.length > 0 && (
                        <div>
                          <strong className="text-yellow-600">Warnings:</strong>
                          <ul className="list-disc list-inside ml-2 text-sm">
                            {validation.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validation.suggestions.length > 0 && (
                        <div>
                          <strong className="text-blue-600">Suggestions:</strong>
                          <ul className="list-disc list-inside ml-2 text-sm">
                            {validation.suggestions.map((suggestion, index) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                See how your prompt will look with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewData ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Rendered Prompt:</h4>
                    <pre className="whitespace-pre-wrap text-sm">
                      {previewData.rendered_prompt}
                    </pre>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-700">Token Count</div>
                      <div className="text-blue-900">{previewData.token_count}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-green-700">Est. Cost</div>
                      <div className="text-green-900">${previewData.estimated_cost.toFixed(4)}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="font-medium text-purple-700">Warnings</div>
                      <div className="text-purple-900">{previewData.warnings.length}</div>
                    </div>
                  </div>
                  
                  {previewData.warnings.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {previewData.warnings.map((warning: string, index: number) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Click "Preview" in the Editor tab to see your prompt rendered</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variables Tab */}
        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Variables</CardTitle>
              <CardDescription>
                Define variables that can be used in your prompt template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.variables || []).length > 0 ? (
                <div className="space-y-2">
                  {formData.variables.map((variable, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {`{{${variable.name}}}`}
                          </span>
                          <Badge variant="outline">{variable.type}</Badge>
                          {variable.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {variable.description}
                        </p>
                        {variable.example && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Example: {variable.example}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingVariable(variable);
                            setShowVariableForm(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariable(variable.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No variables defined yet</p>
                  <p className="text-sm">Add variables to make your prompt template dynamic</p>
                </div>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingVariable(null);
                  setShowVariableForm(true);
                }}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Variable
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Copy template to clipboard
              navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
            }}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy JSON
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.template}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>

      {/* Variable Form Modal would go here */}
      {/* This would be a separate component for adding/editing variables */}
    </div>
  );
};