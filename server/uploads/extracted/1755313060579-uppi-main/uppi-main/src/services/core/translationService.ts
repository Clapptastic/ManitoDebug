import { supabase } from "@/integrations/supabase/client";

export interface Translation {
  id: string;
  key: string;
  locale: string;
  value: string;
  namespace: string;
  created_at: string;
  updated_at: string;
}

export interface TranslationCreate {
  key: string;
  locale: string;
  value: string;
  namespace?: string;
}

export class TranslationService {
  /**
   * Get translation by key and locale
   */
  async getTranslation(key: string, locale: string = 'en', namespace: string = 'common'): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('value')
        .eq('key', key)
        .eq('locale', locale)
        .eq('namespace', namespace)
        .single();

      if (error) {
        console.warn(`Translation not found: ${key} (${locale})`);
        return null;
      }

      return data?.value || null;
    } catch (error) {
      console.error('Error fetching translation:', error);
      return null;
    }
  }

  /**
   * Get all translations for a locale and namespace
   */
  async getTranslations(locale: string = 'en', namespace: string = 'common'): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('key, value')
        .eq('locale', locale)
        .eq('namespace', namespace);

      if (error) throw error;

      const translations: Record<string, string> = {};
      data?.forEach(item => {
        translations[item.key] = item.value;
      });

      return translations;
    } catch (error) {
      console.error('Error fetching translations:', error);
      return {};
    }
  }

  /**
   * Get all available locales
   */
  async getAvailableLocales(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('locale');

      if (error) throw error;

      // Get unique locales manually
      const locales = Array.from(new Set(data?.map(item => item.locale) || []));
      return locales.length > 0 ? locales : ['en'];
    } catch (error) {
      console.error('Error fetching available locales:', error);
      return ['en'];
    }
  }

  /**
   * Create or update translation (Admin only)
   */
  async upsertTranslation(translation: TranslationCreate): Promise<Translation | null> {
    try {
      const { data, error } = await supabase
        .from('translations')
        .upsert({
          key: translation.key,
          locale: translation.locale,
          value: translation.value,
          namespace: translation.namespace || 'common'
        }, {
          onConflict: 'key,locale,namespace'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting translation:', error);
      return null;
    }
  }

  /**
   * Delete translation (Admin only)
   */
  async deleteTranslation(key: string, locale: string, namespace: string = 'common'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('key', key)
        .eq('locale', locale)
        .eq('namespace', namespace);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting translation:', error);
      return false;
    }
  }
}

export const translationService = new TranslationService();