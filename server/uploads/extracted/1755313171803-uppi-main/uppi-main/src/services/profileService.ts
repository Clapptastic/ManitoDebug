import { supabase } from '@/integrations/supabase/client';
import { 
  UserProfile, 
  ProfileUpdateRequest, 
  ProfileValidationResult,
  ProfileValidationError,
  ProfileValidationWarning
} from '@/types/profiles';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

export class ProfileService {
  
  /**
   * Get current user's profile
   */
  async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return data ? {
        ...data,
        preferences: data.preferences as any
      } as UserProfile : null;
    } catch (error) {
      console.error('Error getting current profile:', error);
      return null;
    }
  }

  /**
   * Update user profile with validation
   */
  async updateProfile(updates: ProfileUpdateRequest): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate the update request
      const validation = this.validateProfileUpdate(updates);
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast({
            title: 'Profile Update Warning',
            description: warning.message,
            variant: 'default',
          });
        });
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: updates.display_name,
          full_name: updates.full_name,
          bio: updates.bio,
          avatar_url: updates.website, // Map to existing field
          preferences: updates.preferences as any
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
      });

      return {
        ...data,
        preferences: data.preferences as any
      } as UserProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
      throw error;
    }
  }

  /**
   * Create initial profile for new user
   */
  async createProfile(initialData: Partial<ProfileUpdateRequest> = {}): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Extract name from user metadata if available
      const displayName = initialData.display_name || 
                          user.user_metadata?.name || 
                          user.user_metadata?.full_name ||
                          user.email?.split('@')[0];

      const profileData = {
        user_id: user.id,
        display_name: displayName,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
        preferences: initialData.preferences as any
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        preferences: data.preferences as any
      } as UserProfile;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Validate profile update data
   */
  validateProfileUpdate(updates: ProfileUpdateRequest): ProfileValidationResult {
    const errors: ProfileValidationError[] = [];
    const warnings: ProfileValidationWarning[] = [];

    // Validate display name
    if (updates.display_name !== undefined) {
      if (!updates.display_name?.trim()) {
        errors.push({
          field: 'display_name',
          message: 'Display name cannot be empty',
          code: 'REQUIRED'
        });
      } else if (updates.display_name.length > 50) {
        errors.push({
          field: 'display_name',
          message: 'Display name must be less than 50 characters',
          code: 'MAX_LENGTH'
        });
      }
    }

    // Validate website URL
    if (updates.website && updates.website.trim()) {
      try {
        new URL(updates.website);
      } catch {
        errors.push({
          field: 'website',
          message: 'Please enter a valid website URL',
          code: 'INVALID_URL'
        });
      }
    }

    // Validate phone number (basic validation)
    if (updates.phone && updates.phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(updates.phone)) {
        errors.push({
          field: 'phone',
          message: 'Please enter a valid phone number',
          code: 'INVALID_PHONE'
        });
      }
    }

    // Validate bio length
    if (updates.bio && updates.bio.length > 500) {
      errors.push({
        field: 'bio',
        message: 'Bio must be less than 500 characters',
        code: 'MAX_LENGTH'
      });
    }

    // Check for completeness warnings
    if (!updates.bio || updates.bio.trim().length < 20) {
      warnings.push({
        field: 'bio',
        message: 'Consider adding a more detailed bio to help others understand your background',
        suggestion: 'Add information about your role, experience, or interests'
      });
    }

    if (!updates.company) {
      warnings.push({
        field: 'company',
        message: 'Adding your company information can help with networking',
        suggestion: 'Enter your current company or organization'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Delete user profile
   */
  async deleteProfile(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile Deleted',
        description: 'Your profile has been deleted',
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete profile',
        variant: 'destructive',
      });
      throw error;
    }
  }

  /**
   * Check if profile is complete
   */
  isProfileComplete(profile: UserProfile): boolean {
    const requiredFields = ['display_name', 'bio'];
    const recommendedFields = ['company', 'role', 'location'];
    
    const hasRequired = requiredFields.every(field => 
      profile[field] && profile[field].trim().length > 0
    );
    
    const hasRecommended = recommendedFields.filter(field => 
      profile[field] && profile[field].trim().length > 0
    ).length >= 2;

    return hasRequired && hasRecommended;
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompletionPercentage(profile: UserProfile): number {
    const fields = [
      'display_name', 'full_name', 'bio', 'company', 
      'role', 'location', 'website', 'avatar_url'
    ];
    
    const completedFields = fields.filter(field => 
      profile[field] && profile[field].toString().trim().length > 0
    ).length;

    return Math.round((completedFields / fields.length) * 100);
  }
}

export const profileService = new ProfileService();