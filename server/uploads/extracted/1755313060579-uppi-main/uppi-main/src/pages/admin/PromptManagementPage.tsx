import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PromptTemplateLibrary } from '@/components/admin/prompt-editor/PromptTemplateLibrary';
import { PromptEditor } from '@/components/admin/prompt-editor/PromptEditor';
import { EnhancedErrorBoundary } from '@/components/ui/error-boundary-enhanced';
import { PromptTemplate, PromptVariable } from '@/types/prompts';
import { usePromptManagement } from '@/hooks/usePromptManagement';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Sparkles, 
  Settings, 
  BarChart3, 
  Shield, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Clock,
  RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptVersion } from '@/services/promptManagementService';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { getPromptByKey } from '@/services/promptService';
import { promptManagementService } from '@/services/promptManagementService';


export const PromptManagementPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('library');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [history, setHistory] = useState<PromptVersion[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [edgeVars, setEdgeVars] = useState<PromptVariable[] | null>(null);

  // Derived: union of template vars, edge vars, and canonical (for competitor_analysis)
  const combinedVars = React.useMemo<PromptVariable[]>(() => {
    const list: PromptVariable[] = [];
    const byName = new Map<string, PromptVariable>();
    const add = (arr?: PromptVariable[] | null) => {
      (arr || []).forEach((v) => {
        if (v && v.name && !byName.has(v.name)) {
          byName.set(v.name, v);
          list.push(v);
        }
      });
    };
    add(selectedTemplate?.variables || []);
    add(edgeVars || []);
    if (selectedTemplate?.category === 'competitor_analysis') {
      add(promptManagementService.getCanonicalCompetitorVariables());
    }
    return list;
  }, [selectedTemplate?.variables, edgeVars, selectedTemplate?.category]);

  // Hooks
  const { user, isAuthenticated } = useAuth();
  const { isSuperAdmin, isAdmin, loading: roleLoading } = useUserRole();
const { 
    templates, 
    analytics, 
    loading, 
    initializeDefaults,
    refreshData,
    getPromptHistory,
    restorePromptVersion,
    createTemplate,
    updateTemplate,
    loadTemplates,
    loadAnalytics,
    deleteTemplate,
    exportPrompts,
    importPrompts,
    selectTemplate
  } = usePromptManagement();

  // On mount for super admins: ensure provider default prompts exist and are synced
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    (async () => {
      try {
        if (!isAuthenticated || !isSuperAdmin) return;
        
        // Add timeout to prevent hanging
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('[PromptManagementPage] Provider defaults sync timeout');
          }
        }, 15000);
        
        const res = await promptManagementService.ensureCompetitorProviderDefaults();
        
        if (timeoutId) clearTimeout(timeoutId);
        
        if (!mounted) return;
        if (res && (res.created || res.updated) && (res.created + res.updated > 0)) {
          toast({ title: 'Provider defaults synced', description: `${res.created} created, ${res.updated} updated.` });
        }
        
        // Only refresh if we're still mounted and have valid data
        if (mounted) {
          await refreshData();
        }
      } catch (e) {
        if (timeoutId) clearTimeout(timeoutId);
        console.warn('[PromptManagementPage] ensureCompetitorProviderDefaults failed:', e);
        // Don't show error toast for background sync failures, but ensure we still try to load basic data
        if (mounted) {
          try {
            await refreshData();
          } catch (refreshError) {
            console.warn('[PromptManagementPage] Refresh after sync failure also failed:', refreshError);
          }
        }
      }
    })();
    return () => { 
      mounted = false; 
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isSuperAdmin]);

  const handleGlobalRefresh = async () => {
    await refreshData();
    const ts = new Date().toISOString();
    setLastSyncedAt(ts);
    toast({ title: 'Refreshed', description: `Synced at ${new Date(ts).toLocaleTimeString()}` });
  };

  // Check permissions
  const hasAccess = isAuthenticated && isSuperAdmin;

  // Handle template selection
  const handleSelectTemplate = async (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('details');
    try {
      await loadAnalytics(template.id);
    } catch {}
  };

  // Handle edit template
  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
    setActiveTab('editor');
  };

  // Handle create new template
  const handleCreateNew = () => {
    setEditingTemplate(null);
    setShowEditor(true);
    setActiveTab('editor');
  };

  // Handle editor save
  const handleEditorSave = async (template: PromptTemplate) => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: template.name,
          description: template.description,
          template: template.template,
          variables: template.variables,
          isActive: template.isActive,
          tags: template.tags,
          category: template.category,
        });
      } else {
        await createTemplate({
          name: template.name,
          description: template.description,
          template: template.template,
          variables: template.variables,
          isSystem: false,
          isActive: template.isActive ?? true,
          tags: template.tags ?? [],
          category: template.category,
          usage_count: template.usage_count ?? 0,
        });
      }
    } finally {
      setShowEditor(false);
      setEditingTemplate(null);
      setActiveTab('library');
      refreshData();
    }
  };

  // Handle editor cancel
  const handleEditorCancel = () => {
    setShowEditor(false);
    setEditingTemplate(null);
    setActiveTab('library');
  };

  // Get statistics
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    system: templates.filter(t => t.isSystem).length,
    categories: new Set(templates.map(t => t.category)).size,
    totalUsage: analytics.reduce((sum, a) => sum + a.usage_count, 0),
    avgSuccessRate: analytics.length > 0 
      ? Math.round(analytics.reduce((sum, a) => sum + a.success_rate, 0) / analytics.length)
      : 0
  };

  // Load history when the selected template changes
  // Note: We intentionally depend only on the template id to avoid re-renders
  // if getPromptHistory has an unstable identity from the hook. This prevents
  // the "Maximum update depth exceeded" loop.
  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        if (selectedTemplate?.id) {
          const h = await getPromptHistory(selectedTemplate.id);
          if (mounted) setHistory(h);
        } else if (mounted) {
          setHistory([]);
        }
      } catch (err) {
        // Non-fatal: keep existing history on failure
        console.warn('[PromptManagementPage] Failed to load prompt history:', err);
      }
    };

    loadHistory();
    return () => { mounted = false; };
  }, [selectedTemplate?.id]);

  // Auto-sync competitor analysis variables with canonical DB fields and persist a new version if needed
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!selectedTemplate) return;
        if (selectedTemplate.category !== 'competitor_analysis') return;

        // Load edge variables for visibility/diagnostics (cached by edge fn)
        try {
          const pg = await getPromptByKey(selectedTemplate.name);
          if (mounted && pg && Array.isArray(pg.variables)) {
            const vars = pg.variables
              .map((v: any) => (typeof v === 'object' && v && 'name' in v ? v as any : null))
              .filter(Boolean) as any[];
            setEdgeVars(vars as any);
          }
        } catch {}

        // Ensure canonical variables are present and persist if missing
        const fullVars = await promptManagementService.getIntrospectedCompetitorVariables();
        const result = await promptManagementService.ensurePromptHasVariablesByKey(selectedTemplate.name, fullVars);
        if (result.updated) {
          toast({ title: 'Prompt variables synced', description: `${result.added} variables added. A new version was created.` });
          // Reload selection and history to reflect the new version
          await selectTemplate(selectedTemplate.id);
          const h = await getPromptHistory(selectedTemplate.id);
          if (mounted) setHistory(h);
        }

        // Ensure content is upgraded to enhanced template once
        const enhanced = promptManagementService.getEnhancedCompetitorPromptTemplate();
        const upgraded = await promptManagementService.ensurePromptContentByKey(
          selectedTemplate.name,
          enhanced,
          'Auto-upgrade to enhanced competitor analysis prompt'
        );
        if (upgraded.updated && selectedTemplate?.id) {
          toast({ title: 'Prompt content upgraded', description: 'Enhanced competitor analysis template applied.' });
          await selectTemplate(selectedTemplate.id);
          const h2 = await getPromptHistory(selectedTemplate.id);
          if (mounted) setHistory(h2);
        }
      } catch (e) {
        console.warn('[PromptManagement] Auto-sync failed:', e);
      }
    })();
    return () => { mounted = false; };
  }, [selectedTemplate?.id]);

  // Prompt logs state and lazy loader
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsLastRefreshed, setLogsLastRefreshed] = useState<string | null>(null);
  const loadLogs = async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const { data, error } = await supabase
        .from('ai_prompt_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setLogs(data || []);
      setLogsLastRefreshed(new Date().toISOString());
    } catch (e: any) {
      setLogsError(e?.message || 'Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  };

  // Insert a test log to validate full-stack wiring
  const handleCreateTestLog = async () => {
    try {
      const { error } = await supabase.rpc('log_ai_prompt', {
        provider_param: 'openai',
        model_param: 'gpt-4o-mini',
        prompt_param: 'Admin test prompt logging',
        prompt_length_param: 26,
        session_id_param: 'admin-test',
        temperature_param: 0.3,
        status_param: 'sent',
        metadata_param: { source: 'PromptManagementPage' }
      });
      if (error) throw error;
      toast({ title: 'Logged', description: 'Inserted test prompt log.' });
      await loadLogs();
    } catch (e: any) {
      toast({ title: 'Failed to log', description: e?.message || 'Unknown error', variant: 'destructive', error: e, context: { source: 'PromptManagementPage.handleCreateTestLog' } });
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  // Auto-refresh logs while on the Logs tab
  useEffect(() => {
    if (activeTab !== 'logs') return;
    const id = setInterval(loadLogs, 10000);
    return () => clearInterval(id);
  }, [activeTab]);
  // Loading state
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access prompt management. Only super administrators can view and edit prompts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <EnhancedErrorBoundary level="page" resetKeys={[selectedTemplate?.id, activeTab]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* SEO */}
        <Helmet>
          <title>Prompt Management | Admin</title>
          <meta name="description" content="Manage AI prompt templates. Live view reflects the current database state with manual refresh." />
          <link rel="canonical" href="/admin/prompts" />
        </Helmet>
        {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Prompt Management
          </h1>
          <p className="text-muted-foreground">
            Design, test, and manage AI prompt templates for your applications
          </p>
        </div>

        {showEditor && (
          <Button
            variant="outline"
            onClick={handleEditorCancel}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Templates</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.system}</div>
                <div className="text-xs text-muted-foreground">System</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.categories}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Usage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold">{stats.avgSuccessRate}%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {showEditor ? (
        // Editor View
        <PromptEditor
          template={editingTemplate}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      ) : (
        // Tabbed View
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedTemplate} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            <EnhancedErrorBoundary level="component" resetKeys={[templates.length]}>
              <PromptTemplateLibrary
                onSelectTemplate={handleSelectTemplate}
                onEditTemplate={handleEditTemplate}
                onCreateNew={handleCreateNew}
                selectedTemplateId={selectedTemplate?.id}
                management={{
                  templates,
                  analytics,
                  loading,
                  loadTemplates,
                  deleteTemplate,
                  exportPrompts,
                  importPrompts,
                  initializeDefaults
                }}
              />
            </EnhancedErrorBoundary>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {selectedTemplate ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Template Details */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                          <CardDescription>{selectedTemplate.description}</CardDescription>
                        </div>
                        <Button
                          onClick={() => handleEditTemplate(selectedTemplate)}
                          className="gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Template Content */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Template Content</h4>
                          {selectedTemplate?.category === 'competitor_analysis' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={async () => {
                                try {
                                  const enhanced = promptManagementService.getEnhancedCompetitorPromptTemplate();
                                  const res = await promptManagementService.ensurePromptContentByKey(
                                    selectedTemplate.name,
                                    enhanced,
                                    'Manual upgrade from Admin'
                                  );
                                  if (res.updated) {
                                    await selectTemplate(selectedTemplate.id);
                                    toast({ title: 'Prompt upgraded', description: 'Content updated to enhanced template.' });
                                  } else {
                                    toast({ title: 'No changes', description: 'Already on the latest content.' });
                                  }
                                } catch (e: any) {
                                  toast({ title: 'Upgrade failed', description: e?.message || 'Unknown error', variant: 'destructive' });
                                }
                              }}
                              disabled={loading}
                            >
                              Apply enhanced content
                            </Button>
                          )}
                        </div>
                        <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-64">
                          {selectedTemplate.template}
                        </pre>
                      </div>

                      {/* Variables */}
{combinedVars.length > 0 && (
  <div>
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-medium">Variables ({combinedVars.length})</h4>
      <div className="flex items-center gap-2">
        {selectedTemplate?.category === 'competitor_analysis' && combinedVars.length > (selectedTemplate.variables?.length || 0) && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              try {
                const canonical = promptManagementService.getCanonicalCompetitorVariables();
                const res = await promptManagementService.ensurePromptHasVariablesByKey(selectedTemplate.name, canonical);
                if (res.updated && selectedTemplate?.id) {
                  await selectTemplate(selectedTemplate.id);
                  toast({ title: 'Synced', description: `${res.added} variables persisted to a new version.` });
                } else {
                  toast({ title: 'No changes', description: 'Variables are already up to date.' });
                }
              } catch (e: any) {
                toast({ title: 'Sync failed', description: e?.message || 'Unknown error', variant: 'destructive' });
              }
            }}
            disabled={loading}
          >
            Sync variables
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={async () => {
            if (selectedTemplate?.id) {
              await selectTemplate(selectedTemplate.id);
              toast({ title: 'Refreshed', description: 'Variables reloaded.' });
            } else {
              await refreshData();
              toast({ title: 'Refreshed', description: 'Templates reloaded.' });
            }
          }}
          disabled={loading}
        >
          <RotateCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
    <div className="space-y-2">
      {combinedVars.map((variable, index) => (
        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
              {`{{${variable.name}}}`}
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              {variable.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{variable.type}</span>
            {variable.required && (
              <span className="text-xs text-red-600">Required</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

                      {/* Tags */}
                      {selectedTemplate.tags.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedTemplate.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Template Metadata */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Template Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Category</div>
                        <div className="font-medium capitalize">
                          {selectedTemplate.category.replace('_', ' ')}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className={cn(
                          "font-medium",
                          selectedTemplate.isActive ? "text-green-600" : "text-red-600"
                        )}>
                          {selectedTemplate.isActive ? "Active" : "Inactive"}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Type</div>
                        <div className="font-medium">
                          {selectedTemplate.isSystem ? "System Template" : "User Template"}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Usage Count</div>
                        <div className="font-medium">{
                          (analytics.find(a => a.template_id === selectedTemplate.id)?.usage_count ?? selectedTemplate.usage_count ?? 0).toLocaleString()
                        }</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Created</div>
                        <div className="font-medium text-sm">
                          {new Date(selectedTemplate.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">Last Updated</div>
                        <div className="font-medium text-sm">
                          {new Date(selectedTemplate.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analytics Card */}
                  {analytics.find(a => a.template_id === selectedTemplate.id) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const templateAnalytics = analytics.find(a => a.template_id === selectedTemplate.id);
                          return templateAnalytics ? (
                            <div className="space-y-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Success Rate</div>
                                <div className="font-medium text-lg text-green-600">
                                  {Math.round(templateAnalytics.success_rate)}%
                                </div>
                              </div>

                              <div>
                                <div className="text-sm text-muted-foreground">Avg Tokens</div>
                                <div className="font-medium">{templateAnalytics.average_tokens}</div>
                              </div>

                              <div>
                                <div className="text-sm text-muted-foreground">Avg Cost</div>
                                <div className="font-medium">${templateAnalytics.average_cost.toFixed(4)}</div>
                              </div>

                              <div>
                                <div className="text-sm text-muted-foreground">Last Used</div>
                                <div className="font-medium text-sm">
                                  {new Date(templateAnalytics.last_used).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No performance data available
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  {/* History Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Prompt History</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {history.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No history yet.</div>
                      ) : (
                        history.slice(0, 10).map((v) => (
                          <div key={v.version_id} className="flex items-center justify-between border rounded-md p-2">
                            <div>
                              <div className="text-sm font-medium">{new Date(v.timestamp).toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">{v.version_id}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!selectedTemplate) return;
                                const confirmed = window.confirm('Restore this version? Current prompt will be saved to history.');
                                if (!confirmed) return;
                                const restored = await restorePromptVersion(selectedTemplate.id, v.version_id);
                                if (restored) {
                                  setSelectedTemplate(restored);
                                  const h = await getPromptHistory(restored.id);
                                  setHistory(h);
                                }
                              }}
                            >
                              Restore
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Template Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a template from the library to view its details
                </p>
                <Button onClick={() => setActiveTab('library')}>
                  Go to Library
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Overall Analytics Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Usage Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Executions</span>
                      <span className="font-medium">{stats.totalUsage.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Success Rate</span>
                      <span className="font-medium text-green-600">{stats.avgSuccessRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Templates</span>
                      <span className="font-medium">{stats.active}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics
                      .sort((a, b) => b.success_rate - a.success_rate)
                      .slice(0, 3)
                      .map((item, index) => {
                        const template = templates.find(t => t.id === item.template_id);
                        return (
                          <div key={item.template_id} className="flex items-center justify-between py-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {template?.name || 'Unknown Template'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.usage_count} uses
                              </div>
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {Math.round(item.success_rate)}%
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Most Used Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics
                      .sort((a, b) => b.usage_count - a.usage_count)
                      .slice(0, 3)
                      .map((item, index) => {
                        const template = templates.find(t => t.id === item.template_id);
                        return (
                          <div key={item.template_id} className="flex items-center justify-between py-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {template?.name || 'Unknown Template'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round(item.success_rate)}% success
                              </div>
                            </div>
                            <div className="text-sm font-medium">
                              {item.usage_count.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Templates</CardTitle>
                  <CardDescription>
                    Manage default system prompt templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={initializeDefaults}
                    disabled={loading}
                    className="w-full gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {loading ? 'Initializing...' : 'Initialize Default Templates'}
                  </Button>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This will create default system templates if they don't already exist.
                      Existing templates will not be modified.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup & Restore</CardTitle>
                  <CardDescription>
                    Export and import prompt templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Use the Export/Import functions in the Library tab to backup 
                    and restore your prompt templates.
                  </div>
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Regular backups are recommended before making significant changes
                      to your prompt templates.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Prompt Logs (last 100)</CardTitle>
                    <CardDescription>
                      Only visible to super admins. Prompts are previewed and hashed for privacy.
                      {logsLastRefreshed && (
                        <span className="ml-2 text-xs">Last refreshed {new Date(logsLastRefreshed).toLocaleTimeString()}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={loadLogs} size="sm" variant="default" disabled={logsLoading} className="gap-2">
                      <RotateCw className="h-4 w-4" />
                      {logsLoading ? 'Refreshing…' : 'Refresh'}
                    </Button>
                    <Button onClick={handleCreateTestLog} size="sm" variant="outline" disabled={logsLoading}>
                      {logsLoading ? 'Working…' : 'Insert test log'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logsError && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertDescription>{logsError}</AlertDescription>
                  </Alert>
                )}
                {logsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : logs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No logs found.</div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((row: any) => (
                      <div key={row.id} className="p-3 border rounded-lg flex items-start justify-between">
                        <div className="space-y-1 pr-4">
                          <div className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</div>
                          <div className="text-sm">
                            <Badge variant="secondary" className="mr-2">{row.provider}</Badge>
                            <span className="font-mono text-xs">{row.model || 'n/a'}</span>
                          </div>
                          <div className="text-sm text-foreground break-words line-clamp-2">{row.prompt_preview}</div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground min-w-[140px]">
                          <div>len: {row.prompt_length}</div>
                          <div>user: {String(row.user_id || '').slice(0, 8)}…</div>
                          {row.session_id && <div>session: {String(row.session_id).slice(0,6)}…</div>}
                          <div>{row.status || 'sent'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      </div>
    </EnhancedErrorBoundary>
  );
};

export default PromptManagementPage;