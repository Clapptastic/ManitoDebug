import { supabase } from '@/integrations/supabase/client';
import { 
  PromptTemplate, 
  UserPromptConfig, 
  PromptPreviewRequest, 
  PromptPreviewResponse,
  PromptValidationResult,
  PromptAnalytics,
  DEFAULT_SYSTEM_PROMPTS,
  PromptCategory
} from '@/types/prompts';
import type { Database } from '@/integrations/supabase/types';

type DBPrompt = Database['public']['Tables']['prompts']['Row'];
type DBPromptVersion = Database['public']['Tables']['prompt_versions']['Row'];

export interface PromptVersion {
  /** Unique version identifier */
  version_id: string;
  /** Full snapshot of the prompt template at the time of the change */
  template_snapshot: PromptTemplate;
  /** ISO timestamp of when the version was created */
  timestamp: string;
  /** Optional metadata for auditing */
  changed_by?: string;
  change_summary?: string;
}

class PromptManagementService {
  private localTemplates: PromptTemplate[] = [];
  private promptHistory: Record<string, PromptVersion[]> = {};

  constructor() {
    // Initialize with default templates
    this.localTemplates = DEFAULT_SYSTEM_PROMPTS.map((template, index) => ({
      id: `system-${index}`,
      name: template.name!,
      description: template.description!,
      category: template.category!,
      template: template.template!,
      variables: template.variables!,
      isSystem: template.isSystem!,
      isActive: template.isActive!,
      tags: template.tags!,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      usage_count: 0
    }));
  }

  // Simple UUID v4 check (lowercase/uppercase hex allowed)
  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  }

  private mapDomainToCategory(domain: string): PromptCategory {
    switch (domain) {
      case 'competitor_analysis':
        return 'competitor_analysis';
      case 'news':
        return 'market_research';
      case 'financials':
      case 'drill_down':
      case 'quality':
        return 'data_analysis';
      case 'forecast':
        return 'business_planning';
      case 'admin':
      case 'system':
        return 'system';
      default:
        return 'general';
    }
  }

  // Canonical variable set for competitor analysis mapped to DB fields
  // SINGLE SOURCE OF TRUTH for prompt variables to ensure full data coverage
  private competitorAnalysisVariables(): PromptTemplate['variables'] {
    return [
      { name: 'name', type: 'text', description: 'Company name', required: true },
      { name: 'website_url', type: 'text', description: 'Official website URL', required: false },
      { name: 'ticker', type: 'text', description: 'Public ticker symbol (if applicable)', required: false },
      { name: 'industry', type: 'text', description: 'Primary industry', required: false },
      { name: 'country', type: 'text', description: 'Headquarters country', required: false },
      { name: 'languages', type: 'array', description: 'Languages to prioritize for sources', required: false },
      { name: 'description', type: 'text', description: 'Short company description', required: false },
      { name: 'employee_count', type: 'number', description: 'Number of employees', required: false },
      { name: 'founded_year', type: 'number', description: 'Year founded', required: false },
      { name: 'headquarters', type: 'text', description: 'Headquarters location (city, country)', required: false },
      { name: 'business_model', type: 'text', description: 'Business model', required: false },
      { name: 'target_market', type: 'array', description: 'Target market segments', required: false },
      { name: 'strengths', type: 'array', description: 'Strengths list', required: false },
      { name: 'weaknesses', type: 'array', description: 'Weaknesses list', required: false },
      { name: 'opportunities', type: 'array', description: 'Opportunities list', required: false },
      { name: 'threats', type: 'array', description: 'Threats list', required: false },
      { name: 'pricing_strategy', type: 'object', description: 'Pricing strategy details', required: false },
      { name: 'funding_info', type: 'object', description: 'Funding rounds and investors', required: false },
      { name: 'social_media_presence', type: 'object', description: 'Social media metrics/handles', required: false },
      { name: 'market_position', type: 'text', description: 'Market position summary', required: false },
      { name: 'sources', type: 'array', description: 'Cited sources with title and URL', required: false },
      { name: 'analysis_data', type: 'object', description: 'Raw analysis data blob (including citations)', required: false },
      { name: 'confidence_scores', type: 'object', description: 'Confidence per section/field (0-1)', required: false },
      { name: 'data_quality_score', type: 'number', description: 'Overall data quality score (0-1)', required: false },
      { name: 'data_completeness_score', type: 'number', description: 'Data completeness score (0-1)', required: false },
      { name: 'market_sentiment_score', type: 'number', description: 'Market sentiment score (-1 to 1)', required: false },
      { name: 'actual_cost', type: 'number', description: 'Estimated analysis cost in USD (self-reported)', required: false },
      { name: 'website_verified', type: 'boolean', description: 'Website verified flag', required: false },
      { name: 'employee_count_verified', type: 'boolean', description: 'Employee count verified flag', required: false },
      // DB linkage/context fields
      { name: 'status', type: 'text', description: 'Analysis status (pending|running|completed|failed)', required: false },
      { name: 'session_id', type: 'text', description: 'Client session identifier', required: false },
      { name: 'organization_id', type: 'text', description: 'Organization UUID', required: false },
      { name: 'company_profile_id', type: 'text', description: 'Linked company profile UUID', required: false },
      { name: 'analysis_id', type: 'text', description: 'Analysis correlation UUID', required: false },
      // Prompt behavior controls
      { name: 'analysis_depth', type: 'text', description: 'Level of analysis detail (overview|comprehensive|focused)', required: false },
      { name: 'focus_areas', type: 'array', description: 'Specific areas to focus the analysis on', required: false },
      { name: 'time_horizon', type: 'text', description: 'Time horizon for trends (e.g., 12m, 3y)', required: false },
      { name: 'max_sources', type: 'number', description: 'Maximum number of citations to include', required: false },
      { name: 'require_sources', type: 'boolean', description: 'Require citations for claims', required: false },
    ];
  }


  /**
   * Get all prompt templates with optional filtering
   */
  async getPromptTemplates(filters?: {
    category?: PromptCategory;
    isActive?: boolean;
    isSystem?: boolean;
    search?: string;
  }): Promise<PromptTemplate[]> {
    try {
      // If not authenticated, avoid hitting RLS and return local defaults
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        // Apply filters to local templates
        let filtered = [...this.localTemplates];
        if (filters?.category) filtered = filtered.filter(t => t.category === filters.category);
        if (filters?.isActive !== undefined) filtered = filtered.filter(t => t.isActive === filters.isActive);
        if (filters?.isSystem !== undefined) filtered = filtered.filter(t => t.isSystem === filters.isSystem);
        if (filters?.search) {
          const search = filters.search.toLowerCase();
          filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(search) || 
            (t.description || '').toLowerCase().includes(search)
          );
        }
        return filtered;
      }

      const { data: rows, error } = await supabase
        .from('prompts')
        .select('id,key,provider,domain,description,is_active,created_at,updated_at,current_version_id')
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const prompts = (rows as DBPrompt[]) || [];
      if (prompts.length === 0) return [];

      // Bulk load versions to avoid N+1 queries
      const promptIds = prompts.map(p => p.id);
      const currentVersionIds = prompts
        .map(p => p.current_version_id)
        .filter((id): id is string => !!id);

      // Fetch all versions for these prompts (for fallback latest), plus ensure current_version rows are present
      const [allVersionsRes, currentVersionsRes] = await Promise.all([
        supabase
          .from('prompt_versions')
          .select('id,prompt_id,content,metadata,created_at,version')
          .in('prompt_id', promptIds),
        currentVersionIds.length
          ? supabase
              .from('prompt_versions')
              .select('id,prompt_id,content,metadata,created_at,version')
              .in('id', currentVersionIds)
          : Promise.resolve({ data: [] as any[], error: null } as any)
      ]);

      const allVersions = (allVersionsRes.data as DBPromptVersion[] | null) || [];
      const explicitCurrent = (currentVersionsRes.data as DBPromptVersion[] | null) || [];

      // Build maps for quick lookup
      const latestByPrompt = new Map<string, DBPromptVersion>();
      for (const v of allVersions) {
        const existing = latestByPrompt.get((v as any).prompt_id as string);
        if (!existing || (v.version ?? 0) > (existing.version ?? 0) || ((v as any).created_at > (existing as any).created_at)) {
          latestByPrompt.set((v as any).prompt_id as string, v);
        }
      }
      const byId = new Map<string, DBPromptVersion>();
      for (const v of allVersions) byId.set(v.id as unknown as string, v);
      for (const v of explicitCurrent) byId.set(v.id as unknown as string, v);

      const templates: PromptTemplate[] = prompts.map((p) => {
        let version: DBPromptVersion | null = null;
        if (p.current_version_id) {
          version = byId.get(p.current_version_id as unknown as string) || null;
        }
        if (!version) {
          version = latestByPrompt.get(p.id) || null;
        }

        const meta = (version?.metadata ?? {}) as Record<string, unknown>;
        const varsValue = meta['variables'];
        let variables = Array.isArray(varsValue) ? (varsValue as unknown as PromptTemplate['variables']) : [];

        // Ensure competitor analysis prompts expose full DB field coverage
        if (this.mapDomainToCategory(p.domain) === 'competitor_analysis') {
          const canonical = this.competitorAnalysisVariables();
          const existing = new Set(variables.map(v => v.name));
          const merged = [...variables];
          for (const v of canonical) {
            if (!existing.has(v.name)) merged.push(v);
          }
          variables = merged;
        }

        const tmpl: PromptTemplate = {
          id: p.id,
          name: p.key,
          description: p.description ?? `${p.domain}/${p.provider}`,
          category: this.mapDomainToCategory(p.domain),
          template: version?.content ?? '',
          variables,
          isSystem: true,
          isActive: p.is_active,
          tags: [p.provider, p.domain],
          created_at: (p.created_at as unknown as string) ?? new Date().toISOString(),
          updated_at: (p.updated_at as unknown as string) ?? new Date().toISOString(),
          usage_count: 0
        };
        return tmpl;
      });

      // Apply filters client-side for now
      let filtered = templates;
      if (filters?.category) {
        filtered = filtered.filter(t => t.category === filters.category);
      }
      if (filters?.isActive !== undefined) {
        filtered = filtered.filter(t => t.isActive === filters.isActive);
      }
      if (filters?.isSystem !== undefined) {
        filtered = filtered.filter(t => t.isSystem === filters.isSystem);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(t => 
          t.name.toLowerCase().includes(search) || 
          (t.description || '').toLowerCase().includes(search)
        );
      }

      return filtered;
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
      // Fallback to in-memory in case of RLS/permission errors
      return this.localTemplates;
    }
  }

  /**
   * Get a specific prompt template by ID
   */
  async getPromptTemplate(id: string): Promise<PromptTemplate | null> {
    try {
      // If it's not a UUID, treat as local/system template
      if (!this.isUuid(id)) {
        return this.localTemplates.find(t => t.id === id) || null;
      }

      // Try DB fetch for UUIDs
      const { data: p } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!p) return null;

      let version: DBPromptVersion | null = null;
      if ((p as DBPrompt).current_version_id) {
        const { data: v } = await supabase
          .from('prompt_versions')
          .select('*')
          .eq('id', (p as DBPrompt).current_version_id as any)
          .maybeSingle();
        version = (v as DBPromptVersion) || null;
      }

      let variables = Array.isArray(version?.metadata?.['variables'])
        ? (version!.metadata!['variables'] as unknown as PromptTemplate['variables'])
        : [];

      if (this.mapDomainToCategory((p as DBPrompt).domain) === 'competitor_analysis') {
        const canonical = this.competitorAnalysisVariables();
        const existing = new Set(variables.map(v => v.name));
        for (const v of canonical) {
          if (!existing.has(v.name)) variables.push(v);
        }
      }

      return {
        id,
        name: (p as DBPrompt).key,
        description: (p as DBPrompt).description ?? '',
        category: this.mapDomainToCategory((p as DBPrompt).domain),
        template: version?.content ?? '',
        variables,
        isSystem: true,
        isActive: (p as DBPrompt).is_active,
        tags: [(p as DBPrompt).provider, (p as DBPrompt).domain],
        created_at: (p as any).created_at ?? new Date().toISOString(),
        updated_at: (p as any).updated_at ?? new Date().toISOString(),
        usage_count: 0
      };
    } catch (error) {
      console.error('Error fetching prompt template:', error);
      return null;
    }
  }

  /**
   * Create a new prompt template
   */
  async createPromptTemplate(template: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<PromptTemplate | null> {
    try {
      // Prefer DB path when authenticated; fallback to local otherwise
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const newTemplate: PromptTemplate = {
          id: `custom-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...template
        };
        this.localTemplates.push(newTemplate);
        await this.trackPromptAction('template_created', template.name);
        return newTemplate;
      }

      const providers = ['openai', 'anthropic', 'perplexity', 'gemini', 'cohere', 'mistral', 'system'];
      const provider = (template.tags || []).find(t => providers.includes(t)) || 'system';
      const domain = (() => {
        switch (template.category) {
          case 'competitor_analysis': return 'competitor_analysis';
          case 'market_research': return 'news';
          case 'business_planning': return 'forecast';
          case 'data_analysis': return 'quality';
          case 'system': return 'system';
          default: return 'general';
        }
      })();

      const { data: promptRow, error: insertErr } = await supabase
        .from('prompts')
        .insert({
          key: template.name,
          provider,
          domain,
          description: template.description ?? null,
          is_active: template.isActive
        })
        .select('*')
        .maybeSingle();
      if (insertErr || !promptRow) throw insertErr || new Error('Failed to insert prompt');

      // Merge canonical variables for competitor analysis to ensure full DB coverage
      let vars = template.variables ?? [];
      if (template.category === 'competitor_analysis') {
        const canonical = this.competitorAnalysisVariables();
        const existing = new Set(vars.map(v => v.name));
        for (const v of canonical) {
          if (!existing.has(v.name)) vars.push(v);
        }
      }

      const metadata = {
        variables: vars,
        tags: template.tags ?? []
      } as Record<string, unknown>;

      const { data: versionRow, error: verErr } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: (promptRow as DBPrompt).id,
          content: template.template,
          metadata: metadata as any,
          created_by: user.id,
          version: 0
        })
        .select('*')
        .maybeSingle();
      if (verErr || !versionRow) throw verErr || new Error('Failed to insert prompt version');

      await supabase
        .from('prompts')
        .update({ current_version_id: (versionRow as DBPromptVersion).id })
        .eq('id', (promptRow as DBPrompt).id);

      // Audit (best-effort)
      await supabase.from('admin_audit_log').insert({
        action: 'prompt_created',
        resource_type: 'prompt',
        resource_id: (promptRow as DBPrompt).id,
        admin_user_id: user.id,
        success: true,
        new_values: {
          key: (promptRow as DBPrompt).key,
          version_id: (versionRow as DBPromptVersion).id
        }
      } as any);

      const variables = Array.isArray((versionRow as DBPromptVersion).metadata?.['variables'])
        ? ((versionRow as DBPromptVersion).metadata!['variables'] as unknown as PromptTemplate['variables'])
        : [];

      const result: PromptTemplate = {
        id: (promptRow as DBPrompt).id,
        name: (promptRow as DBPrompt).key,
        description: (promptRow as DBPrompt).description ?? `${domain}/${provider}`,
        category: this.mapDomainToCategory(domain),
        template: (versionRow as DBPromptVersion).content ?? '',
        variables,
        isSystem: true,
        isActive: (promptRow as DBPrompt).is_active,
        tags: [provider, domain],
        created_at: (promptRow as any).created_at ?? new Date().toISOString(),
        updated_at: (promptRow as any).updated_at ?? new Date().toISOString(),
        usage_count: 0
      };

      await this.trackPromptAction('template_created', result.name);
      return result;

    } catch (error) {
      console.error('Error creating prompt template:', error);
      // Fallback (local) to avoid breaking UX
      const newTemplate: PromptTemplate = {
        id: `custom-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...template
      };
      this.localTemplates.push(newTemplate);
      return newTemplate;
    }
  }

  /**
   * Update an existing prompt template
   */
  async updatePromptTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Local fallback
        const index = this.localTemplates.findIndex(t => t.id === id);
        if (index === -1) return null;
        const prev = this.localTemplates[index];
        const version: PromptVersion = {
          version_id: `v-${Date.now()}`,
          template_snapshot: { ...prev },
          timestamp: new Date().toISOString()
        };
        this.promptHistory[id] = [version, ...(this.promptHistory[id] || [])];
        this.localTemplates[index] = { ...prev, ...updates, updated_at: new Date().toISOString() };
        await this.trackPromptAction('template_updated', updates.name || id);
        return this.localTemplates[index];
      }

      // Patch metadata on prompts
      const patch: Record<string, unknown> = {};
      if (typeof updates.name === 'string') patch['key'] = updates.name;
      if (typeof updates.description !== 'undefined') patch['description'] = updates.description;
      if (typeof updates.isActive === 'boolean') patch['is_active'] = updates.isActive;
      if (Object.keys(patch).length) {
        await supabase.from('prompts').update(patch).eq('id', id);
      }

      let newVersionId: string | null = null;
      if (typeof updates.template === 'string') {
        const metadata = {
          variables: updates.variables ?? []
        } as Record<string, unknown>;
        const { data: vrow, error: verr } = await supabase
          .from('prompt_versions')
          .insert({ prompt_id: id, content: updates.template, metadata: metadata as any, created_by: user.id, version: 0 })
          .select('*')
          .maybeSingle();
        if (verr) throw verr;
        if (vrow) {
          newVersionId = (vrow as DBPromptVersion).id as string;
          await supabase.from('prompts').update({ current_version_id: newVersionId }).eq('id', id);
        }
      }

      // Audit (best-effort)
      await supabase.from('admin_audit_log').insert({
        action: 'prompt_updated',
        resource_type: 'prompt',
        resource_id: id,
        admin_user_id: user.id,
        success: true,
        new_values: {
          key: updates.name,
          version_id: newVersionId
        }
      } as any);

      // Return current state
      const { data: p } = await supabase.from('prompts').select('*').eq('id', id).maybeSingle();
      let version = null as DBPromptVersion | null;
      if (p && (p as DBPrompt).current_version_id) {
        const { data: v } = await supabase
          .from('prompt_versions')
          .select('*')
          .eq('id', (p as DBPrompt).current_version_id as any)
          .maybeSingle();
        version = (v as DBPromptVersion) || null;
      }

      const variables = Array.isArray(version?.metadata?.['variables'])
        ? (version!.metadata!['variables'] as unknown as PromptTemplate['variables'])
        : [];

      if (p) {
        return {
          id,
          name: (p as DBPrompt).key,
          description: (p as DBPrompt).description ?? '',
          category: this.mapDomainToCategory((p as DBPrompt).domain),
          template: version?.content ?? '',
          variables,
          isSystem: true,
          isActive: (p as DBPrompt).is_active,
          tags: [(p as DBPrompt).provider, (p as DBPrompt).domain],
          created_at: (p as any).created_at ?? new Date().toISOString(),
          updated_at: (p as any).updated_at ?? new Date().toISOString(),
          usage_count: 0
        };
      }
      return null;

    } catch (error) {
      console.error('Error updating prompt template:', error);
      return null;
    }
  }

  /**
   * Delete a prompt template
   */
  async deletePromptTemplate(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const index = this.localTemplates.findIndex(t => t.id === id);
        if (index === -1) return false;
        this.localTemplates.splice(index, 1);
        await this.trackPromptAction('template_deleted', id);
        return true;
      }

      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('admin_audit_log').insert({
        action: 'prompt_deleted',
        resource_type: 'prompt',
        resource_id: id,
        admin_user_id: user.id,
        success: true
      } as any);
      return true;

    } catch (error) {
      console.error('Error deleting prompt template:', error);
      return false;
    }
  }

  /**
   * Preview a prompt with variables substituted
   */
  async previewPrompt(request: PromptPreviewRequest): Promise<PromptPreviewResponse> {
    try {
      // Simple variable replacement for preview
      let rendered = request.template;
      
      Object.entries(request.variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        rendered = rendered.replace(regex, String(value));
      });

      // Mock token count and cost calculation
      const tokenCount = Math.ceil(rendered.length / 4); // Rough estimate
      const estimatedCost = tokenCount * 0.0001; // Mock pricing

      return {
        rendered_prompt: rendered,
        token_count: tokenCount,
        estimated_cost: estimatedCost,
        warnings: []
      };
      
    } catch (error) {
      console.error('Error previewing prompt:', error);
      return {
        rendered_prompt: request.template,
        token_count: 0,
        estimated_cost: 0,
        warnings: ['Preview service unavailable']
      };
    }
  }

  /**
   * Validate a prompt template
   */
  async validatePrompt(template: string, variables: any[]): Promise<PromptValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Basic validation
      if (!template.trim()) {
        errors.push('Template cannot be empty');
      }

      // Check for undefined variables
      const variableMatches = template.match(/\{\{(\w+)\}\}/g);
      if (variableMatches) {
        const usedVars = variableMatches.map(match => match.replace(/[{}]/g, ''));
        const definedVars = variables.map(v => v.name);
        
        usedVars.forEach(varName => {
          if (!definedVars.includes(varName)) {
            warnings.push(`Variable "${varName}" is used but not defined`);
          }
        });
      }

      const score = errors.length === 0 ? (warnings.length === 0 ? 100 : 75) : 25;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        score
      };
      
    } catch (error) {
      console.error('Error validating prompt:', error);
      return {
        isValid: true,
        errors: [],
        warnings: ['Validation service unavailable'],
        suggestions: [],
        score: 50
      };
    }
  }

  /**
   * Get user's active prompt configuration
   */
  async getUserPromptConfig(): Promise<UserPromptConfig | null> {
    try {
      // Return mock config for now
      return {
        id: 'mock-config',
        user_id: 'current-user',
        template_id: 'system-0',
        custom_prompt: 'You are a helpful AI assistant.',
        variables: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error fetching user prompt config:', error);
      return null;
    }
  }

  /**
   * Save user's prompt configuration
   */
  async saveUserPromptConfig(config: Omit<UserPromptConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      console.log('Saving user prompt config:', config);
      
      // Track analytics
      await this.trackPromptAction('config_saved', 'user_prompt_config');
      
      return true;
      
    } catch (error) {
      console.error('Error saving user prompt config:', error);
      return false;
    }
  }

  /**
   * Get prompt analytics
   */
  async getPromptAnalytics(templateId?: string): Promise<PromptAnalytics[]> {
    try {
      // Attempt to return REAL analytics from Supabase when authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        return [];
      }

      // Helper to aggregate rows into PromptAnalytics
      const buildAnalytics = (templateIdForResult: string, rows: any[]): PromptAnalytics => {
        const count = rows.reduce((acc, r) => acc + (typeof r.usage_count === 'number' ? r.usage_count : 1), 0);
        const successes = rows.filter(r => r.success === true).length;
        const successRate = rows.length > 0 ? Math.round((successes / rows.length) * 100) : 0;
        const avgTokens = rows.length > 0
          ? Math.round(rows.reduce((acc, r) => acc + (r.tokens_used ?? 0), 0) / rows.length)
          : 0;
        const avgCost = rows.length > 0
          ? rows.reduce((acc, r) => acc + (r.cost_usd ?? 0), 0) / rows.length
          : 0;
        const lastTs = rows
          .map(r => r.request_timestamp || r.created_at || r.date)
          .filter(Boolean)
          .sort((a: string, b: string) => (a > b ? -1 : 1))[0] || new Date().toISOString();

        return {
          template_id: templateIdForResult,
          usage_count: count,
          success_rate: successRate,
          average_tokens: avgTokens,
          average_cost: Number(avgCost.toFixed(4)),
          last_used: lastTs,
          popular_variables: {}
        };
      };

      if (templateId && this.isUuid(templateId)) {
        // Fetch prompt to determine provider for usage mapping
        const { data: promptRow } = await supabase
          .from('prompts')
          .select('id, provider')
          .eq('id', templateId)
          .maybeSingle();

        if (!promptRow) return [];

        // Primary source: api_usage_costs filtered by provider
        const { data: usageRows } = await supabase
          .from('api_usage_costs')
          .select('tokens_used, cost_usd, success, request_timestamp, created_at, date, usage_count')
          .eq('provider', (promptRow as any).provider)
          .order('request_timestamp', { ascending: false })
          .limit(500);

        const primary = buildAnalytics(templateId, usageRows || []);
        if (primary.usage_count > 0) return [primary];

        // Fallback: derive usage from ai_prompt_logs when cost table is empty
        try {
          const { data: logRows } = await supabase
            .from('ai_prompt_logs')
            .select('status, created_at, provider')
            .eq('provider', (promptRow as any).provider)
            .order('created_at', { ascending: false })
            .limit(500);

          const mapped = (logRows || []).map((r: any) => ({
            usage_count: 1,
            success: ['completed', 'success', 'ok'].includes(String(r.status || '').toLowerCase()),
            tokens_used: 0,
            cost_usd: 0,
            created_at: r.created_at
          }));

          return [buildAnalytics(templateId, mapped)];
        } catch {
          // If fallback also fails, return primary (zero) to avoid UI breakage
          return [primary];
        }
      }

      // Global analytics (used for page-level stats when no template is selected)
      const { data: globalRows } = await supabase
        .from('api_usage_costs')
        .select('tokens_used, cost_usd, success, request_timestamp, created_at, date, usage_count')
        .order('request_timestamp', { ascending: false })
        .limit(500);

      const globalPrimary = buildAnalytics('global', globalRows || []);
      if (globalPrimary.usage_count > 0) return [globalPrimary];

      // Fallback global: count from ai_prompt_logs when costs are missing
      try {
        const { data: logRows } = await supabase
          .from('ai_prompt_logs')
          .select('status, created_at')
          .order('created_at', { ascending: false })
          .limit(500);

        const mapped = (logRows || []).map((r: any) => ({
          usage_count: 1,
          success: ['completed', 'success', 'ok'].includes(String(r.status || '').toLowerCase()),
          tokens_used: 0,
          cost_usd: 0,
          created_at: r.created_at
        }));

        return [buildAnalytics('global', mapped)];
      } catch {
        return [globalPrimary];
      }
    } catch (error) {
      console.error('Error loading prompt analytics:', error);
      // Fallback to empty analytics to avoid UI breakage
      return [];
    }
  }

  /**
   * Initialize default prompt templates
   */
  async initializeDefaultTemplates(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Without auth, skip DB writes; indicate no-op success to avoid UI errors
        console.log('initializeDefaultTemplates skipped: no authenticated user');
        return true;
      }

      // Fetch existing keys to avoid duplicates
      const { data: existingRows, error: selErr } = await supabase
        .from('prompts')
        .select('id,key');
      if (selErr) throw selErr;
      const existing = new Set<string>((existingRows || []).map((r: any) => r.key as string));

      const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

      const mapCategoryToDomain = (category: PromptCategory): string => {
        switch (category) {
          case 'competitor_analysis': return 'competitor_analysis';
          case 'market_research': return 'news';
          case 'business_planning': return 'forecast';
          case 'data_analysis': return 'quality';
          case 'system': return 'system';
          default: return 'general';
        }
      };

      for (const t of DEFAULT_SYSTEM_PROMPTS) {
        const name = t.name ?? 'prompt';
        const domain = mapCategoryToDomain((t.category as PromptCategory) ?? 'general');
        const provider = 'system';
        const key = `${domain}.${provider}.${slug(name)}`;

        if (existing.has(key)) continue;

        const { data: promptRow, error: insPromptErr } = await supabase
          .from('prompts')
          .insert({ key, provider, domain, description: t.description ?? null, is_active: true })
          .select('*')
          .maybeSingle();
        if (insPromptErr || !promptRow) throw insPromptErr || new Error('Failed to insert prompt');

        const metadata = {
          variables: t.variables ?? [],
          tags: t.tags ?? []
        } as Record<string, unknown>;

        const { data: versionRow, error: insVerErr } = await supabase
          .from('prompt_versions')
          .insert({
            prompt_id: (promptRow as DBPrompt).id,
            content: t.template ?? '',
            metadata: metadata as any,
            created_by: user.id,
            version: 0
          })
          .select('*')
          .maybeSingle();
        if (insVerErr || !versionRow) throw insVerErr || new Error('Failed to insert prompt version');

        await supabase
          .from('prompts')
          .update({ current_version_id: (versionRow as DBPromptVersion).id })
          .eq('id', (promptRow as DBPrompt).id);

        // Audit (best-effort)
        await supabase.from('admin_audit_log').insert({
          action: 'prompt_seeded',
          resource_type: 'prompt',
          resource_id: (promptRow as DBPrompt).id,
          admin_user_id: user.id,
          success: true,
          new_values: { key, version_id: (versionRow as DBPromptVersion).id }
        } as any);
      }

      // Also ensure provider-specific defaults are present and synchronized with master
      await this.ensureCompetitorProviderDefaults();

      return true;
      
    } catch (error) {
      console.error('Error initializing default templates:', error);
      return false;
    }
  }

  /**
   * Ensure default competitor-analysis prompts exist for all providers and stay in sync
   * with the master template content. Creates provider-specific keys like
   * `competitor_analysis.openai.default` and falls back to the master when missing.
   * Returns number of created and updated entries.
   */
  public async ensureCompetitorProviderDefaults(): Promise<{ created: number; updated: number }> {
    const providers = ['system','openai','anthropic','perplexity','gemini','cohere','groq','mistral'];
    let created = 0, updated = 0;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { created: 0, updated: 0 };

      // Master content from in-code default template
      const master = (DEFAULT_SYSTEM_PROMPTS.find(t => t.name === 'Competitor Analysis Expert')?.template || '').toString();
      const canonicalVars = this.competitorAnalysisVariables();

      // Load existing prompts for domain/provider set
      const { data: existingRows, error: selErr } = await supabase
        .from('prompts')
        .select('id,key,provider,domain,current_version_id,description,is_active,created_at,updated_at')
        .eq('domain', 'competitor_analysis');
      if (selErr) throw selErr;
      const byKey = new Map<string, any>();
      (existingRows || []).forEach((r: any) => byKey.set(r.key, r));

      // Helper to fetch current content by prompt id
      const fetchCurrentContent = async (p: any): Promise<string> => {
        if (!p?.current_version_id) return '';
        const { data: v } = await supabase
          .from('prompt_versions')
          .select('id,content,metadata,version,created_at')
          .eq('id', p.current_version_id as any)
          .maybeSingle();
        return (v?.content as string) || '';
      };

      for (const provider of providers) {
        const key = `competitor_analysis.${provider}.default`;
        const existing = byKey.get(key);
        if (!existing) {
          // Create prompt row
          const { data: promptRow, error: insErr } = await supabase
            .from('prompts')
            .insert({ key, provider, domain: 'competitor_analysis', description: `Default competitor analysis prompt for ${provider}`, is_active: true })
            .select('*')
            .maybeSingle();
          if (insErr || !promptRow) throw insErr || new Error('Failed to insert provider prompt');

          const metadata = { variables: canonicalVars, tags: [provider, 'competitor_analysis'] } as Record<string, unknown>;
          const { data: versionRow, error: verErr } = await supabase
            .from('prompt_versions')
            .insert({ prompt_id: (promptRow as any).id, content: master, metadata: metadata as any, created_by: user.id, version: 0 })
            .select('*')
            .maybeSingle();
          if (verErr || !versionRow) throw verErr || new Error('Failed to insert provider prompt version');

          await supabase
            .from('prompts')
            .update({ current_version_id: (versionRow as any).id })
            .eq('id', (promptRow as any).id);

          created++;
        } else {
          const current = await fetchCurrentContent(existing);
          if (current !== master) {
            const metadata = { variables: canonicalVars, tags: [existing.provider, 'competitor_analysis'] } as Record<string, unknown>;
            const { data: newV, error: verErr } = await supabase
              .from('prompt_versions')
              .insert({ prompt_id: existing.id, content: master, metadata: metadata as any, created_by: user.id, version: (existing.version ?? 0) + 1 })
              .select('*')
              .maybeSingle();
            if (!verErr && newV) {
              await supabase
                .from('prompts')
                .update({ current_version_id: (newV as any).id })
                .eq('id', existing.id);
              updated++;
            }
          }
        }
      }

      return { created, updated };
    } catch (e) {
      console.warn('[PromptManagementService] ensureCompetitorProviderDefaults failed:', e);
      return { created, updated };
    }
  }

  /**
   * Resolve provider-specific competitor prompt content with fallback to system default.
   */
  public async getCompetitorPromptForProvider(provider: string): Promise<string> {
    try {
      const key = `competitor_analysis.${provider}.default`;
      const { data: p } = await supabase.from('prompts').select('*').eq('key', key).maybeSingle();
      if (p && p.current_version_id) {
        const { data: v } = await supabase.from('prompt_versions').select('content').eq('id', (p as any).current_version_id).maybeSingle();
        if (v?.content) return v.content as unknown as string;
      }
    } catch {}

    // Fallback to master in-code template
    const master = (DEFAULT_SYSTEM_PROMPTS.find(t => t.name === 'Competitor Analysis Expert')?.template || '').toString();
    return master;
  }


  /**
   * Track prompt-related actions for analytics
   */
  private async trackPromptAction(action: string, promptName: string): Promise<void> {
    try {
      console.log(`Prompt action tracked: ${action} - ${promptName}`);
    } catch (error) {
      // Don't throw - analytics shouldn't break main functionality
      console.warn('Analytics tracking failed:', error);
    }
  }

  /**
   * Export prompts for backup/sharing
   */
  async exportPrompts(templateIds?: string[]): Promise<PromptTemplate[]> {
    try {
      if (templateIds?.length) {
        return this.localTemplates.filter(t => templateIds.includes(t.id));
      }
      return this.localTemplates;
      
    } catch (error) {
      console.error('Error exporting prompts:', error);
      return [];
    }
  }

  /**
   * Import prompts from backup/sharing
   */
  async importPrompts(templates: Partial<PromptTemplate>[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const template of templates) {
      try {
        const result = await this.createPromptTemplate({
          name: template.name!,
          description: template.description!,
          category: template.category!,
          template: template.template!,
          variables: template.variables || [],
          isSystem: false, // Imported templates are never system templates
          isActive: template.isActive ?? true,
          tags: template.tags || [],
          usage_count: 0
        });

        if (result) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Failed to import: ${template.name}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error importing ${template.name}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Get history snapshots for a prompt
   */
  async getPromptHistory(id: string): Promise<PromptVersion[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Guard: if not UUID, treat as local/system and never hit DB
      if (!this.isUuid(id) || !user) {
        return this.promptHistory[id] || [];
      }

      const { data: prompt } = await supabase.from('prompts').select('*').eq('id', id).maybeSingle();
      if (!prompt) return [];

      const { data: versions } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', id)
        .order('version', { ascending: false });

      const p = prompt as DBPrompt;
      const items = (versions as DBPromptVersion[] | null) ?? [];
      return items.map(v => {
        const vars = Array.isArray(v.metadata?.['variables']) ? (v.metadata!['variables'] as unknown as PromptTemplate['variables']) : [];
        const snapshot: PromptTemplate = {
          id: p.id,
          name: p.key,
          description: p.description ?? `${p.domain}/${p.provider}`,
          category: this.mapDomainToCategory(p.domain),
          template: v.content,
          variables: vars,
          isSystem: true,
          isActive: p.is_active,
          tags: [p.provider, p.domain],
          created_at: (p as any).created_at ?? new Date().toISOString(),
          updated_at: (p as any).updated_at ?? new Date().toISOString()
        } as PromptTemplate;
        return {
          version_id: v.id,
          template_snapshot: snapshot,
          timestamp: (v as any).created_at ?? new Date().toISOString(),
          changed_by: (v as any).created_by
        } as PromptVersion;
      });

    } catch (error) {
      console.error('Error getting prompt history:', error);
      return this.promptHistory[id] || [];
    }
  }

  /**
   * Restore a specific version of a prompt
   */
  async restorePromptVersion(id: string, versionId: string): Promise<PromptTemplate | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Local fallback
        const index = this.localTemplates.findIndex(t => t.id === id);
        if (index === -1) return null;
        const versions = this.promptHistory[id] || [];
        const target = versions.find(v => v.version_id === versionId);
        if (!target) return null;
        const current = this.localTemplates[index];
        const currentSnapshot: PromptVersion = {
          version_id: `v-${Date.now()}`,
          template_snapshot: { ...current },
          timestamp: new Date().toISOString()
        };
        this.promptHistory[id] = [currentSnapshot, ...versions];
        this.localTemplates[index] = { ...target.template_snapshot, updated_at: new Date().toISOString() };
        await this.trackPromptAction('template_restored', id);
        return this.localTemplates[index];
      }

      // DB restore: copy content of selected version into a new version and set as current
      const { data: vrow, error: vErr } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('id', versionId)
        .maybeSingle();
      if (vErr || !vrow) throw vErr || new Error('Version not found');

      const base = vrow as DBPromptVersion;
      const { data: newV, error: insErr } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: id,
          content: base.content,
          metadata: base.metadata,
          is_rollback: true,
          created_by: user.id,
          version: 0
        })
        .select('*')
        .maybeSingle();
      if (insErr || !newV) throw insErr || new Error('Failed to create rollback version');

      await supabase.from('prompts').update({ current_version_id: (newV as DBPromptVersion).id }).eq('id', id);

      await supabase.from('admin_audit_log').insert({
        action: 'prompt_rolled_back',
        resource_type: 'prompt',
        resource_id: id,
        admin_user_id: user.id,
        success: true,
        old_values: { restored_from_version_id: versionId },
        new_values: { version_id: (newV as DBPromptVersion).id }
      } as any);

      // Return latest
      const { data: p } = await supabase.from('prompts').select('*').eq('id', id).maybeSingle();
      const { data: curV } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('id', (p as DBPrompt).current_version_id as any)
        .maybeSingle();

      const vars = Array.isArray((curV as DBPromptVersion | null)?.metadata?.['variables'])
        ? (((curV as DBPromptVersion).metadata!['variables']) as unknown as PromptTemplate['variables'])
        : [];

      if (p && curV) {
        return {
          id,
          name: (p as DBPrompt).key,
          description: (p as DBPrompt).description ?? '',
          category: this.mapDomainToCategory((p as DBPrompt).domain),
          template: (curV as DBPromptVersion).content,
          variables: vars,
          isSystem: true,
          isActive: (p as DBPrompt).is_active,
          tags: [(p as DBPrompt).provider, (p as DBPrompt).domain],
          created_at: (p as any).created_at ?? new Date().toISOString(),
          updated_at: (p as any).updated_at ?? new Date().toISOString(),
          usage_count: 0
        };
      }
      return null;

    } catch (error) {
      console.error('Error restoring prompt template:', error);
      return null;
    }
  }
  /**
   * Expose canonical competitor analysis variables (SINGLE SOURCE OF TRUTH)
   */
  public getCanonicalCompetitorVariables(): PromptTemplate['variables'] {
    return this.competitorAnalysisVariables();
  }

  /**
   * Ensure a prompt (by key) contains all canonical variables. If any are missing,
   * create a new prompt version with the same content and updated metadata.variables.
   * Returns whether an update occurred and identifiers when applicable.
   */
  public async ensurePromptHasVariablesByKey(
    key: string,
    canonicalVars?: PromptTemplate['variables']
  ): Promise<{ updated: boolean; promptId?: string; versionId?: string; added?: number }>
  {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { updated: false };
      }

      // Find prompt by key
      const { data: p, error: pErr } = await supabase
        .from('prompts')
        .select('*')
        .eq('key', key)
        .maybeSingle();
      if (pErr || !p) return { updated: false };

      // Load current version (explicit current, else latest)
      let currentVersion: DBPromptVersion | null = null;
      if ((p as DBPrompt).current_version_id) {
        const { data: v } = await supabase
          .from('prompt_versions')
          .select('*')
          .eq('id', (p as DBPrompt).current_version_id as any)
          .maybeSingle();
        currentVersion = (v as DBPromptVersion) || null;
      }
      if (!currentVersion) {
        const { data: latest } = await supabase
          .from('prompt_versions')
          .select('*')
          .eq('prompt_id', (p as DBPrompt).id as any)
          .order('version', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        currentVersion = (latest as DBPromptVersion) || null;
      }

      const existingVars: PromptTemplate['variables'] = Array.isArray(currentVersion?.metadata?.['variables'])
        ? ((currentVersion!.metadata!['variables']) as unknown as PromptTemplate['variables'])
        : [];

      // Determine canonical set based on domain when not provided
      const domain = (p as DBPrompt).domain as string;
      const canonical: PromptTemplate['variables'] = canonicalVars
        ?? (this.mapDomainToCategory(domain) === 'competitor_analysis'
          ? this.competitorAnalysisVariables()
          : existingVars);

      // Merge by variable name
      const byName = new Map<string, PromptTemplate['variables'][number]>();
      for (const v of existingVars) byName.set(v.name, v);
      let added = 0;
      for (const v of canonical) {
        if (!byName.has(v.name)) {
          byName.set(v.name, v);
          added += 1;
        }
      }
      if (added === 0) {
        return { updated: false, promptId: (p as DBPrompt).id as unknown as string, added: 0 };
      }

      const mergedVars = Array.from(byName.values());

      // Create a new version with same content but updated variables
      const baseMeta: Record<string, unknown> = (currentVersion?.metadata && typeof currentVersion.metadata === 'object')
        ? (currentVersion.metadata as unknown as Record<string, unknown>)
        : {};
      const newMeta = { ...baseMeta, variables: mergedVars } as any;
      const { data: newV, error: insErr } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: (p as DBPrompt).id as any,
          content: currentVersion?.content ?? '',
          metadata: newMeta as any,
          created_by: user.id,
          version: 0
        })
        .select('*')
        .maybeSingle();
      if (insErr || !newV) return { updated: false };

      await supabase
        .from('prompts')
        .update({ current_version_id: (newV as DBPromptVersion).id })
        .eq('id', (p as DBPrompt).id);

      // Best-effort audit
      await supabase.from('admin_audit_log').insert({
        action: 'prompt_variables_synced',
        resource_type: 'prompt',
        resource_id: (p as DBPrompt).id,
        admin_user_id: user.id,
        success: true,
        new_values: { version_id: (newV as DBPromptVersion).id, added }
      } as any);

      return {
        updated: true,
        promptId: (p as DBPrompt).id as unknown as string,
        versionId: (newV as DBPromptVersion).id as unknown as string,
        added
      };
    } catch (e) {
      console.warn('[PromptManagementService] ensurePromptHasVariablesByKey failed:', e);
      return { updated: false };
    }
  }

  /**
   * Introspect DB to build an expanded variable set that covers every related datapoint
   * across competitor analysis tables. Uses SECURITY DEFINER RPC get_schema_overview.
   */
  public async getIntrospectedCompetitorVariables(): Promise<PromptTemplate['variables']> {
    // Helper to map Postgres data types to our PromptVariable types
    const mapType = (pgType: string): PromptTemplate['variables'][number]['type'] => {
      const t = pgType.toLowerCase();
      if (t.includes('json')) return 'object';
      if (t.includes('[]')) return 'array';
      if (t.includes('int') || t.includes('numeric') || t.includes('double') || t.includes('real') || t.includes('decimal')) return 'number';
      if (t.includes('bool')) return 'boolean';
      // timestamps/dates/uuid default to text for prompt IO
      return 'text';
    };

    const wantedTables = new Map<string, string>([
      ['competitor_analyses', ''], // main table: no prefix
      ['competitor_analysis_progress', 'progress_'],
      ['analysis_provider_runs', 'provider_runs_'],
      ['analysis_provider_results', 'provider_results_'],
      ['analysis_combined', 'combined_'],
    ]);

    try {
      const { data, error } = await supabase.rpc('get_schema_overview', { schema_name: 'public' as any });
      if (error) throw error;

      const vars: PromptTemplate['variables'] = [];
      const byName = new Set<string>();

      const schema = (data as unknown) as { tables?: Array<{ table_name: string; columns: Array<{ name: string; data_type: string }> }> };
      const tables = (schema?.tables ?? []);
      for (const table of tables) {
        const prefix = wantedTables.get(table.table_name);
        if (prefix === undefined) continue; // skip unrelated tables

        for (const col of (table.columns || [])) {
          const name = (prefix || '') + col.name;
          if (!name || byName.has(name)) continue;

          const vType = mapType(col.data_type || 'text');

          // Human description
          const desc = `${table.table_name}.${col.name} (${col.data_type})`;

          vars.push({ name, type: vType, description: desc, required: false });
          byName.add(name);
        }
      }

      // Merge with canonical baseline to ensure essential names exist without prefixes
      const baseline = this.competitorAnalysisVariables();
      const merged: PromptTemplate['variables'] = [];
      const mergedByName = new Set<string>();
      for (const v of [...baseline, ...vars]) {
        if (!mergedByName.has(v.name)) {
          merged.push(v);
          mergedByName.add(v.name);
        }
      }
      return merged;
    } catch (e) {
      console.warn('[PromptManagementService] getIntrospectedCompetitorVariables failed, falling back to canonical set:', e);
      return this.competitorAnalysisVariables();
    }
  }

  /**
   * Enhanced Competitor Analysis prompt template (single source for upgrades)
   */
  public getEnhancedCompetitorPromptTemplate(): string {
    return `You are a senior Competitive Intelligence Analyst. Produce a comprehensive, source-cited analysis of {{company_name}}.

Context (optional):
- Website: {{company_url}}
- Ticker: {{ticker}}
- Country: {{country}}
- Depth: {{analysis_depth}}
- Focus Areas: {{focus_areas}}
- Time Horizon: {{time_horizon}}
- Require Sources: {{require_sources}}
- Max Sources: {{max_sources}}

Instructions:
1) Research using reputable, up-to-date sources. Prioritize the official site, press releases, regulatory filings (e.g., 10-K), credible news, and analyst reports.
2) Cite every material claim with numbered citations and direct URLs. Avoid paywalled/opaque links when possible.
3) If information is uncertain or conflicting, clearly mark assumptions and provide confidence scores (0-1) per field.
4) Keep content factual, concise, and business-actionable.
5) Do NOT fabricate IDs or timestamps. Leave id/user_id/company_profile_id/organization_id/analysis_id as null unless explicitly provided. Do NOT set created_at/updated_at/completed_at.

Must Cover:
- Company Overview: description, products/services, customer segments.
- Market Position: differentiation, moat, market share (est.), geographies.
- SWOT: strengths, weaknesses, opportunities, threats.
- Pricing Strategy: tiers, ARPU where available, discounting signals.
- Go-To-Market: channels, partnerships, sales motion, ICP.
- Financials: revenue (range/est.), growth trajectory, notable funding rounds/investors; use {{ticker}} if public.
- Team: key executives; notable hires/departures.
- Signals: sentiment, hiring velocity, product velocity, roadmap hints.

Output strictly as JSON with these exact top-level keys:
{
  "id": null,
  "user_id": null,
  "company_profile_id": null,
  "organization_id": null,
  "analysis_id": null,
  "session_id": "",
  "status": "",
  "name": "",
  "website_url": "",
  "industry": "",
  "description": "",
  "employee_count": null,
  "founded_year": null,
  "headquarters": "",
  "business_model": "",
  "target_market": [],
  "strengths": [],
  "weaknesses": [],
  "opportunities": [],
  "threats": [],
  "pricing_strategy": {},
  "funding_info": {},
  "social_media_presence": {},
  "market_position": "",
  "analysis_data": {"raw_notes": "", "citations": [{"title": "", "url": "", "accessed_at": ""}], "extended": { "progress": {}, "provider_runs": {}, "provider_results": {}, "combined": {} }},
  "confidence_scores": {"overview": 0.0, "financials": 0.0, "pricing": 0.0, "gtm": 0.0, "swot": 0.0},
  "data_quality_score": 0.0,
  "data_completeness_score": 0.0,
  "market_sentiment_score": 0.0,
  "actual_cost": 0.0,
  "website_verified": false,
  "employee_count_verified": false,
  "created_at": null,
  "updated_at": null,
  "completed_at": null
}

Notes:
- Ensure citations include canonical, direct URLs.
- If {{require_sources}} is true, omit any claim lacking a source or mark confidence <= 0.4.
- Keep numbers as numbers where possible; use null when unknown.
`;
  }

  /**
   * Ensure a prompt's content (by key) matches the enhanced template. If different,
   * create a new version preserving metadata.variables.
   */
  public async ensurePromptContentByKey(
    key: string,
    newContent: string,
    changeSummary: string = 'Enhanced content upgrade'
  ): Promise<{ updated: boolean; promptId?: string; versionId?: string }>
  {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { updated: false };

      const { data: p } = await supabase
        .from('prompts')
        .select('*')
        .eq('key', key)
        .maybeSingle();
      if (!p) return { updated: false };

      // Resolve current version
      let currentVersion: DBPromptVersion | null = null;
      if ((p as DBPrompt).current_version_id) {
        const { data: v } = await supabase
          .from('prompt_versions')
          .select('*')
          .eq('id', (p as DBPrompt).current_version_id as any)
          .maybeSingle();
        currentVersion = (v as DBPromptVersion) || null;
      }
      if (!currentVersion) {
        const { data: latest } = await supabase
          .from('prompt_versions')
          .select('*')
          .eq('prompt_id', (p as DBPrompt).id as any)
          .order('version', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        currentVersion = (latest as DBPromptVersion) || null;
      }

      const currentContent = (currentVersion?.content || '').trim();
      const targetContent = newContent.trim();
      if (currentContent === targetContent) return { updated: false, promptId: (p as DBPrompt).id as string };

      const baseMeta: Record<string, unknown> = (currentVersion?.metadata && typeof currentVersion.metadata === 'object')
        ? (currentVersion.metadata as unknown as Record<string, unknown>)
        : {};

      const { data: newV } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: (p as DBPrompt).id as any,
          content: targetContent,
          metadata: baseMeta as any,
          created_by: user.id,
          version: 0
        })
        .select('*')
        .maybeSingle();
      if (!newV) return { updated: false };

      await supabase
        .from('prompts')
        .update({ current_version_id: (newV as DBPromptVersion).id })
        .eq('id', (p as DBPrompt).id);

      await supabase.from('admin_audit_log').insert({
        action: 'prompt_content_upgraded',
        resource_type: 'prompt',
        resource_id: (p as DBPrompt).id,
        admin_user_id: user.id,
        success: true,
        new_values: { version_id: (newV as DBPromptVersion).id, changeSummary }
      } as any);

      return { updated: true, promptId: (p as DBPrompt).id as string, versionId: (newV as DBPromptVersion).id as string };
    } catch (e) {
      console.warn('[PromptManagementService] ensurePromptContentByKey failed:', e);
      return { updated: false };
    }
  }
}

export const promptManagementService = new PromptManagementService();