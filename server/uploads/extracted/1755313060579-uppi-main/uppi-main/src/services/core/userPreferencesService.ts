import { supabase } from "@/integrations/supabase/client";

export interface UserPreferences {
  id: string;
  user_id: string;
  ui_preferences: any;
  notification_settings: any;
  privacy_settings: any;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesUpdate {
  ui_preferences?: any;
  notification_settings?: any;
  privacy_settings?: any;
}

export class UserPreferencesService {
  /**
   * Get current user preferences
   */
  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no preferences exist, create default ones
      if (!data) {
        return await this.createDefaultPreferences(user.id);
      }

      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(updates: UserPreferencesUpdate): Promise<UserPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return null;
    }
  }

  /**
   * Create default preferences for new user
   */
  private async createDefaultPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ui_preferences: {
            language: 'en',
            timezone: 'UTC',
            currency: 'USD',
            date_format: 'MM/DD/YYYY',
            time_format: '12h',
            theme: 'system'
          },
          notification_settings: {
            email_notifications: true,
            push_notifications: true,
            marketing_emails: false,
            weekly_digest: true
          },
          privacy_settings: {
            analytics_tracking: true,
            data_sharing: false
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return null;
    }
  }

  /**
   * Get language preference
   */
  async getLanguage(): Promise<string> {
    const preferences = await this.getPreferences();
    return preferences?.ui_preferences?.language || 'en';
  }

  /**
   * Get timezone preference
   */
  async getTimezone(): Promise<string> {
    const preferences = await this.getPreferences();
    return preferences?.ui_preferences?.timezone || 'UTC';
  }

  /**
   * Get currency preference
   */
  async getCurrency(): Promise<string> {
    const preferences = await this.getPreferences();
    return preferences?.ui_preferences?.currency || 'USD';
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(notificationPrefs: Record<string, any>): Promise<boolean> {
    try {
      const result = await this.updatePreferences({
        notification_settings: notificationPrefs
      });
      return result !== null;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Update UI preferences like language, timezone, etc.
   */
  async updateUIPreferences(uiPrefs: Record<string, any>): Promise<boolean> {
    try {
      const currentPrefs = await this.getPreferences();
      const mergedUIPrefs = {
        ...currentPrefs?.ui_preferences,
        ...uiPrefs
      };
      
      const result = await this.updatePreferences({
        ui_preferences: mergedUIPrefs
      });
      return result !== null;
    } catch (error) {
      console.error('Error updating UI preferences:', error);
      return false;
    }
  }
}

export const userPreferencesService = new UserPreferencesService();