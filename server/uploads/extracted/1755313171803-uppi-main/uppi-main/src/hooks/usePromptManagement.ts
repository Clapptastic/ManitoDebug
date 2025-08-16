import { useState, useEffect, useCallback } from 'react';
import { promptManagementService } from '@/services/promptManagementService';
import type { PromptVersion } from '@/services/promptManagementService';
import { 
  PromptTemplate, 
  UserPromptConfig, 
  PromptPreviewRequest, 
  PromptPreviewResponse,
  PromptValidationResult,
  PromptAnalytics,
  PromptCategory
} from '@/types/prompts';
import { useToast } from '@/hooks/use-toast';

// Module-level cache with error recovery and deduplication to prevent infinite loops
let pm_initialized = false;
let pm_initializing = false;
let pm_refreshPromise: Promise<void> | null = null;
let pm_lastError: Error | null = null;
let pm_errorCount = 0;
const PM_MAX_ERRORS = 3;
let pm_cache: { templates: PromptTemplate[]; analytics: PromptAnalytics[]; userConfig: UserPromptConfig | null } = {
  templates: [],
  analytics: [],
  userConfig: null
};
interface UsePromptManagementReturn {
  // State
  templates: PromptTemplate[];
  selectedTemplate: PromptTemplate | null;
  userConfig: UserPromptConfig | null;
  analytics: PromptAnalytics[];
  loading: boolean;
  saving: boolean;
  previewing: boolean;
  validating: boolean;
  
  // Actions
  loadTemplates: (filters?: { category?: PromptCategory; isActive?: boolean; search?: string }) => Promise<void>;
  selectTemplate: (id: string) => Promise<void>;
  createTemplate: (template: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateTemplate: (id: string, updates: Partial<PromptTemplate>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  previewPrompt: (request: PromptPreviewRequest) => Promise<PromptPreviewResponse | null>;
  validatePrompt: (template: string, variables: any[]) => Promise<PromptValidationResult | null>;
  saveUserConfig: (config: Omit<UserPromptConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  loadAnalytics: (templateId?: string) => Promise<void>;
  exportPrompts: (templateIds?: string[]) => Promise<PromptTemplate[]>;
  importPrompts: (templates: Partial<PromptTemplate>[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  initializeDefaults: () => Promise<boolean>;
  
  // History
  getPromptHistory: (templateId: string) => Promise<PromptVersion[]>;
  restorePromptVersion: (templateId: string, versionId: string) => Promise<PromptTemplate | null>;
  
  // Utilities
  refreshData: () => Promise<void>;
  clearSelection: () => void;
}

export const usePromptManagement = (): UsePromptManagementReturn => {
  // State
  const [templates, setTemplates] = useState<PromptTemplate[]>(pm_cache.templates);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [userConfig, setUserConfig] = useState<UserPromptConfig | null>(pm_cache.userConfig);
  const [analytics, setAnalytics] = useState<PromptAnalytics[]>(pm_cache.analytics);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [validating, setValidating] = useState(false);
  
  const { toast } = useToast();

  // Load templates with optional filters
  const loadTemplates = useCallback(async (filters?: { 
    category?: PromptCategory; 
    isActive?: boolean; 
    search?: string;
  }) => {
    // Debounce rapid calls
    if (loading) return;
    
    setLoading(true);
    try {
      const data = await promptManagementService.getPromptTemplates(filters);
      setTemplates(data);
      pm_cache.templates = data;
    } catch (error) {
      console.error('Error loading templates:', error);
      // Only show toast for user-initiated actions, not background refreshes
      if (!pm_initialized) {
        toast({
          title: 'Error',
          description: 'Failed to load prompt templates. Please refresh the page.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, loading]);

  // Select a specific template
  const selectTemplate = useCallback(async (id: string) => {
    try {
      const template = await promptManagementService.getPromptTemplate(id);
      setSelectedTemplate(template);
      
      if (template) {
        // Load analytics for this template
        const templateAnalytics = await promptManagementService.getPromptAnalytics(id);
        setAnalytics(templateAnalytics);
      }
    } catch (error) {
      console.error('Error selecting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template details',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Create new template
  const createTemplate = useCallback(async (template: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    setSaving(true);
    try {
      const result = await promptManagementService.createPromptTemplate(template);
      
      if (result) {
        toast({
          title: 'Success',
          description: 'Prompt template created successfully',
        });
        await loadTemplates(); // Refresh list
        return true;
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create prompt template',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadTemplates, toast]);

  // Update existing template
  const updateTemplate = useCallback(async (id: string, updates: Partial<PromptTemplate>): Promise<boolean> => {
    setSaving(true);
    try {
      const result = await promptManagementService.updatePromptTemplate(id, updates);
      
      if (result) {
        toast({
          title: 'Success',
          description: 'Prompt template updated successfully',
        });
        
        // Update local state
        setTemplates(prev => prev.map(t => t.id === id ? result : t));
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(result);
        }
        
        return true;
      } else {
        throw new Error('Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update prompt template',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [selectedTemplate, toast]);

  // Delete template
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const success = await promptManagementService.deletePromptTemplate(id);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Prompt template deleted successfully',
        });
        
        // Update local state
        setTemplates(prev => prev.filter(t => t.id !== id));
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null);
        }
        
        return true;
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete prompt template',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [selectedTemplate, toast]);

  // Preview prompt
  const previewPrompt = useCallback(async (request: PromptPreviewRequest): Promise<PromptPreviewResponse | null> => {
    setPreviewing(true);
    try {
      const result = await promptManagementService.previewPrompt(request);
      return result;
    } catch (error) {
      console.error('Error previewing prompt:', error);
      toast({
        title: 'Preview Error',
        description: 'Failed to generate prompt preview',
        variant: 'destructive',
      });
      return null;
    } finally {
      setPreviewing(false);
    }
  }, [toast]);

  // Validate prompt
  const validatePrompt = useCallback(async (template: string, variables: any[]): Promise<PromptValidationResult | null> => {
    setValidating(true);
    try {
      const result = await promptManagementService.validatePrompt(template, variables);
      return result;
    } catch (error) {
      console.error('Error validating prompt:', error);
      toast({
        title: 'Validation Error',
        description: 'Failed to validate prompt template',
        variant: 'destructive',
      });
      return null;
    } finally {
      setValidating(false);
    }
  }, [toast]);

  // Save user configuration
  const saveUserConfig = useCallback(async (config: Omit<UserPromptConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    setSaving(true);
    try {
      const success = await promptManagementService.saveUserPromptConfig(config);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Prompt configuration saved successfully',
        });
        
        // Reload user config
        const newConfig = await promptManagementService.getUserPromptConfig();
        setUserConfig(newConfig);
        pm_cache.userConfig = newConfig;
        
        return true;
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving user config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save prompt configuration',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Load analytics
  const loadAnalytics = useCallback(async (templateId?: string) => {
    try {
      const data = await promptManagementService.getPromptAnalytics(templateId);
      setAnalytics(data);
      pm_cache.analytics = data;
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, []);

  // Export prompts
  const exportPrompts = useCallback(async (templateIds?: string[]): Promise<PromptTemplate[]> => {
    try {
      const data = await promptManagementService.exportPrompts(templateIds);
      toast({
        title: 'Export Complete',
        description: `Exported ${data.length} prompt templates`,
      });
      return data;
    } catch (error) {
      console.error('Error exporting prompts:', error);
      toast({
        title: 'Export Error',
        description: 'Failed to export prompt templates',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  // Import prompts
  const importPrompts = useCallback(async (templates: Partial<PromptTemplate>[]): Promise<{ success: number; failed: number; errors: string[] }> => {
    setSaving(true);
    try {
      const results = await promptManagementService.importPrompts(templates);
      
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${results.success} templates. ${results.failed} failed.`,
        variant: results.failed > 0 ? 'destructive' : 'default',
      });
      
      if (results.success > 0) {
        await loadTemplates(); // Refresh list
      }
      
      return results;
    } catch (error) {
      console.error('Error importing prompts:', error);
      toast({
        title: 'Import Error',
        description: 'Failed to import prompt templates',
        variant: 'destructive',
      });
      return { success: 0, failed: templates.length, errors: ['Import failed'] };
    } finally {
      setSaving(false);
    }
  }, [loadTemplates, toast]);

  // Initialize default templates
  const initializeDefaults = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const success = await promptManagementService.initializeDefaultTemplates();
      
      if (success) {
        toast({
          title: 'Initialization Complete',
          description: 'Default prompt templates have been set up',
        });
        await loadTemplates(); // Refresh list
      }
      
      return success;
    } catch (error) {
      console.error('Error initializing defaults:', error);
      toast({
        title: 'Initialization Error',
        description: 'Failed to initialize default templates',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadTemplates, toast]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadTemplates(),
      loadAnalytics(),
      (async () => {
        const config = await promptManagementService.getUserPromptConfig();
        setUserConfig(config);
      })()
    ]);
  }, [loadTemplates, loadAnalytics]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedTemplate(null);
    setAnalytics([]);
  }, []);

  // Load initial data with StrictMode/duplicate-mount deduping and cache hydration
  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    // Hydrate from module-level cache instantly to avoid blank states
    if (pm_cache.templates.length && templates.length === 0) {
      setTemplates(pm_cache.templates);
    }
    if (pm_cache.analytics.length && analytics.length === 0) {
      setAnalytics(pm_cache.analytics);
    }
    if (pm_cache.userConfig && !userConfig) {
      setUserConfig(pm_cache.userConfig);
    }

    async function init() {
      try {
        if (pm_initialized) return; // Already initialized elsewhere

        if (pm_initializing && pm_refreshPromise) {
          await pm_refreshPromise; // Await ongoing init
          return;
        }

        pm_initializing = true;
        
        // Add timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            console.warn('Prompt management initialization timeout');
            pm_initializing = false;
            setLoading(false);
          }
        }, 10000);

        pm_refreshPromise = (async () => {
          await refreshData();
          pm_initialized = true;
        })().finally(() => {
          pm_initializing = false;
          if (timeoutId) clearTimeout(timeoutId);
        });
        
        await pm_refreshPromise;
      } catch (e) {
        console.warn('usePromptManagement init error:', e);
        pm_initializing = false;
        if (timeoutId) clearTimeout(timeoutId);
      } finally {
        if (cancelled) return;
      }
    }

    init();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [refreshData]);

  return {
    // State
    templates,
    selectedTemplate,
    userConfig,
    analytics,
    loading,
    saving,
    previewing,
    validating,
    
    // Actions
    loadTemplates,
    selectTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewPrompt,
    validatePrompt,
    saveUserConfig,
    loadAnalytics,
    exportPrompts,
    importPrompts,
    initializeDefaults,
    
    // Utilities
    refreshData,
    clearSelection,

    // History
    getPromptHistory: async (templateId: string) => promptManagementService.getPromptHistory(templateId),
    restorePromptVersion: async (templateId: string, versionId: string) => {
      const restored = await promptManagementService.restorePromptVersion(templateId, versionId);
      if (restored) {
        setTemplates(prev => prev.map(t => t.id === templateId ? restored : t));
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(restored);
        }
      }
      return restored;
    },
  };
};