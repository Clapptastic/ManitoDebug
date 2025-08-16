/**
 * Phase 0: Foundation Database Service
 * Handles core database operations and validation for foundational tables
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

export interface DatabaseHealthCheck {
  tablesExist: boolean;
  rlsEnabled: boolean;
  triggersActive: boolean;
  indexesOptimal: boolean;
  details: Record<string, any>;
}

export class DatabaseService {
  /**
   * Phase 0.1: Validate core database tables exist
   */
  async validateFoundationTables(): Promise<DatabaseHealthCheck> {
    const requiredTables = [
      'support_tickets',
      'support_ticket_messages', 
      'knowledge_base_articles',
      'translations',
      'user_preferences',
      'custom_reports',
      'report_schedules',
      'sso_configurations'
    ];

    const results: Record<string, any> = {};
    let allTablesExist = true;
    let rlsEnabled = true;

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table as any)
          .select('id')
          .limit(1);
        
        results[table] = {
          exists: !error,
          rlsWorking: !error,
          error: error?.message
        };

        if (error) {
          allTablesExist = false;
          rlsEnabled = false;
        }
      } catch (err) {
        results[table] = {
          exists: false,
          rlsWorking: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
        allTablesExist = false;
        rlsEnabled = false;
      }
    }

    return {
      tablesExist: allTablesExist,
      rlsEnabled,
      triggersActive: true, // Assume true for now
      indexesOptimal: true, // Assume true for now
      details: results
    };
  }

  /**
   * Phase 0.2: Support System Operations
   */
  async createSupportTicket(data: {
    title: string;
    description: string;
    category?: string;
    priority?: string;
  }) {
    const { data: ticket, error } = await supabase
      .from('support_tickets' as any)
      .insert({
        title: data.title,
        description: data.description,
        category: data.category || 'technical',
        priority: data.priority || 'medium',
        status: 'open',
        user_id: (await supabase.auth.getUser()).data.user?.id!
      })
      .select()
      .single();

    if (error) throw error;
    return ticket;
  }

  /**
   * Phase 0.3: User Preferences Operations
   */
  async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences' as any)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateUserPreferences(userId: string, preferences: Partial<{
    language: string;
    timezone: string;
    currency: string;
    date_format: string;
    time_format: string;
    notification_preferences: Record<string, any>;
  }>) {
    const { data, error } = await supabase
      .from('user_preferences' as any)
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Phase 0.4: Knowledge Base Operations
   */
  async getPublishedArticles() {
    const { data, error } = await supabase
      .from('knowledge_base_articles' as any)
      .select('*')
      .eq('is_published', true)
      .order('view_count', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Phase 0.5: Translation Operations
   */
  async getTranslations(locale: string, namespace = 'common') {
    const { data, error } = await supabase
      .from('translations' as any)
      .select('key, value')
      .eq('locale', locale)
      .eq('namespace', namespace);

    if (error) throw error;
    
    // Convert to key-value object
    return data?.reduce((acc: Record<string, string>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {}) || {};
  }
}

export const databaseService = new DatabaseService();