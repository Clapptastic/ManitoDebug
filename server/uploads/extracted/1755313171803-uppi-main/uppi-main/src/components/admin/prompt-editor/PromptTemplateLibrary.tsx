import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PromptTemplate, PromptCategory } from '@/types/prompts';
import { usePromptManagement } from '@/hooks/usePromptManagement';
import { useFlowStatus } from '@/hooks/useFlowStatus';
import { FlowStatusIndicator } from '@/components/admin/flow-management/FlowStatusIndicator';
import { FlowAssignmentCard } from '@/components/admin/flow-management/FlowAssignmentCard';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  Eye,
  BarChart3,
  Star,
  Clock,
  Users,
  Sparkles,
  Settings,
  Archive,
  RefreshCw,
  Workflow,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

interface PromptTemplateLibraryProps {
  onSelectTemplate?: (template: PromptTemplate) => void;
  onEditTemplate?: (template: PromptTemplate) => void;
  onCreateNew?: () => void;
  selectedTemplateId?: string;
  className?: string;
  showFlowManagement?: boolean;
  // Optional: inject management from parent to avoid duplicate hook mounts
  management?: Partial<Pick<ReturnType<typeof usePromptManagement>,
    'templates' | 'analytics' | 'loading' | 'loadTemplates' | 'deleteTemplate' | 'exportPrompts' | 'importPrompts' | 'initializeDefaults'
  >>;
}

const CATEGORY_COLORS: Record<PromptCategory, string> = {
  system: 'bg-blue-100 text-blue-800 border-blue-200',
  competitor_analysis: 'bg-purple-100 text-purple-800 border-purple-200',
  market_research: 'bg-green-100 text-green-800 border-green-200',
  business_planning: 'bg-orange-100 text-orange-800 border-orange-200',
  customer_support: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  content_creation: 'bg-pink-100 text-pink-800 border-pink-200',
  data_analysis: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  general: 'bg-gray-100 text-gray-800 border-gray-200',
};

const CATEGORY_ICONS: Record<PromptCategory, React.ComponentType<any>> = {
  system: Settings,
  competitor_analysis: BarChart3,
  market_research: Search,
  business_planning: Sparkles,
  customer_support: Users,
  content_creation: Edit,
  data_analysis: BarChart3,
  general: Star,
};

export const PromptTemplateLibrary: React.FC<PromptTemplateLibraryProps> = ({
  onSelectTemplate,
  onEditTemplate,
  onCreateNew,
  selectedTemplateId,
  className,
  showFlowManagement = false,
  management
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'system' | 'openai' | 'anthropic' | 'perplexity' | 'gemini' | 'cohere' | 'groq' | 'mistral'>('all');
  const [selectedFlowStatus, setSelectedFlowStatus] = useState<'all' | 'active' | 'partial' | 'inactive' | 'unassigned'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'usage' | 'category'>('updated');
  const [expandedFlowCards, setExpandedFlowCards] = useState<Set<string>>(new Set());

  // Prefer injected management from parent to prevent duplicate initialization under StrictMode
  const mgmt = usePromptManagement();
  const managed = React.useMemo(() => 
    management ? { ...mgmt, ...management } : mgmt, 
    [mgmt, management]
  );

  const {
    templates,
    analytics,
    loading,
    loadTemplates,
    deleteTemplate,
    exportPrompts,
    importPrompts,
    initializeDefaults
  } = managed as ReturnType<typeof usePromptManagement>;

  // Flow status management
  const promptIds = templates.map(t => t.id);
  const { flowStatusMap, loading: flowStatusLoading, refreshStatus } = useFlowStatus(promptIds, {
    autoRefresh: showFlowManagement
  });

  // Filtered and sorted templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const isActive = template.isActive;
        if (selectedStatus === 'active' && !isActive) return false;
        if (selectedStatus === 'inactive' && isActive) return false;
      }

      // Flow status filter (if flow management is enabled)
      if (showFlowManagement && selectedFlowStatus !== 'all') {
        const flowStatus = flowStatusMap.get(template.id);
        if (!flowStatus || flowStatus.status !== selectedFlowStatus) return false;
      }
      // Provider filter
      if (selectedProvider !== 'all') {
        const hasTag = template.tags.map(t => t.toLowerCase()).includes(selectedProvider);
        if (!hasTag) return false;
      }

      return true;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'usage':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchQuery, selectedCategory, selectedStatus, selectedFlowStatus, sortBy, showFlowManagement, flowStatusMap]);

  // Get template analytics
  const getTemplateAnalytics = (templateId: string) => {
    return analytics.find(a => a.template_id === templateId);
  };

  // Handle template actions
  const handleDeleteTemplate = async (template: PromptTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      await deleteTemplate(template.id);
    }
  };

  const handleExportTemplates = async (templateIds?: string[]) => {
    const data = await exportPrompts(templateIds);
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTemplates = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const templates = JSON.parse(text);
      await importPrompts(templates);
    } catch (error) {
      console.error('Error importing templates:', error);
    }
    
    // Reset input
    event.target.value = '';
  };

  // Template Card Component
  const TemplateCard: React.FC<{ template: PromptTemplate }> = ({ template }) => {
    const analytics = getTemplateAnalytics(template.id);
    const CategoryIcon = CATEGORY_ICONS[template.category];
    const isSelected = template.id === selectedTemplateId;
    const flowStatus = showFlowManagement ? flowStatusMap.get(template.id) : undefined;

    return (
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
        onClick={() => onSelectTemplate?.(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
              {showFlowManagement && flowStatus && (
                <FlowStatusIndicator status={flowStatus} variant="icon" />
              )}
              <div>
                <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", CATEGORY_COLORS[template.category])}
                  >
                    {template.category.replace('_', ' ')}
                  </Badge>
                  {template.isSystem && (
                    <Badge variant="outline" className="text-xs">
                      System
                    </Badge>
                  )}
                  {!template.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                  {showFlowManagement && flowStatus && (
                    <FlowStatusIndicator status={flowStatus} variant="compact" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTemplate?.(template);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTemplate(template);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="text-sm mb-3 line-clamp-2">
            {template.description}
          </CardDescription>
          
          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {template.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {analytics && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {analytics.usage_count}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {template.variables.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {template.variables.length} vars
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Empty State
  const EmptyState = () => (
    <div className="text-center py-12">
      <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 className="text-lg font-semibold mb-2">No templates found</h3>
      <p className="text-muted-foreground mb-4">
        {searchQuery || selectedCategory !== 'all' 
          ? 'Try adjusting your filters or search terms'
          : 'Get started by creating your first prompt template'
        }
      </p>
      {onCreateNew && (
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {showFlowManagement ? 'Flow-Aware Prompt Library' : 'Prompt Library'}
          </h2>
          <p className="text-muted-foreground">
            {showFlowManagement 
              ? 'Manage AI prompt templates with flow assignments and status indicators'
              : 'Manage and organize your AI prompt templates'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {showFlowManagement && (
            <Button
              variant="outline"
              onClick={() => {
                if (!flowStatusLoading) refreshStatus();
              }}
              disabled={flowStatusLoading}
              className="gap-2"
            >
              <Workflow className={cn("h-4 w-4", flowStatusLoading && "animate-spin")} />
              {flowStatusLoading ? 'Syncing...' : 'Sync Flows'}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => {
              if (!loading) loadTemplates();
            }}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          
          {onCreateNew && (
            <Button onClick={onCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_COLORS).map(([category, _]) => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedProvider} onValueChange={(value: any) => setSelectedProvider(value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="system">system</SelectItem>
                  <SelectItem value="openai">openai</SelectItem>
                  <SelectItem value="anthropic">anthropic</SelectItem>
                  <SelectItem value="perplexity">perplexity</SelectItem>
                  <SelectItem value="gemini">gemini</SelectItem>
                  <SelectItem value="cohere">cohere</SelectItem>
                  <SelectItem value="groq">groq</SelectItem>
                  <SelectItem value="mistral">mistral</SelectItem>
                </SelectContent>
              </Select>
              
              {showFlowManagement && (
                <Select value={selectedFlowStatus} onValueChange={(value: any) => setSelectedFlowStatus(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Flow Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Flow Status</SelectItem>
                    <SelectItem value="active">🟢 Active</SelectItem>
                    <SelectItem value="partial">🟡 Partial</SelectItem>
                    <SelectItem value="inactive">🔴 Inactive</SelectItem>
                    <SelectItem value="unassigned">⚫ Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Action Bar */}
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
              {showFlowManagement && (
                <span className="ml-2">
                  | Flow Status: {selectedFlowStatus === 'all' ? 'All' : selectedFlowStatus}
                </span>
              )}
             </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportTemplates()}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export All
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportTemplates}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={initializeDefaults}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Load Defaults
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' 
            ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
            : "grid-cols-1"
        )}>
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* Flow Management Section */}
      {showFlowManagement && filteredTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Flow Management</CardTitle>
                <CardDescription>
                  Manage flow assignments for prompt templates
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allExpanded = expandedFlowCards.size === filteredTemplates.length;
                    setExpandedFlowCards(allExpanded ? new Set() : new Set(filteredTemplates.map(t => t.id)));
                  }}
                  className="gap-2"
                >
                  {expandedFlowCards.size === filteredTemplates.length ? (
                    <>
                      <ToggleLeft className="h-4 w-4" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ToggleRight className="h-4 w-4" />
                      Expand All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTemplates.map((template) => {
                const flowStatus = flowStatusMap.get(template.id);
                if (!flowStatus) return null;
                
                return (
                  <FlowAssignmentCard
                    key={template.id}
                    promptId={template.id}
                    promptName={template.name}
                    flowStatus={flowStatus}
                    onStatusChange={refreshStatus}
                    isExpanded={expandedFlowCards.has(template.id)}
                    onExpandedChange={(expanded) => {
                      const newExpanded = new Set(expandedFlowCards);
                      if (expanded) {
                        newExpanded.add(template.id);
                      } else {
                        newExpanded.delete(template.id);
                      }
                      setExpandedFlowCards(newExpanded);
                    }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Library Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{templates.length}</div>
                <div className="text-sm text-muted-foreground">Total Templates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {templates.filter(t => t.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(templates.map(t => t.category)).size}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Usage</div>
              </div>
            </div>
            
            {showFlowManagement && (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Array.from(flowStatusMap.values()).filter(s => s.status === 'active').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Flow Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Array.from(flowStatusMap.values()).filter(s => s.status === 'partial').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Flow Partial</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {Array.from(flowStatusMap.values()).filter(s => s.status === 'inactive').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Flow Inactive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {Array.from(flowStatusMap.values()).filter(s => s.status === 'unassigned').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Unassigned</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};