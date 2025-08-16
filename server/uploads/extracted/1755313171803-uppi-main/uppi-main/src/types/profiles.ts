export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  company?: string;
  role?: string;
  location?: string;
  website?: string;
  phone?: string;
  timezone?: string;
  preferences?: ProfilePreferences;
  created_at: string;
  updated_at: string;
}

export interface ProfilePreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: NotificationPreferences;
  dashboard_layout?: 'default' | 'compact' | 'detailed';
  ai_assistance_level?: 'basic' | 'standard' | 'advanced';
}

export interface NotificationPreferences {
  email_notifications?: boolean;
  push_notifications?: boolean;
  marketing_emails?: boolean;
  feature_updates?: boolean;
  security_alerts?: boolean;
}

export interface ProfileUpdateRequest {
  display_name?: string;
  full_name?: string;
  bio?: string;
  company?: string;
  role?: string;
  location?: string;
  website?: string;
  phone?: string;
  timezone?: string;
  preferences?: ProfilePreferences;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: ProfileValidationError[];
  warnings: ProfileValidationWarning[];
}

export interface ProfileValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ProfileValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}